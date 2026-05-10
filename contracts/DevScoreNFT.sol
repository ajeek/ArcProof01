// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IReputationRegistry {
    function getDevScore(address developer)
        external
        view
        returns (uint8 score, string memory tier);
}

contract DevScoreNFT is ERC721 {
    using Strings for uint256;

    struct Snapshot {
        uint8 score;
        string tier;
        uint256 lastUpdated;
    }

    IReputationRegistry public immutable registry;

    mapping(address => uint256) public tokenIds;
    mapping(uint256 => Snapshot) public snapshots;

    uint256 private nextTokenId = 1;

    event NFTRefreshed(address indexed developer, uint8 score, string tier);

    error NonTransferable();
    error NotMinted();

    constructor(address _registry) ERC721("ArcProof DevScore", "APDS") {
        registry = IReputationRegistry(_registry);
    }

    function _deriveTier(uint8 score) internal pure returns (string memory) {
        if (score >= 90) return "Elite";
        if (score >= 70) return "Proven";
        if (score >= 40) return "Reliable";
        return "Rookie";
    }

    function refreshNFT() external {
        (uint8 score, ) = registry.getDevScore(msg.sender);

        uint256 tokenId = tokenIds[msg.sender];

        string memory tier = _deriveTier(score);

        if (tokenId == 0) {
            tokenId = nextTokenId++;
            _safeMint(msg.sender, tokenId);
            tokenIds[msg.sender] = tokenId;
        }

        Snapshot storage s = snapshots[tokenId];

        s.score = score;
        s.tier = tier;
        s.lastUpdated = block.timestamp;

        emit NFTRefreshed(msg.sender, score, tier);
    }

    function getSnapshot(address developer)
        external
        view
        returns (uint8, string memory, uint256)
    {
        uint256 tokenId = tokenIds[developer];
        if (tokenId == 0) revert NotMinted();

        Snapshot memory s = snapshots[tokenId];
        return (s.score, s.tier, s.lastUpdated);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);

        Snapshot memory s = snapshots[tokenId];

        return string(
            abi.encodePacked(
                "data:application/json,",
                '{"name":"ArcProof DevScore","description":"Onchain reputation snapshot","attributes":[',
                '{"trait_type":"Score","value":',
                uint256(s.score).toString(),
                '},{"trait_type":"Tier","value":"',
                s.tier,
                '"}]}'
            )
        );
    }
}
