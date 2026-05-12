// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract JobEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable USDC;

    // Arc Testnet USDC (from Arc docs)
    address public constant ARC_TESTNET_USDC = 0x3600000000000000000000000000000000000000;

    enum JobStatus { Created, Funded, Assigned, WorkSubmitted, Completed, Disputed, Cancelled, Rejected }

    struct Job {
        address employer;
        address developer;
        uint256 amount;
        uint256 upfrontAmount;
        string metadataURL;
        JobStatus status;
        bool upfrontPaid;
        uint256 upfrontPercent;
    }

    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;
    mapping(address => uint256) public activeJobsCount;
    mapping(uint256 => uint256) public rejectionTimestamps;
    mapping(uint256 => uint256) public disputeTimestamps;
    mapping(uint256 => uint8) public resubmissionCount;

    event JobCreated(uint256 indexed jobId, address indexed employer, address indexed developer, uint256 amount, uint256 upfrontPercent);
    event JobFunded(uint256 indexed jobId);
    event JobAssigned(uint256 indexed jobId, address indexed developer);
    event WorkSubmitted(uint256 indexed jobId, string proofHash);
    event WorkRejected(uint256 indexed jobId, uint256 rejectionTimestamp, string reason);
    event PaymentReleased(uint256 indexed jobId, address indexed to, uint256 amount);
    event DisputeOpened(uint256 indexed jobId, address indexed opener);
    event DisputeResolved(uint256 indexed jobId, bool favorDeveloper);
    event JobClosed(uint256 indexed jobId, string reason);
    event Refunded(uint256 indexed jobId, address indexed receiver, uint256 amount);

    // Funding Debug Events
    event FundingAttempted(uint256 indexed jobId, address employer, uint256 amount);
    event FundingSucceeded(uint256 indexed jobId, uint256 newBalance);

    error Unauthorized();
    error InvalidStatus();
    error InvalidJob();
    error InvalidAddress();
    error InvalidAmount();
    error JobLimitReached();
    error JobAlreadyAssigned();
    error InsufficientAllowance();
    error FundingFailed();

    constructor() {
        USDC = IERC20(ARC_TESTNET_USDC);
    }

    // ===================== CREATE JOB =====================

    function createJob(
        address _developer,
        uint256 _amount,
        uint256 _upfrontPercent,
        string calldata _metadataURL
    ) external returns (uint256) {
        if (_amount == 0) revert InvalidAmount();

        if (_upfrontPercent > 50) _upfrontPercent = 50;

        uint256 upfrontAmount = (_amount * _upfrontPercent) / 100;
        uint256 jobId = ++jobCount;

        jobs[jobId] = Job({
            employer: msg.sender,
            developer: _developer, // Can be address(0) for open jobs
            amount: _amount,
            upfrontAmount: upfrontAmount,
            metadataURL: _metadataURL,
            status: JobStatus.Created,
            upfrontPaid: false,
            upfrontPercent: _upfrontPercent
        });

        emit JobCreated(jobId, msg.sender, _developer, _amount, _upfrontPercent);
        return jobId;
    }

    // ===================== FUND JOB =====================

    function fundJob(uint256 _jobId) external nonReentrant {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();

        Job storage job = jobs[_jobId];

        if (msg.sender != job.employer) revert Unauthorized();
        if (job.status != JobStatus.Created) revert InvalidStatus();

        // 1. Enforce allowance validation before transfer
        uint256 allowance = USDC.allowance(msg.sender, address(this));
        if (allowance < job.amount) revert InsufficientAllowance();

        emit FundingAttempted(_jobId, msg.sender, job.amount);

        uint256 balanceBefore = USDC.balanceOf(address(this));

        // 2. Execute transferFrom
        USDC.safeTransferFrom(msg.sender, address(this), job.amount);

        uint256 balanceAfter = USDC.balanceOf(address(this));

        // 3. Enforce balance confirmation after transfer
        if (balanceAfter != balanceBefore + job.amount) revert FundingFailed();

        job.status = JobStatus.Funded;

        emit JobFunded(_jobId);
        emit FundingSucceeded(_jobId, balanceAfter);
    }

    // ===================== CANCEL JOB =====================

    function cancelJob(uint256 _jobId) external nonReentrant {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();
        _checkTimeout(_jobId);
        
        Job storage job = jobs[_jobId];

        if (msg.sender != job.employer) revert Unauthorized();
        if (job.status != JobStatus.Created && job.status != JobStatus.Funded) revert InvalidStatus();

        if (job.status == JobStatus.Funded) {
             USDC.safeTransfer(job.employer, job.amount);
             emit Refunded(_jobId, job.employer, job.amount);
        }

        job.status = JobStatus.Cancelled;
        emit JobClosed(_jobId, "Job Cancelled by Employer");
    }

    // ===================== ACCEPT JOB =====================

    function acceptJob(uint256 _jobId) external {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();
        _checkTimeout(_jobId);

        Job storage job = jobs[_jobId];

        if (job.status != JobStatus.Funded) revert InvalidStatus();
        if (job.developer != address(0) && job.developer != msg.sender) revert Unauthorized();
        if (job.developer != address(0) && job.status == JobStatus.Assigned) revert JobAlreadyAssigned();
        
        // Employer cannot accept their own job
        if (msg.sender == job.employer) revert Unauthorized();

        if (activeJobsCount[msg.sender] >= 100) revert JobLimitReached();

        // Perform upfront transfer if applicable BEFORE state mutation
        if (job.upfrontAmount > 0 && !job.upfrontPaid) {
            USDC.safeTransfer(msg.sender, job.upfrontAmount);
            job.upfrontPaid = true;
        }

        job.developer = msg.sender;
        job.status = JobStatus.Assigned;
        activeJobsCount[msg.sender]++;

        emit JobAssigned(_jobId, msg.sender);
    }

    // ===================== SUBMIT WORK =====================

    function submitWork(uint256 _jobId, string calldata _proofHash) external {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();
        _checkTimeout(_jobId);

        Job storage job = jobs[_jobId];

        if (msg.sender != job.developer) revert Unauthorized();
        if (job.status != JobStatus.Assigned && job.status != JobStatus.Rejected) revert InvalidStatus();

        if (job.status == JobStatus.Rejected) {
            if (resubmissionCount[_jobId] >= 1) revert InvalidStatus();
            resubmissionCount[_jobId]++;
            delete rejectionTimestamps[_jobId];
        }

        job.status = JobStatus.WorkSubmitted;

        emit WorkSubmitted(_jobId, _proofHash);
    }

    // ===================== APPROVE WORK =====================

    function approveWork(uint256 _jobId) external nonReentrant {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();
        _checkTimeout(_jobId);

        Job storage job = jobs[_jobId];

        if (msg.sender != job.employer) revert Unauthorized();
        if (job.status != JobStatus.WorkSubmitted) revert InvalidStatus();

        uint256 remaining = job.amount - (job.upfrontPaid ? job.upfrontAmount : 0);

        if (remaining > 0) {
            USDC.safeTransfer(job.developer, remaining);
        }

        job.status = JobStatus.Completed;
        if (activeJobsCount[job.developer] > 0) {
            activeJobsCount[job.developer]--;
        }

        emit PaymentReleased(_jobId, job.developer, job.amount);
    }

    // ===================== REJECT WORK =====================

    function rejectWork(uint256 _jobId, string calldata _reason) external nonReentrant {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();
        _checkTimeout(_jobId);

        Job storage job = jobs[_jobId];

        if (msg.sender != job.employer) revert Unauthorized();
        if (job.status != JobStatus.WorkSubmitted) revert InvalidStatus();

        if (resubmissionCount[_jobId] >= 1) {
            // Second rejection -> Dispute (Final)
            job.status = JobStatus.Disputed;
            disputeTimestamps[_jobId] = block.timestamp;
            emit DisputeOpened(_jobId, msg.sender);
        } else {
            // First rejection -> Rejected (Allows one resubmission)
            job.status = JobStatus.Rejected;
            rejectionTimestamps[_jobId] = block.timestamp;
        }

        emit WorkRejected(_jobId, block.timestamp, _reason);
    }

    // ===================== REJECTION WORKFLOW =====================

    /**
     * @dev Developer accepts rejection and voluntarily exits the job.
     */
    function acceptRejection(uint256 _jobId) external {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();
        _checkTimeout(_jobId);
        
        Job storage job = jobs[_jobId];

        if (msg.sender != job.developer) revert Unauthorized();
        if (job.status != JobStatus.Rejected) revert InvalidStatus();

        _refundAndClose(_jobId, "Developer Accepted Rejection");
    }

    /**
     * @dev Synchronizes job state by checking timeouts.
     */
    function syncState(uint256 _jobId) external {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();
        _checkTimeout(_jobId);
    }

    function _checkTimeout(uint256 _jobId) internal {
        Job storage job = jobs[_jobId];
        if (job.status == JobStatus.Rejected) {
            if (rejectionTimestamps[_jobId] != 0 && block.timestamp >= rejectionTimestamps[_jobId] + 24 hours) {
                _refundAndClose(_jobId, "Rejection Expired");
            }
        } else if (job.status == JobStatus.Disputed) {
            if (disputeTimestamps[_jobId] != 0 && block.timestamp >= disputeTimestamps[_jobId] + 24 hours) {
                _refundAndClose(_jobId, "Dispute Expired - Auto Refund");
            }
        }
    }

    function _refundAndClose(uint256 _jobId, string memory _reason) internal {
        Job storage job = jobs[_jobId];
        address dev = job.developer;

        if (activeJobsCount[dev] > 0) {
            activeJobsCount[dev]--;
        }

        uint256 remaining = job.amount - (job.upfrontPaid ? job.upfrontAmount : 0);
        job.status = JobStatus.Cancelled;
        
        if (remaining > 0) {
            USDC.safeTransfer(job.employer, remaining);
            emit Refunded(_jobId, job.employer, remaining);
        }

        delete rejectionTimestamps[_jobId];
        delete disputeTimestamps[_jobId];
        // resubmissionCount stays for audit

        emit JobClosed(_jobId, _reason);
    }

    // ===================== DISPUTE =====================

    function openDispute(uint256 _jobId) external {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();
        _checkTimeout(_jobId);

        Job storage job = jobs[_jobId];

        // ONLY developer can open dispute
        if (msg.sender != job.developer) revert Unauthorized();

        if (
            job.status != JobStatus.WorkSubmitted &&
            job.status != JobStatus.Rejected
        ) revert InvalidStatus();

        if (job.status == JobStatus.Disputed) revert InvalidStatus();

        job.status = JobStatus.Disputed;
        disputeTimestamps[_jobId] = block.timestamp;

        emit DisputeOpened(_jobId, msg.sender);
    }

    function resolveDispute(uint256 _jobId, bool _favorDeveloper) external nonReentrant {
        if (_jobId == 0 || _jobId > jobCount) revert InvalidJob();
        _checkTimeout(_jobId);

        Job storage job = jobs[_jobId];

        if (msg.sender != job.employer) revert Unauthorized();
        if (job.status != JobStatus.Disputed) revert InvalidStatus();

        uint256 remaining = job.amount - (job.upfrontPaid ? job.upfrontAmount : 0);

        if (_favorDeveloper) {
            if (remaining > 0) {
                USDC.safeTransfer(job.developer, remaining);
            }

            job.status = JobStatus.Completed;
            if (activeJobsCount[job.developer] > 0) activeJobsCount[job.developer]--;

            emit PaymentReleased(_jobId, job.developer, job.amount);
        } else {
            if (remaining > 0) {
                USDC.safeTransfer(job.employer, remaining);
                emit Refunded(_jobId, job.employer, remaining);
            }

            job.status = JobStatus.Cancelled;
            if (activeJobsCount[job.developer] > 0) activeJobsCount[job.developer]--;
        }

        emit DisputeResolved(_jobId, _favorDeveloper);
    }
}
