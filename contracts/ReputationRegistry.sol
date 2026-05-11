// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract ReputationRegistry {
    using ECDSA for bytes32;

    struct DeveloperProfile {
        uint256 completedJobs;
        uint256 failedJobs;
        uint256 totalEarnedUSDC;
        uint256 disputesWon;
        uint256 disputesLost;
        uint256 lastActiveTimestamp;
        uint256 weightedDisputeLoss; // Impact weighting for disputes
        uint256 stabilityPoints;     // Tracking consistency over time
        bool exists;
    }

    struct EmployerProfile {
        uint256 jobsCreated;
        uint256 jobsFunded;
        uint256 workSubmittedCount;
        uint256 paymentsReleased;
        uint256 disputesOpened;
        uint256 disputesLost; // Disputes where dev was favored
        uint256 totalFundedUSDC;
        uint256 lastActiveTimestamp;
        bool exists;
    }

    struct ReputationState {
        uint8 reliabilityScore;     // 0-100
        uint8 disputeIntegrityScore; // 0-100
        uint8 activityScore;        // 0-100
        uint8 earnedValueScore;     // 0-100 (or FundedValue for employers)
        uint8 coreIndex;            // 0-100
        string riskProfile;         // "Low", "Medium", "High"
        string tier;                // "Rookie", "Reliable", "Proven", "Elite"
    }

    address public owner;
    address public indexer;
    address public attestationSigner;

    mapping(address => string) public addressToGithub;
    mapping(string => address) public githubToAddress;
    mapping(address => DeveloperProfile) public devProfiles;
    mapping(address => EmployerProfile) public employerProfiles;
    mapping(uint256 => bool) public jobScored; // Idempotency check for terminal outcomes
    mapping(uint256 => bool) public employerJobCreated; // Idempotency for created state
    mapping(uint256 => bool) public employerJobFunded;  // Idempotency for funded state
    mapping(uint256 => bool) public employerWorkSubmitted; // Idempotency for submitted state

    event ReputationUpdated(
        address indexed developer,
        uint8 coreIndex,
        string tier,
        string riskProfile
    );

    event EmployerReputationUpdated(
        address indexed employer,
        uint8 coreIndex,
        string tier,
        string riskProfile
    );

    event StatsUpdated(
        address indexed developer,
        uint256 completedJobs,
        uint256 failedJobs,
        uint256 totalEarnedUSDC,
        uint256 disputesWon,
        uint256 disputesLost,
        uint256 lastActiveTimestamp
    );

    event EmployerStatsUpdated(
        address indexed employer,
        uint256 jobsCreated,
        uint256 jobsFunded,
        uint256 paymentsReleased,
        uint256 disputesOpened,
        uint256 disputesLost,
        uint256 lastActiveTimestamp
    );

    event IndexerChanged(address indexed oldIndexer, address indexed newIndexer);
    event AttestationSignerChanged(address indexed oldSigner, address indexed newSigner);
    event GithubLinked(address indexed developer, string githubUsername);

    error NotOwner();
    error NotIndexer();
    error InvalidAddress();
    error GithubAlreadyLinked();
    error GithubInUse();
    error InvalidSignature();
    error AttestationExpired();

    modifier onlyIndexer() {
        if (msg.sender != indexer) revert NotIndexer();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _indexer, address _attestationSigner) {
        if (_indexer == address(0) || _attestationSigner == address(0)) revert InvalidAddress();
        owner = msg.sender;
        indexer = _indexer;
        attestationSigner = _attestationSigner;
    }

    function bindGithubWithSignature(
        address _developer,
        string calldata _githubUsername,
        uint256 _timestamp,
        bytes calldata _signature
    ) external {
        if (msg.sender != _developer) revert InvalidSignature();
        if (bytes(addressToGithub[_developer]).length > 0) revert GithubAlreadyLinked();
        if (githubToAddress[_githubUsername] != address(0)) revert GithubInUse();
        if (block.timestamp > _timestamp + 1 hours) revert AttestationExpired();

        bytes32 messageHash = keccak256(abi.encodePacked(_developer, _githubUsername, _timestamp, address(this)));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        address signer = ethSignedMessageHash.recover(_signature);
        if (signer != attestationSigner) revert InvalidSignature();

        addressToGithub[_developer] = _githubUsername;
        githubToAddress[_githubUsername] = _developer;

        emit GithubLinked(_developer, _githubUsername);
    }

    function bindGithub(address _developer, string calldata _githubUsername) external onlyIndexer {
        if (bytes(addressToGithub[_developer]).length > 0) revert GithubAlreadyLinked();
        if (githubToAddress[_githubUsername] != address(0)) revert GithubInUse();

        addressToGithub[_developer] = _githubUsername;
        githubToAddress[_githubUsername] = _developer;

        emit GithubLinked(_developer, _githubUsername);
    }

    function unbindGithub(address _developer) external onlyIndexer {
        string memory username = addressToGithub[_developer];
        delete githubToAddress[username];
        delete addressToGithub[_developer];
    }

    function getDevScore(address _developer) external view returns (uint8 score, string memory tier) {
        (uint8 coreIndex, string memory t, ) = getReputationSignals(_developer);
        return (coreIndex, t);
    }

    function getEmployerScore(address _employer) external view returns (uint8 score, string memory tier) {
        (uint8 coreIndex, string memory t, ) = getEmployerReputationSignals(_employer);
        return (coreIndex, t);
    }

    function updateStats(
        uint256 _jobId,
        address _developer,
        uint256 _completed,
        uint256 _failed,
        uint256 _earnings,
        uint256 _jobValue,
        bool _disputeWon,
        bool _disputeLost
    ) external onlyIndexer {
        if (jobScored[_jobId]) return;
        jobScored[_jobId] = true;

        DeveloperProfile storage p = devProfiles[_developer];
        if (!p.exists) p.exists = true;

        p.completedJobs += _completed;
        p.failedJobs += _failed;
        p.totalEarnedUSDC += _earnings;

        if (_disputeWon) {
            p.disputesWon += 1;
        }
        if (_disputeLost) {
            p.disputesLost += 1;
            p.weightedDisputeLoss += _jobValue;
        }

        // Stability Points: reward consistency (up to a ceiling)
        uint256 timeSinceLast = block.timestamp - p.lastActiveTimestamp;
        if (timeSinceLast < 14 days && p.lastActiveTimestamp > 0) {
            if (timeSinceLast > 1 days) {
                p.stabilityPoints += 10;
            }
        } else if (timeSinceLast >= 14 days && p.lastActiveTimestamp > 0) {
            // Decay stability if returning after long break
            p.stabilityPoints = p.stabilityPoints > 20 ? p.stabilityPoints - 20 : 0;
        }
        if (p.stabilityPoints > 100) p.stabilityPoints = 100;

        p.lastActiveTimestamp = block.timestamp;

        (uint8 coreIndex, string memory tier, string memory risk) = getReputationSignals(_developer);

        emit StatsUpdated(
            _developer,
            p.completedJobs,
            p.failedJobs,
            p.totalEarnedUSDC,
            p.disputesWon,
            p.disputesLost,
            p.lastActiveTimestamp
        );

        emit ReputationUpdated(_developer, coreIndex, tier, risk);
    }

    function updateEmployerStats(
        uint256 _jobId,
        address _employer,
        bool _created,
        bool _funded,
        bool _workSubmitted,
        bool _released,
        bool _disputeOpened,
        bool _disputeLost,
        uint256 _amount
    ) external onlyIndexer {
        EmployerProfile storage p = employerProfiles[_employer];
        if (!p.exists) p.exists = true;

        if (_created && !employerJobCreated[_jobId]) {
            p.jobsCreated += 1;
            employerJobCreated[_jobId] = true;
        }
        if (_funded && !employerJobFunded[_jobId]) {
            p.jobsFunded += 1;
            p.totalFundedUSDC += _amount;
            employerJobFunded[_jobId] = true;
        }
        if (_workSubmitted && !employerWorkSubmitted[_jobId]) {
            p.workSubmittedCount += 1;
            employerWorkSubmitted[_jobId] = true;
        }
        
        // Terminal states for a job outcome
        if ((_released || _disputeLost) && !jobScored[_jobId]) {
            if (_released) p.paymentsReleased += 1;
            if (_disputeLost) p.disputesLost += 1;
            jobScored[_jobId] = true;
        }

        if (_disputeOpened) p.disputesOpened += 1;

        p.lastActiveTimestamp = block.timestamp;

        (uint8 coreIndex, string memory tier, string memory risk) = getEmployerReputationSignals(_employer);

        emit EmployerStatsUpdated(
            _employer,
            p.jobsCreated,
            p.jobsFunded,
            p.paymentsReleased,
            p.disputesOpened,
            p.disputesLost,
            p.lastActiveTimestamp
        );

        emit EmployerReputationUpdated(_employer, coreIndex, tier, risk);
    }

    function getReputationSignals(address _developer)
        public
        view
        returns (
            uint8 coreIndex,
            string memory tier,
            string memory riskProfile
        )
    {
        ReputationState memory state = computeReputation(_developer);
        return (state.coreIndex, state.tier, state.riskProfile);
    }

    function getEmployerReputationSignals(address _employer)
        public
        view
        returns (
            uint8 coreIndex,
            string memory tier,
            string memory riskProfile
        )
    {
        ReputationState memory state = computeEmployerReputation(_employer);
        return (state.coreIndex, state.tier, state.riskProfile);
    }

    function computeReputation(address _developer) public view returns (ReputationState memory) {
        DeveloperProfile memory p = devProfiles[_developer];
        ReputationState memory s;

        if (!p.exists) {
            s.tier = "Rookie";
            s.riskProfile = "Low";
            return s;
        }

        // 1. Reliability Score (40% weight)
        uint256 totalOutcomes = p.completedJobs + p.failedJobs + p.disputesLost;
        if (totalOutcomes > 0) {
            s.reliabilityScore = uint8((p.completedJobs * 100) / totalOutcomes);
        } else {
            s.reliabilityScore = 60; // Starting point
        }

        // 2. Dispute Integrity (20% weight)
        uint256 totalDisputes = p.disputesWon + p.disputesLost;
        if (totalDisputes > 0) {
            uint256 outcomeScore = (p.disputesWon * 100) / totalDisputes;
            uint256 potentialLoss = p.totalEarnedUSDC + p.weightedDisputeLoss;
            uint256 severityFactor = potentialLoss > 0 ? (p.weightedDisputeLoss * 100) / potentialLoss : 0;
            uint256 integrity = outcomeScore > severityFactor ? outcomeScore - severityFactor : 0;
            s.disputeIntegrityScore = uint8(integrity);
        } else {
            s.disputeIntegrityScore = 85; 
        }

        // 3. Earned Value Score (20% weight)
        uint256 earnings = p.totalEarnedUSDC / 1e6;
        if (earnings >= 25000) s.earnedValueScore = 100;
        else if (earnings >= 10000) s.earnedValueScore = 80;
        else if (earnings >= 5000) s.earnedValueScore = 60;
        else if (earnings >= 1000) s.earnedValueScore = 30;
        else s.earnedValueScore = 10;

        // 4. Activity Score (20% weight)
        uint256 timeSinceLast = block.timestamp - p.lastActiveTimestamp;
        uint256 recencyFactor = timeSinceLast < 30 days ? 100 : (timeSinceLast < 90 days ? 50 : 10);
        s.activityScore = uint8((recencyFactor * 40 + p.stabilityPoints * 60) / 100);

        uint256 riskPenalty = (uint256(100 - s.reliabilityScore) * 50 + 
                              uint256(100 - s.disputeIntegrityScore) * 50) / 100;
        
        if (riskPenalty > 50) s.riskProfile = "High";
        else if (riskPenalty > 20) s.riskProfile = "Medium";
        else s.riskProfile = "Low";

        uint256 weightedIndex = (uint256(s.reliabilityScore) * 35 +
                                uint256(s.disputeIntegrityScore) * 20 +
                                uint256(s.earnedValueScore) * 25 +
                                uint256(s.activityScore) * 20) / 100;
        
        s.coreIndex = uint8(weightedIndex);

        if (keccak256(bytes(s.riskProfile)) == keccak256(bytes("Low")) && s.coreIndex >= 85 && p.completedJobs >= 10) {
            s.tier = "Elite";
        } else if (s.coreIndex >= 70 && p.completedJobs >= 4) {
            s.tier = "Proven";
        } else if (s.coreIndex >= 50) {
            s.tier = "Reliable";
        } else {
            s.tier = "Rookie";
        }

        return s;
    }

    function computeEmployerReputation(address _employer) public view returns (ReputationState memory) {
        EmployerProfile memory p = employerProfiles[_employer];
        ReputationState memory s;

        if (!p.exists) {
            s.tier = "Rookie";
            s.riskProfile = "Low";
            return s;
        }

        // 1. Funding Reliability (30% weight) - jobsFunded / jobsCreated
        if (p.jobsCreated > 0) {
            s.reliabilityScore = uint8((p.jobsFunded * 100) / p.jobsCreated);
        } else {
            s.reliabilityScore = 70;
        }

        // 2. Completion Fairness Ratio (40% weight) - paymentsReleased / workSubmittedCount
        if (p.workSubmittedCount > 0) {
            s.earnedValueScore = uint8((p.paymentsReleased * 100) / p.workSubmittedCount);
        } else {
            s.earnedValueScore = 85; 
        }

        // 3. Dispute Integrity (30% weight) - penalty based on dispute rate and loss ratio
        uint256 disputeRate = p.jobsCreated > 0 ? (p.disputesOpened * 100) / p.jobsCreated : 0;
        uint256 lossRatio = p.disputesOpened > 0 ? (p.disputesLost * 100) / p.disputesOpened : 0;
        
        uint256 integrity = 100;
        if (disputeRate > 0) {
            integrity = integrity > (disputeRate * 5) ? integrity - (disputeRate * 5) : 0;
        }
        if (lossRatio > 0) {
            integrity = integrity > (lossRatio * 2) ? integrity - (lossRatio * 2) : 0;
        }
        s.disputeIntegrityScore = uint8(integrity);

        // 4. Activity Score (Not used in coreIndex weighting for employers in this model, but tracked)
        uint256 timeSinceLast = block.timestamp - p.lastActiveTimestamp;
        s.activityScore = timeSinceLast < 30 days ? 100 : (timeSinceLast < 90 days ? 50 : 10);

        // RISK PROFILE
        uint256 riskPenalty = (uint256(100 - s.reliabilityScore) * 30 + 
                              uint256(100 - s.earnedValueScore) * 40 +
                              uint256(100 - s.disputeIntegrityScore) * 30) / 100;
        
        if (riskPenalty > 40) s.riskProfile = "High";
        else if (riskPenalty > 15) s.riskProfile = "Medium";
        else s.riskProfile = "Low";

        // CORE REPUTATION INDEX
        uint256 weightedIndex = (uint256(s.reliabilityScore) * 30 +
                                uint256(s.earnedValueScore) * 40 +
                                uint256(s.disputeIntegrityScore) * 30) / 100;
        
        s.coreIndex = uint8(weightedIndex);

        // TIER ASSIGNMENT
        if (s.coreIndex >= 85 && p.jobsFunded >= 5) {
            s.tier = "Elite";
        } else if (s.coreIndex >= 70 && p.jobsFunded >= 2) {
            s.tier = "Proven";
        } else if (s.coreIndex >= 50) {
            s.tier = "Reliable";
        } else {
            s.tier = "Rookie";
        }

        return s;
    }

    /**
     * @notice Unified profile view for developers
     */
    function getFullProfile(address user)
        external
        view
        returns (
            DeveloperProfile memory profile,
            ReputationState memory reputation
        )
    {
        return (devProfiles[user], computeReputation(user));
    }

    /**
     * @notice Unified profile view for employers
     */
    function getEmployerFullProfile(address user)
        external
        view
        returns (
            EmployerProfile memory profile,
            ReputationState memory reputation
        )
    {
        return (employerProfiles[user], computeEmployerReputation(user));
    }

    /**
     * @notice Records a rejected work attempt. Impacts reliability score.
     * Does NOT mark job as fully scored, allowing for eventual completion credit.
     */
    function recordRejection(uint256 _jobId, address _developer) external onlyIndexer {
        DeveloperProfile storage p = devProfiles[_developer];
        if (!p.exists) p.exists = true;

        p.failedJobs += 1;
        p.lastActiveTimestamp = block.timestamp;

        // Decay stability slightly on rejection
        p.stabilityPoints = p.stabilityPoints > 5 ? p.stabilityPoints - 5 : 0;

        (uint8 coreIndex, string memory tier, string memory risk) = getReputationSignals(_developer);
        
        emit StatsUpdated(
            _developer,
            p.completedJobs,
            p.failedJobs,
            p.totalEarnedUSDC,
            p.disputesWon,
            p.disputesLost,
            p.lastActiveTimestamp
        );

        emit ReputationUpdated(_developer, coreIndex, tier, risk);
    }

    function setIndexer(address _newIndexer) external onlyOwner {
        if (_newIndexer == address(0)) revert InvalidAddress();

        address old = indexer;
        indexer = _newIndexer;

        emit IndexerChanged(old, _newIndexer);
    }

    function setAttestationSigner(address _newSigner) external onlyOwner {
        if (_newSigner == address(0)) revert InvalidAddress();
        address old = attestationSigner;
        attestationSigner = _newSigner;
        emit AttestationSignerChanged(old, _newSigner);
    }
}
