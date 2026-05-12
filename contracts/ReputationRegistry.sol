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
        uint8 reputationScore;       // CORE INDEX (stored for history)
        string tier;                 // Current tier
        string riskProfile;          // Current risk
        bool exists;
    }

    struct EmployerStats {
        uint256 jobsCreated;
        uint256 jobsFunded;
        uint256 jobsCompleted;
        uint256 jobsCancelled;
        uint256 disputesLost;
        uint256 disputesWon;
        uint256 totalVolume;
        uint256 lastActiveTimestamp;
        uint256 storedScore;
    }

    struct ReputationState {
        uint8 reliabilityScore;
        uint8 disputeIntegrityScore;
        uint8 earnedValueScore;
        uint8 activityScore;
        uint8 coreIndex;
        string tier;
        string riskProfile;
    }

    address public owner;
    address public indexer;
    address public attestationSigner;

    mapping(address => EmployerStats) public employerStats;
    mapping(address => string) public addressToGithub;
    mapping(string => address) public githubToAddress;
    mapping(address => DeveloperProfile) public devProfiles;
    mapping(uint256 => bool) public jobScored; 

    event ReputationUpdated(address indexed developer, uint8 coreIndex, string tier, string riskProfile);
    event EmployerReputationUpdated(
        address indexed employer,
        uint256 score,
        uint256 jobsCreated,
        uint256 jobsCompleted,
        uint256 jobsCancelled
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

    function updateEmployerStats(
        uint256 _jobId,
        address _employer,
        uint8 _eventType,
        uint256 _amount
    ) external onlyIndexer {
        if (jobScored[_jobId] && _eventType != 0) return; // Allow created/funded events if they share jobId but different events
        // Actually, let's just use jobScored for terminal outcomes to avoid double counting
        
        EmployerStats storage s = employerStats[_employer];
        
        if (_eventType == 0) { // JobCreated/Funded
            s.jobsCreated += 1;
            s.jobsFunded += 1;
            s.totalVolume += _amount;
        } else if (_eventType == 1) { // PaymentReleased (Completed)
            if (jobScored[_jobId]) return;
            jobScored[_jobId] = true;
            s.jobsCompleted += 1;
        } else if (_eventType == 2) { // Employer Lost dispute
            if (jobScored[_jobId]) return;
            jobScored[_jobId] = true;
            s.disputesLost += 1;
        } else if (_eventType == 3) { // Employer Won dispute
            if (jobScored[_jobId]) return;
            jobScored[_jobId] = true;
            s.disputesWon += 1;
            s.jobsCompleted += 1;
        } else if (_eventType == 4) { // JobCancelled
            if (jobScored[_jobId]) return;
            jobScored[_jobId] = true;
            s.jobsCancelled += 1;
        }

        s.lastActiveTimestamp = block.timestamp;
        s.storedScore = calculateEmployerScore(_employer);

        emit EmployerReputationUpdated(
            _employer,
            s.storedScore,
            s.jobsCreated,
            s.jobsCompleted,
            s.jobsCancelled
        );
    }

    function calculateEmployerScore(address _employer) public view returns (uint256) {
        EmployerStats memory s = employerStats[_employer];
        if (s.jobsFunded == 0) return 0;

        uint256 completionRate = (s.jobsCompleted * 100) / s.jobsFunded;
        uint256 disputeIntegrity = 100;
        uint256 totalDisputes = s.disputesLost + s.disputesWon;
        if (totalDisputes > 0) {
            disputeIntegrity = (s.disputesWon * 100) / totalDisputes;
        }

        uint256 cancellationPenalty = (s.jobsCancelled * 100) / s.jobsFunded;
        uint256 score = (completionRate * 60 + disputeIntegrity * 40) / 100;
        
        if (score > cancellationPenalty) {
            score -= cancellationPenalty;
        } else {
            score = 0;
        }

        if (score > 100) score = 100;
        return score;
    }

    function getTier(uint256 score) public pure returns (string memory) {
        if (score >= 85) return "Elite";
        if (score >= 70) return "Proven";
        if (score >= 50) return "Reliable";
        return "Rookie";
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

    function getEmployerScore(address _employer) external view returns (uint256 score, string memory tier) {
        score = employerStats[_employer].storedScore;
        tier = getTier(score);
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

        if (_disputeWon) p.disputesWon += 1;
        if (_disputeLost) {
            p.disputesLost += 1;
            p.weightedDisputeLoss += _jobValue;
        }

        uint256 timeSinceLast = block.timestamp - p.lastActiveTimestamp;
        if (timeSinceLast < 14 days && p.lastActiveTimestamp > 0) {
            if (timeSinceLast > 1 days) p.stabilityPoints += 10;
        } else if (timeSinceLast >= 14 days && p.lastActiveTimestamp > 0) {
            p.stabilityPoints = p.stabilityPoints > 20 ? p.stabilityPoints - 20 : 0;
        }
        if (p.stabilityPoints > 100) p.stabilityPoints = 100;

        p.lastActiveTimestamp = block.timestamp;

        (uint8 coreIndex, string memory tier, string memory risk) = getReputationSignals(_developer);
        p.reputationScore = coreIndex;
        p.tier = tier;
        p.riskProfile = risk;

        emit StatsUpdated(_developer, p.completedJobs, p.failedJobs, p.totalEarnedUSDC, p.disputesWon, p.disputesLost, p.lastActiveTimestamp);
        emit ReputationUpdated(_developer, coreIndex, tier, risk);
    }

    function getReputationSignals(address _developer) public view returns (uint8 coreIndex, string memory tier, string memory riskProfile) {
        ReputationState memory state = computeReputation(_developer);
        return (state.coreIndex, state.tier, state.riskProfile);
    }

    function computeReputation(address _developer) public view returns (ReputationState memory) {
        DeveloperProfile memory p = devProfiles[_developer];
        ReputationState memory s;
        if (!p.exists) {
            s.tier = getTier(0);
            s.riskProfile = "Low";
            return s;
        }
        uint256 totalOutcomes = p.completedJobs + p.failedJobs + p.disputesLost;
        s.reliabilityScore = totalOutcomes > 0 ? uint8((p.completedJobs * 100) / totalOutcomes) : 60;

        uint256 totalDisputes = p.disputesWon + p.disputesLost;
        if (totalDisputes > 0) {
            uint256 outcomeScore = (p.disputesWon * 100) / totalDisputes;
            uint256 potentialLoss = p.totalEarnedUSDC + p.weightedDisputeLoss;
            uint256 severityFactor = potentialLoss > 0 ? (p.weightedDisputeLoss * 100) / potentialLoss : 0;
            s.disputeIntegrityScore = uint8(outcomeScore > severityFactor ? outcomeScore - severityFactor : 0);
        } else {
            s.disputeIntegrityScore = 85; 
        }

        uint256 earnings = p.totalEarnedUSDC / 1e6;
        if (earnings >= 25000) s.earnedValueScore = 100;
        else if (earnings >= 10000) s.earnedValueScore = 80;
        else if (earnings >= 5000) s.earnedValueScore = 60;
        else if (earnings >= 1000) s.earnedValueScore = 30;
        else s.earnedValueScore = 10;

        uint256 timeSinceLast = block.timestamp - p.lastActiveTimestamp;
        uint256 recencyFactor = timeSinceLast < 30 days ? 100 : (timeSinceLast < 90 days ? 50 : 10);
        s.activityScore = uint8((recencyFactor * 40 + p.stabilityPoints * 60) / 100);

        uint256 riskPenalty = (uint256(100 - s.reliabilityScore) * 50 + uint256(100 - s.disputeIntegrityScore) * 50) / 100;
        s.riskProfile = riskPenalty > 50 ? "High" : (riskPenalty > 20 ? "Medium" : "Low");

        uint256 weightedIndex = (uint256(s.reliabilityScore) * 35 + uint256(s.disputeIntegrityScore) * 20 + uint256(s.earnedValueScore) * 25 + uint256(s.activityScore) * 20) / 100;
        s.coreIndex = uint8(weightedIndex);
        s.tier = getTier(s.coreIndex);
        return s;
    }

    function getFullProfile(address user) external view returns (DeveloperProfile memory profile, ReputationState memory reputation) {
        return (devProfiles[user], computeReputation(user));
    }

    function getEmployerFullProfile(address user) external view returns (EmployerStats memory profile, uint256 score, string memory tier) {
        profile = employerStats[user];
        score = profile.storedScore;
        tier = getTier(score);
    }

    function recordRejection(uint256 _jobId, address _developer) external onlyIndexer {
        DeveloperProfile storage p = devProfiles[_developer];
        if (!p.exists) p.exists = true;
        p.failedJobs += 1;
        p.lastActiveTimestamp = block.timestamp;
        p.stabilityPoints = p.stabilityPoints > 5 ? p.stabilityPoints - 5 : 0;
        (uint8 coreIndex, string memory tier, string memory risk) = getReputationSignals(_developer);
        emit StatsUpdated(_developer, p.completedJobs, p.failedJobs, p.totalEarnedUSDC, p.disputesWon, p.disputesLost, p.lastActiveTimestamp);
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
