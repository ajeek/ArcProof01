
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  XCircle,
  Github, 
  Wallet, 
  Briefcase, 
  Zap, 
  RefreshCcw, 
  Minus,
  Star,
  Users,
  GitPullRequest,
  Plus, 
  ArrowUpRight,
  Clock,
  CircleCheck,
  CircleAlert,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Paperclip,
  Link,
  CheckCircle2,
  FileArchive,
  Key,
  AlertTriangle,
  Trophy
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useReadContract, 
  useReadContracts,
  useWriteContract, 
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useBalance,
  useSwitchChain,
  usePublicClient
} from 'wagmi';
import { formatUnits, parseUnits, zeroAddress, parseEventLogs } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { USDC_DECIMALS } from './lib/constants';
import { 
  JOB_ESCROW_ADDRESS, 
  JOB_ESCROW_ABI, 
  REPUTATION_REGISTRY_ADDRESS, 
  REPUTATION_REGISTRY_ABI,
  USDC_ADDRESS,
  USDC_ABI
} from './lib/contracts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Icons & UI Components ---

function GitHubHoverPreview({ username }: { username: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible && !data && !loading) {
      setLoading(true);
      fetch(`/api/github-verify?username=${username}`)
        .then(res => res.json())
        .then(d => {
          if (d.valid) setData(d.user);
        })
        .catch(err => console.error("Hover fetch failed", err))
        .finally(() => setLoading(false));
    }
  }, [isVisible, username, data, loading]);

  return (
    <div 
      className="relative group inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help underline decoration-dotted decoration-arc-ink/20 hover:decoration-arc-ink/40 transition-colors">
        @{username}
      </span>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-white rounded-2xl shadow-2xl border border-arc-line p-4 pointer-events-none"
          >
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-arc-ink/20" />
              </div>
            ) : data ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={data.avatar_url} 
                    className="w-12 h-12 rounded-xl shadow-sm border border-arc-line" 
                    alt={username} 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="overflow-hidden">
                    <div className="font-bold text-arc-ink truncate">@{data.login}</div>
                    <div className="text-[10px] uppercase font-bold text-arc-ink/40">GitHub Contributor</div>
                  </div>
                </div>
                {data.bio && <p className="text-[11px] text-arc-ink/60 line-clamp-2 italic leading-tight">"{data.bio}"</p>}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-arc-paper p-2 rounded-xl text-center border border-arc-line/50">
                    <div className="text-[8px] uppercase font-bold text-arc-ink/30 flex items-center justify-center gap-1">
                      <Star className="w-2 h-2" /> Stars
                    </div>
                    <div className="text-sm font-bold">{data.total_stars || 0}</div>
                  </div>
                  <div className="bg-arc-paper p-2 rounded-xl text-center border border-arc-line/50">
                    <div className="text-[8px] uppercase font-bold text-arc-ink/30 flex items-center justify-center gap-1">
                      <Users className="w-2 h-2" /> Followers
                    </div>
                    <div className="text-sm font-bold">{data.followers || 0}</div>
                  </div>
                  <div className="bg-arc-paper p-2 rounded-xl text-center border border-arc-line/50">
                    <div className="text-[8px] uppercase font-bold text-arc-ink/30 flex items-center justify-center gap-1">
                      <GitPullRequest className="w-2 h-2" /> PRs
                    </div>
                    <div className="text-sm font-bold">{data.merged_prs || 0}</div>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-xl text-center border border-emerald-100 flex flex-col items-center justify-center">
                    <div className="text-[8px] uppercase font-bold text-emerald-600/50">Status</div>
                    <div className="text-[10px] font-bold text-emerald-600">Verified</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-arc-ink/40 text-center py-2 italic font-medium">Profile details unavailable</div>
            )}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-arc-line rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Badge = ({ children, className }: { children: React.ReactNode, className?: string, key?: any }) => (
  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium tracking-tight uppercase", className)}>
    {children}
  </span>
);

const SignalBar = ({ label, score, colorClass }: { label: string, score: number, colorClass: string }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-arc-ink/40 px-1">
      <span>{label}</span>
      <span>{score}/100</span>
    </div>
    <div className="h-1.5 w-full bg-arc-ink/[0.03] rounded-full overflow-hidden border border-arc-line/50">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={cn("h-full rounded-full transition-all duration-1000", colorClass)}
      />
    </div>
  </div>
);

const Card = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn("glass rounded-2xl p-6 card-border", className)}
  >
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  disabled, 
  loading, 
  variant = 'primary',
  size = 'md',
  className 
}: { 
  children: React.ReactNode, 
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, 
  disabled?: boolean, 
  loading?: boolean,
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  size?: 'sm' | 'md' | 'lg',
  className?: string 
}) => {
  const variants = {
    primary: "bg-arc-ink text-white hover:opacity-90 disabled:bg-arc-ink/20",
    secondary: "bg-white text-arc-ink border border-arc-line hover:bg-arc-paper disabled:opacity-50",
    danger: "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50",
    ghost: "bg-transparent text-arc-ink hover:bg-arc-ink/5"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 rounded-xl text-sm",
    lg: "px-6 py-3 rounded-2xl text-base"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex items-center justify-center gap-2 font-medium transition-all disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

// --- Types & Constants ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface InteractionState {
  accessRequests: Record<string, boolean>;
  keysSubmitted: Record<string, { backendKeys: string; repoAccess: string; submittedAt: number }>;
  assets: Record<string, string>;
}

interface AlertConfig {
  title: string;
  message: string;
  type: 'info' | 'error' | 'success';
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

// --- App Context ---

const AppContext = React.createContext<{
  interactionState: InteractionState;
  setInteractionState: React.Dispatch<React.SetStateAction<InteractionState>>;
  alert: (config: AlertConfig) => void;
  jobsData: Record<string, any>;
  jobIdentities: Record<string, { employer: string; developer: string }>;
  allJobs: bigint[];
  refetchJobs: () => void;
  derivedStats: {
    developer: any;
    employer: any;
  };
  allDerivedStats: Record<string, { developer: any; employer: any }>;
  isReinitializing: boolean;
  resolutionHistory: Record<string, { winner: 'dev' | 'emp' }>;
  disputedJobs: Record<string, bigint>;
} | null>(null);

function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}

// --- UI Components ---

function GlobalAlertModal({ config, onClose }: { config: AlertConfig, onClose: () => void }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-arc-ink/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 border border-arc-line shadow-2xl space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              config.type === 'error' ? "bg-red-50 text-red-500" : 
              config.type === 'success' ? "bg-emerald-50 text-emerald-500" : "bg-arc-ink/5 text-arc-ink"
            )}>
              {config.type === 'error' ? <XCircle className="w-6 h-6" /> : 
               config.type === 'success' ? <CircleCheck className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <h3 className="text-xl font-bold tracking-tight text-arc-ink">{config.title}</h3>
          </div>
          <p className="text-arc-ink/60 text-sm leading-relaxed">{config.message}</p>
          <div className="flex gap-3">
            {config.showCancel && (
              <Button variant="secondary" onClick={() => { config.onCancel?.(); onClose(); }} className="flex-1">
                Cancel
              </Button>
            )}
            <Button 
              variant={config.type === 'error' ? 'danger' : 'primary'} 
              onClick={() => { config.onConfirm?.(); onClose(); }} 
              className="flex-1"
            >
              Confirm
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// --- Main Application ---

// --- Error Boundary ---

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (this as any).props.fallback;
    }
    return (this as any).props.children;
  }
}

export default function App() {
  const queryClient = useQueryClient();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const [activeTab, setActiveTab] = useState<'developer' | 'employer'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('arc_active_mode');
      return (saved === 'developer' || saved === 'employer') ? saved : 'developer';
    }
    return 'developer';
  });

  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [interactionState, setInteractionState] = useState<InteractionState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('arc_interaction_state');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse interaction state", e);
        }
      }
    }
    return {
      accessRequests: {},
      keysSubmitted: {},
      assets: {}
    };
  });

  useEffect(() => {
    localStorage.setItem('arc_interaction_state', JSON.stringify(interactionState));
  }, [interactionState]);

  const [jobIdentities, setJobIdentities] = useState<Record<string, { employer: string, developer: string }>>({});
  const [allJobs, setAllJobs] = useState<bigint[]>([]);

  // Batch Job Data fetcher
  const { data: jobCount, refetch: refetchJobCount } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'jobCount',
  });

  useEffect(() => {
    if (jobCount) {
      const ids = [];
      for (let i = BigInt(1); i <= (jobCount as bigint); i++) {
        ids.push(i);
      }
      setAllJobs(ids.reverse());
    }
  }, [jobCount]);

  const { data: batchRawData, refetch: refetchJobsRaw } = useReadContracts({
    contracts: allJobs.flatMap(id => [
      {
        address: JOB_ESCROW_ADDRESS,
        abi: JOB_ESCROW_ABI,
        functionName: 'jobs',
        args: [id],
      },
      {
        address: JOB_ESCROW_ADDRESS,
        abi: JOB_ESCROW_ABI,
        functionName: 'disputeTimestamps',
        args: [id],
      }
    ]),
    query: { enabled: allJobs.length > 0 }
  });

  const { jobsData, disputedJobs } = useMemo(() => {
    const jMap: Record<string, any> = {};
    const dMap: Record<string, bigint> = {};
    if (!batchRawData) return { jobsData: jMap, disputedJobs: dMap };
    
    allJobs.forEach((id, index) => {
      const jobRes = batchRawData[index * 2];
      const disputeRes = batchRawData[index * 2 + 1];
      
      if (jobRes && jobRes.status === 'success' && jobRes.result) {
        jMap[id.toString()] = jobRes.result;
      }
      if (disputeRes && disputeRes.status === 'success' && disputeRes.result) {
        dMap[id.toString()] = disputeRes.result as bigint;
      }
    });
    return { jobsData: jMap, disputedJobs: dMap };
  }, [batchRawData, allJobs]);

  const handleAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
  }, []);

  const refetchJobs = useCallback(() => {
    refetchJobCount();
    refetchJobsRaw();
    queryClient.invalidateQueries({ queryKey: [JOB_ESCROW_ADDRESS] });
  }, [refetchJobCount, refetchJobsRaw, queryClient]);

  // Sync Job Identities from events
  const lastIdentitiesSyncBlock = useRef<bigint>(0n);
  useEffect(() => {
    async function syncJobIdentities() {
      if (!publicClient) return;
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const CHUNK_SIZE = 10000n;
        const deploymentBlock = 0n; 
        const startBlock = lastIdentitiesSyncBlock.current > 0n ? lastIdentitiesSyncBlock.current + 1n : deploymentBlock;

        if (startBlock > currentBlock) return;
        
        const mapping: Record<string, { employer: string, developer: string }> = {};

        for (let i = startBlock; i < currentBlock; i += CHUNK_SIZE) {
          const toBlock = i + CHUNK_SIZE - 1n > currentBlock ? currentBlock : i + CHUNK_SIZE - 1n;
          try {
            const rawLogs = await publicClient.getLogs({
              address: JOB_ESCROW_ADDRESS,
              fromBlock: i,
              toBlock: toBlock
            });

            const logs = parseEventLogs({
              abi: JOB_ESCROW_ABI,
              eventName: 'JobCreated',
              logs: rawLogs
            });

            logs.forEach(log => {
              if (log.args && 'jobId' in log.args) {
                const { jobId, employer, developer } = log.args as any;
                if (jobId !== undefined) {
                  mapping[BigInt(jobId).toString()] = { employer, developer };
                }
              }
            });
          } catch (e) {
            console.warn("JobCreated log chunk fetch failed", e);
          }
        }
        lastIdentitiesSyncBlock.current = currentBlock;
        setJobIdentities(prev => ({ ...prev, ...mapping }));
      } catch (err) {
        console.error("Failed to sync job identities from events", err);
      }
    }
    syncJobIdentities();
  }, [publicClient]);

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'JobCreated',
    onLogs(logs) {
      const mapping: Record<string, { employer: string, developer: string }> = {};
      logs.forEach(log => {
        const { jobId, employer, developer } = log.args as any;
        if (jobId !== undefined) {
          mapping[BigInt(jobId).toString()] = { employer, developer };
        }
      });
      setJobIdentities(prev => ({ ...prev, ...mapping }));
      refetchJobs();
    },
  });

  const [employerTab, setEmployerTab] = useState<'initialize' | 'marketplace'>('initialize');
  const [showJobSuccessModal, setShowJobSuccessModal] = useState(false);
  const [createdJobData, setCreatedJobData] = useState<any>(null);
  const [creationStatus, setCreationStatus] = useState<'idle' | 'creating' | 'funding' | 'success' | 'error'>('idle');
  const [creationError, setCreationError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('arc_active_mode', activeTab);
  }, [activeTab]);

  const [selectedJobId, setSelectedJobId] = useState<bigint | null>(null);
  const [lastCreatedJobId, setLastCreatedJobId] = useState<bigint | null>(null);
  const [autoFlowJobId, setAutoFlowJobId] = useState<bigint | null>(null);
  const [successHash, setSuccessHash] = useState<string | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const { data: usdcBalance, refetch: refetchUSDC } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: linkedGithub, refetch: refetchGithub } = useReadContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'addressToGithub',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { writeContractAsync } = useWriteContract();
  const [bindHash, setBindHash] = useState<`0x${string}` | undefined>();
  const { isSuccess: isBindConfirmed } = useWaitForTransactionReceipt({ hash: bindHash, confirmations: 1 });

  const handleResetGithub = async () => {
    if (!address) return;
    
    handleAlert({
      title: "Unlink Identity",
      message: "Are you sure you want to unlink your GitHub account? This will reset your reputation data on-chain.",
      type: "info",
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/github-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: address }),
          });
          const data = await res.json();
          if (data.success) {
            refetchGithub();
          } else {
            handleAlert({ title: "Reset Failed", message: data.error || "Failed to reset GitHub link", type: "error" });
          }
        } catch (err) {
          console.error(err);
          handleAlert({ title: "Reset Failed", message: "Connection failure during reset", type: "error" });
        }
      }
    });
  };

  useEffect(() => {
    if (isBindConfirmed) {
      refetchGithub();
      setShowOnboarding(false);
      setBindHash(undefined);
    }
  }, [isBindConfirmed, refetchGithub]);

  // Consolidated Watchers for General UI updates
  useWatchContractEvent({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    eventName: 'ReputationUpdated',
    onLogs() { 
      refetchGithub();
    }
  });

  useWatchContractEvent({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    eventName: 'EmployerReputationUpdated',
    onLogs() {
      refetchGithub();
    }
  });

  useWatchContractEvent({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    eventName: 'StatsUpdated',
    onLogs() { 
      refetchGithub();
    }
  });

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'PaymentReleased',
    onLogs() {
      refetchUSDC();
      refetchJobs();
    }
  });

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'WorkSubmitted',
    onLogs() { refetchJobs(); }
  });

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'JobAssigned',
    onLogs() { refetchJobs(); }
  });

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'DisputeOpened',
    onLogs() { 
      refetchJobs(); 
    }
  });

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'DisputeResolved',
    onLogs() { 
      refetchJobs(); 
    }
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'entry' | 'verifying' | 'preview' | 'binding'>('entry');
  const [githubPreview, setGithubPreview] = useState<any>(null);
  const [isBinding, setIsBinding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [onboardingGithub, setOnboardingGithub] = useState('');
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && (linkedGithub === "" || linkedGithub === "0x0000000000000000000000000000000000000000")) {
      setShowOnboarding(true);
      if (onboardingStep === 'binding' && !isBinding) {
        setOnboardingStep('entry');
      }
    } else if (linkedGithub !== "" && linkedGithub !== undefined && linkedGithub !== "0x0000000000000000000000000000000000000000") {
      setShowOnboarding(false);
    } else if (!isConnected) {
      setShowOnboarding(false);
      setOnboardingStep('entry');
      setGithubPreview(null);
      setOnboardingGithub('');
    }
  }, [isConnected, linkedGithub, onboardingStep, isBinding]);

  const handleJobCreated = useCallback((id: bigint, params?: any) => {
    setLastCreatedJobId(id);
    setAutoFlowJobId(id);
    if (params) {
      setCreatedJobData((prev: any) => ({ ...prev, ...params, id }));
      setCreationStatus('funding');
    }
    refetchJobs();
  }, [refetchJobs]);

  const handleJobCreationStart = useCallback((params: any) => {
    setCreatedJobData(params);
    setCreationStatus('creating');
    setCreationError(null);
    setShowJobSuccessModal(true);
  }, []);

   const handleVerifyProfile = async () => {
    if (!onboardingGithub) return;
    setIsVerifying(true);
    setOnboardingError(null);
    try {
      const res = await fetch(`/api/github-verify?username=${onboardingGithub}`);
      const data = await res.json();
      if (data.valid) {
        setGithubPreview(data.user);
        setOnboardingStep('preview');
      } else {
        setOnboardingError(data.error || "GitHub profile not found");
      }
    } catch (err) {
      setOnboardingError("Failed to connect to verification service");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGithubBind = async () => {
    if (!onboardingGithub || !address) return;
    setOnboardingStep('binding');
    setIsBinding(true);
    setOnboardingError(null);
    try {
      const res = await fetch('/api/github-bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: onboardingGithub, walletAddress: address })
      });
      const data = await res.json();
      
      if (!data.success) {
        setOnboardingError(data.error || "Failed to initiate binding");
        setOnboardingStep('preview');
        setIsBinding(false);
        return;
      }

      if (data.txHash) {
        setBindHash(data.txHash);
      } else {
        refetchGithub();
        setShowOnboarding(false);
      }
    } catch (err: any) {
      setOnboardingError(err.message || "Connection failure during binding");
      setOnboardingStep('preview');
    } finally {
      setIsBinding(false);
    }
  };

  const [resolutionHistory, setResolutionHistory] = useState<Record<string, { winner: 'dev' | 'emp' }>>({});
  const [isReinitializing, setIsReinitializing] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showHomeOverlay, setShowHomeOverlay] = useState(false);
  const prevAddress = useRef(address);

  useEffect(() => {
    if (address && address !== prevAddress.current) {
      setIsReinitializing(true);
      prevAddress.current = address;
      const timer = setTimeout(() => setIsReinitializing(false), 800);
      return () => clearTimeout(timer);
    }
    if (!address) {
      prevAddress.current = undefined;
    }
  }, [address]);

  // Historical Event Indexer (Deterministic)
  const lastDisputeSyncBlock = useRef<bigint>(0n);
  useEffect(() => {
    if (!publicClient || !address) return;
    
    const fetchDisputeHistory = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const CHUNK_SIZE = 10000n;
        const deploymentBlock = 0n; 
        const startBlock = lastDisputeSyncBlock.current > 0n ? lastDisputeSyncBlock.current + 1n : deploymentBlock;
        
        if (startBlock > currentBlock) return;

        let history: Record<string, { winner: 'dev' | 'emp' }> = {};
        
        // Fetch in chunks to avoid RPC limits
        for (let i = startBlock; i < currentBlock; i += CHUNK_SIZE) {
          const toBlock = i + CHUNK_SIZE - 1n > currentBlock ? currentBlock : i + CHUNK_SIZE - 1n;
          try {
            const rawLogs = await publicClient.getLogs({
              address: JOB_ESCROW_ADDRESS,
              fromBlock: i,
              toBlock: toBlock
            });

            const logs = parseEventLogs({
              abi: JOB_ESCROW_ABI,
              eventName: 'DisputeResolved',
              logs: rawLogs
            });

            logs.forEach(log => {
              if (log.args && 'jobId' in log.args) {
                 const { jobId, favorDeveloper } = log.args as any;
                 if (jobId !== undefined) {
                    history[BigInt(jobId).toString()] = { 
                      winner: favorDeveloper ? 'dev' : 'emp' 
                    };
                 }
              }
            });
          } catch (e) {
            console.warn("Dispute history chunk fetch failed", e);
          }
        }
        lastDisputeSyncBlock.current = currentBlock;
        setResolutionHistory(prev => ({ ...prev, ...history }));
      } catch (err) {
        console.error("Dispute history sync failed:", err);
      }
    };

    fetchDisputeHistory();
  }, [publicClient, address, allJobs.length]);

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'DisputeResolved',
    onLogs(logs) {
      const mapping: Record<string, { winner: 'dev' | 'emp' }> = {};
      logs.forEach(log => {
        const { jobId, favorDeveloper } = log.args as any;
        if (jobId !== undefined) {
          mapping[BigInt(jobId).toString()] = { winner: favorDeveloper ? 'dev' : 'emp' };
        }
      });
      setResolutionHistory(prev => ({ ...prev, ...mapping }));
      refetchJobs();
    },
  });

  // Wallet safe state handling
  useEffect(() => {
    if (address) {
      // Clear event-driven local states
      setJobIdentities({});
      setResolutionHistory({});
      lastIdentitiesSyncBlock.current = 0n;
      lastDisputeSyncBlock.current = 0n;
      
      // Trigger full refetch
      refetchJobs();
      refetchUSDC();
      refetchGithub();
    }
  }, [address]);

  // --- Generalized Deterministic Reputation Engine ---
  const allDerivedStats = useMemo(() => {
    const statsMap: Record<string, { developer: any; employer: any }> = {};

    const getInitialStats = () => ({
      developer: {
        completed: 0, failed: 0, earned: 0n, disputes: 0, disputesWon: 0, disputesLost: 0, active: 0, totalJobs: 0,
        score: 0, tier: 'Unrated', completionRate: 0, disputePerformance: 0, earningsStability: 0, rated: false
      },
      employer: {
        funded: 0, open: 0, completed: 0, failed: 0, disputes: 0, disputesWon: 0, disputesLost: 0, paid: 0n, active: 0,
        score: 0, tier: 'Unrated', fundingEfficiency: 0, fairnessIndex: 100, disputeQuality: 0, escrowStability: 0, rated: false
      }
    });

    Object.entries(jobsData).forEach(([id, job]) => {
      const jobArray = job as any[];
      if (!jobArray || jobArray.length < 6) return;

        const employerAddr = (jobArray[0] || "").toString().toLowerCase();
        const developerAddr = (jobArray[1] || "").toString().toLowerCase();
        
        const jobIdKey = id.toString();
        const disputedAt = disputedJobs[jobIdKey] || 0n;
        const status = Number(jobArray[5]);
        const amount = BigInt(jobArray[2] || 0n);
        let res = resolutionHistory[jobIdKey];
        const isDisputed = disputedAt > 0n || status === 5 || !!res;

        if (employerAddr && employerAddr !== zeroAddress) {
          if (!statsMap[employerAddr]) statsMap[employerAddr] = getInitialStats();
          const emp = statsMap[employerAddr].employer;
          const amount = BigInt(jobArray[2] || 0n);
          let res = resolutionHistory[jobIdKey];

          // Heuristic Fallback for missing/slow logs
          if (!res && isDisputed) {
             if (status === 4) res = { winner: 'dev' };
             if (status === 7 || status === 6) res = { winner: 'emp' };
          }

          emp.funded++;
          
          if (isDisputed) {
            emp.disputes++;
            if (res) {
              if (res.winner === 'emp') {
                emp.disputesWon++;
              } else {
                emp.disputesLost++;
              }
            }
          }

        // New Deterministic Lifecycle Logic
        const empFailed = (status === 6 || status === 7 || (res && res.winner === 'emp'));
        const empCompleted = (status === 4 || (res && res.winner === 'dev'));
        const empActive = !res && (status === 2 || status === 3 || status === 5 || status === 8);
        const empOpen = !res && (status === 0 || status === 1);

        if (empOpen) emp.open++;
        if (empActive) emp.active++;
        if (empCompleted) {
          emp.completed++;
          emp.paid += amount;
        }
        if (empFailed) emp.failed++;
      }

      if (developerAddr && developerAddr !== zeroAddress && developerAddr !== employerAddr) {
        if (!statsMap[developerAddr]) statsMap[developerAddr] = getInitialStats();
        const dev = statsMap[developerAddr].developer;
        const amount = BigInt(jobArray[2] || 0n);
        let res = resolutionHistory[jobIdKey];
        const isDisputed = disputedAt > 0n || status === 5 || !!res;

        // Heuristic Fallback
        if (!res && isDisputed) {
           if (status === 4) res = { winner: 'dev' };
           if (status === 7 || status === 6) res = { winner: 'emp' };
        }

        dev.totalJobs++;

        if (isDisputed) {
          dev.disputes++;
          if (res) {
            if (res.winner === 'dev') {
              dev.disputesWon++;
            } else {
              dev.disputesLost++;
            }
          }
        }

        // New Deterministic Lifecycle Logic
        const devFailed = (status === 6 || status === 7 || (res && res.winner === 'emp')); 
        const devCompleted = (status === 4 || (res && res.winner === 'dev'));
        const devActive = !res && (status === 2 || status === 3 || status === 5 || status === 8);

        if (devCompleted) {
          dev.completed++;
          dev.earned += amount;
        }
        if (devActive) dev.active++;
        if (devFailed) dev.failed++;
      }
    });

    // Finalize all scores using deterministic formulas
    const MAX_EARNINGS = 10000;

    Object.values(statsMap).forEach(({ developer: dev, employer: emp }) => {
      // Developer Scoring (Execution System)
      const devT = dev.totalJobs || 0;
      
      if (devT < 3) {
        dev.score = 0;
        dev.tier = 'Unrated';
        dev.rated = false;
        dev.completionRate = 0;
        dev.disputePerformance = 0;
        dev.earningsStability = 0;
      } else {
        const devCR = dev.completed / devT;
        const devDisputesTotal = dev.disputesWon + dev.disputesLost;
        const devDP = devDisputesTotal > 0 ? dev.disputesWon / devDisputesTotal : 1;
        const devE = Number(formatUnits(dev.earned, USDC_DECIMALS));
        const devER = Math.log(1 + devE) / Math.log(1 + MAX_EARNINGS);

        dev.completionRate = Math.min(100, Math.floor(devCR * 100));
        dev.disputePerformance = Math.min(100, Math.floor(devDP * 100));
        dev.earningsStability = Math.min(100, Math.floor(devER * 100));
        dev.rated = true;

        dev.score = Math.floor((0.50 * dev.completionRate) + (0.30 * dev.disputePerformance) + (0.20 * dev.earningsStability));
        
        if (dev.score >= 85) dev.tier = 'Elite';
        else if (dev.score >= 65) dev.tier = 'Proven';
        else if (dev.score >= 40) dev.tier = 'Reliable';
        else dev.tier = 'Rookie';
      }

      // Employer Scoring (Capital + Fairness System)
      const empF = emp.funded || 0;
      
      if (empF < 3) {
        emp.score = 0;
        emp.tier = 'Unrated';
        emp.rated = false;
        emp.fundingEfficiency = 0;
        emp.fairnessIndex = 100;
        emp.disputeQuality = 0;
        emp.escrowStability = 0;
      } else {
        const empFE = emp.completed / empF;
        const empFI = 1 - (emp.disputes / empF);
        const empDisputesTotal = emp.disputesWon + emp.disputesLost;
        const empDQ = empDisputesTotal > 0 ? emp.disputesWon / empDisputesTotal : 1;
        const empEscrow = Number(formatUnits(emp.paid, USDC_DECIMALS));
        const empES = Math.log(1 + empEscrow) / Math.log(1 + MAX_EARNINGS);

        emp.fundingEfficiency = Math.min(100, Math.floor(empFE * 100));
        emp.fairnessIndex = Math.min(100, Math.floor(empFI * 100));
        emp.disputeQuality = Math.min(100, Math.floor(empDQ * 100));
        emp.escrowStability = Math.min(100, Math.floor(empES * 100));
        emp.rated = true;

        emp.score = Math.floor(
          (0.45 * emp.fundingEfficiency) + 
          (0.25 * emp.fairnessIndex) + 
          (0.20 * emp.disputeQuality) + 
          (0.10 * emp.escrowStability)
        );
        
        if (emp.score >= 85) emp.tier = 'Diamond';
        else if (emp.score >= 65) emp.tier = 'Gold';
        else if (emp.score >= 40) emp.tier = 'Silver';
        else emp.tier = 'Bronze';
      }
    });

    return statsMap;
  }, [jobsData, resolutionHistory]);

  const derivedStats = useMemo(() => {
    const defaultStats = {
      developer: {
        completed: 0, failed: 0, earned: 0n, disputes: 0, disputesWon: 0, disputesLost: 0, active: 0, totalJobs: 0,
        score: 0, tier: 'Unrated', completionRate: 0, disputePerformance: 0, earningsStability: 0, rated: false
      },
      employer: {
        funded: 0, open: 0, completed: 0, failed: 0, disputes: 0, disputesWon: 0, disputesLost: 0, paid: 0n, active: 0,
        score: 0, tier: 'Unrated', fundingEfficiency: 0, fairnessIndex: 100, disputeQuality: 0, escrowStability: 0, rated: false
      }
    };
    if (!address) return defaultStats;
    return allDerivedStats[address.toLowerCase()] || defaultStats;
  }, [allDerivedStats, address]);


  const contextValue = useMemo(() => ({
    interactionState,
    setInteractionState,
    alert: handleAlert,
    jobsData,
    jobIdentities,
    allJobs,
    refetchJobs,
    derivedStats,
    allDerivedStats,
    isReinitializing,
    resolutionHistory,
    disputedJobs
  }), [interactionState, handleAlert, jobsData, jobIdentities, allJobs, refetchJobs, derivedStats, allDerivedStats, isReinitializing, resolutionHistory, disputedJobs]);

  return (
    <ErrorBoundary fallback={<div className="h-screen flex items-center justify-center p-6 text-center space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-arc-ink/50">The application encountered a rendering error during pocket/identity switching.</p>
        <Button onClick={() => window.location.reload()}>Reload Infrastructure</Button>
      </div>
    </div>}>
    <AppContext.Provider value={contextValue}>
      <AnimatePresence>
        {isReinitializing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-arc-paper/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="space-y-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-arc-ink/5 rounded-full" />
                <Loader2 className="w-12 h-12 animate-spin text-arc-ink/20 relative z-10 mx-auto" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-arc-ink">Switching Identity</h3>
                <p className="text-arc-ink/40 text-sm font-mono uppercase tracking-[0.2em]">Synchronizing protocol state...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen flex flex-col">
        {alertConfig && <GlobalAlertModal config={alertConfig} onClose={() => setAlertConfig(null)} />}
        {/* Navigation */}
      <nav className="h-16 border-b border-arc-line flex items-center justify-between px-6 sticky top-0 bg-arc-paper/80 backdrop-blur-xl z-50">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            setShowHomeOverlay(true);
            setSelectedJobId(null);
          }}
        >
          <div className="w-8 h-8 bg-arc-ink rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="font-semibold tracking-tighter text-xl italic font-serif">ArcProof</span>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && !showHomeOverlay && (
            <div className="hidden md:flex bg-arc-ink/5 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('developer')}
                className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", activeTab === 'developer' ? "bg-white shadow-sm" : "hover:bg-white/50")}
              >
                Developer
              </button>
              <button 
                onClick={() => setActiveTab('employer')}
                className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", activeTab === 'employer' ? "bg-white shadow-sm" : "hover:bg-white/50")}
              >
                Employer
              </button>
            </div>
          )}

          {!isConnected ? (
            <div className="flex items-center gap-3">
              <a 
                href="https://faucet.circle.com/" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-bold uppercase tracking-widest text-arc-ink/40 hover:text-arc-ink transition-colors flex items-center gap-1"
              >
                Faucet <ExternalLink className="w-3 h-3" />
              </a>
              <Button onClick={() => connect({ connector: connectors[0] })}>
                <Wallet className="w-4 h-4" />
                Connect
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isConnected && chain?.id !== 5042002 && (
                <button 
                  onClick={() => switchChain({ chainId: 5042002 })}
                  className="bg-red-500/10 text-red-500 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded animate-pulse mr-2 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  Switch to Arc Testnet
                </button>
              )}
              <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-arc-ink/40 uppercase tracking-widest">Balance</span>
                <span className="text-xs font-mono font-medium">
                  {usdcBalance ? Math.floor(Number(formatUnits(usdcBalance as bigint, USDC_DECIMALS))).toLocaleString() : "0"} USDC
                </span>
              </div>
              <button 
                onClick={() => disconnect()}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-arc-ink/5 border border-arc-line hover:bg-red-50 hover:border-red-100 transition-all relative overflow-hidden"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:bg-red-500 group-hover:animate-none" />
                <span className="transition-all duration-200 group-hover:opacity-0 group-hover:translate-y-[-10px]">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <span className="absolute inset-x-0 inset-y-0 flex items-center justify-center gap-2 text-red-600 font-bold uppercase text-[10px] tracking-widest opacity-0 translate-y-[10px] transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
                  <X className="w-3.5 h-3.5" />
                  Disconnect
                </span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8">
        
        {/* Connection Check */}
        <AnimatePresence mode="wait">
          {!isConnected || showHomeOverlay ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center"
            >
              <div className={cn("flex flex-col items-center justify-center text-center space-y-8 py-12 md:py-20", showHowItWorks ? "min-h-screen" : "h-[70vh]")}>
            <div className="w-24 h-24 bg-arc-ink/[0.03] rounded-full flex items-center justify-center border border-arc-line shadow-inner">
              <ShieldCheck className="w-12 h-12 opacity-20" />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight">Deterministic Work Settlement Infrastructure</h1>
              <p className="text-arc-ink/50 max-w-2xl mx-auto text-lg text-center">
                Escrow work, verify execution, and settle USDC through programmable onchain state transitions with sub second deterministic finality on Arc
              </p>
              <p className="text-arc-ink/50 max-w-2xl mx-auto text-lg text-center">
                Each settlement produces structured behavioral signals that form the foundation for trust and credit systems
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              {isConnected ? (
                <Button onClick={() => setShowHomeOverlay(false)} className="px-16 py-4 rounded-2xl shadow-2xl shadow-arc-ink/20 text-lg">
                  Launch Dashboard
                </Button>
              ) : (
                <Button onClick={() => connect({ connector: connectors[0] })} className="px-16 py-4 rounded-2xl shadow-2xl shadow-arc-ink/20 text-lg">
                  Launch Dashboard
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="px-12 py-4 rounded-2xl border-arc-line bg-transparent text-arc-ink/60 hover:bg-arc-ink/5 hover:text-arc-ink text-lg"
              >
                How ArcProof Works
              </Button>
            </div>

            {/* How ArcProof Works Walkthrough */}
            {showHowItWorks && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-24 max-w-5xl mx-auto w-full space-y-16 pb-20 border-t border-arc-line mt-12"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight">How ArcProof Works</h2>
                  <p className="text-arc-ink/50 max-w-2xl mx-auto">
                    Deterministic escrow settlement and reputation infrastructure powered by onchain lifecycle events
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* STEP 01 */}
                  <div className="glass p-8 rounded-[2rem] border border-arc-line space-y-6 text-left">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                         <Github className="w-6 h-6 text-blue-500" />
                      </div>
                      <span className="text-[10px] font-bold text-arc-ink/20 uppercase tracking-[0.2em]">Step 01</span>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold tracking-tight">Connect Identity</h3>
                      <p className="text-sm text-arc-ink/60 leading-relaxed">
                        Connect GitHub once during onboarding for identity
                      </p>
                      <div className="p-3 rounded-xl bg-arc-ink/5 border border-arc-line text-[11px] text-arc-ink/50 italic">
                        ArcProof does NOT use GitHub activity for reputation scoring. Repos, commits, and history never affect protocol reputation
                      </div>
                    </div>
                  </div>

                  {/* STEP 02 */}
                  <div className="glass p-8 rounded-[2rem] border border-arc-line space-y-6 text-left">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                         <ShieldCheck className="w-6 h-6 text-amber-500" />
                      </div>
                      <span className="text-[10px] font-bold text-arc-ink/20 uppercase tracking-[0.2em]">Step 02</span>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold tracking-tight">Fund Escrow</h3>
                      <p className="text-sm text-arc-ink/60 leading-relaxed">
                        Employers create jobs and lock USDC into onchain escrow before execution begins
                      </p>
                      <div className="p-3 rounded-xl bg-arc-ink/5 border border-arc-line text-[11px] text-arc-ink/50 italic">
                        Every funded job becomes an immutable lifecycle record tied to protocol settlement events
                      </div>
                    </div>
                  </div>

                  {/* STEP 03 */}
                  <div className="glass p-12 rounded-[3rem] border border-arc-line space-y-8 text-center md:col-span-2 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      <div className="w-16 h-16 rounded-3xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-sm shadow-purple-500/5">
                         <Zap className="w-8 h-8 text-purple-500" />
                      </div>
                      <span className="text-[10px] font-bold text-arc-ink/20 uppercase tracking-[0.4em]">Step 03</span>
                    </div>
                    <div className="space-y-6 max-w-2xl relative z-10 mx-auto">
                      <h3 className="text-3xl font-medium tracking-tight text-arc-ink">Execute & Settle</h3>
                      <div className="space-y-3">
                        <p className="text-base text-arc-ink/60 leading-relaxed">
                          Jobs move through a deterministic lifecycle:
                        </p>
                        <div className="inline-block px-4 py-2 bg-arc-ink/5 rounded-xl border border-arc-line/50">
                          <code className="text-xs sm:text-sm font-mono tracking-tighter text-arc-ink/80">
                            REQUESTED &rarr; ACCEPTED &rarr; COMPLETED &rarr; DISPUTED &rarr; RESOLVED
                          </code>
                        </div>
                      </div>
                      <p className="text-sm md:text-base text-arc-ink/70 max-w-xl mx-auto">
                        Settlement outcomes are finalized directly from blockchain events with no manual intervention and no protocol bias.
                      </p>
                      <div className="text-left bg-white/50 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-arc-line shadow-sm space-y-4 mt-8">
                        <p className="font-medium text-arc-ink">Each lifecycle outcome produces structured signals:</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-arc-ink/60 marker:text-arc-ink/30">
                          <li>verified execution history under escrow conditions</li>
                          <li>settlement reliability across counterparties</li>
                          <li>dispute behavior and resolution outcomes</li>
                          <li>interaction graph of economic trust between participants</li>
                        </ul>
                        <div className="pt-4 border-t border-arc-line">
                          <p className="text-sm font-medium italic text-arc-ink/40">These signals are recorded as part of protocol state and persist across work relationships.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 04 */}
                  <div className="glass p-8 rounded-[3rem] border border-arc-line space-y-8 text-left relative overflow-hidden group col-span-1 md:col-span-2">
                    <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] group-hover:bg-emerald-500/10 transition-all duration-700" />
                    <div className="absolute -left-24 -top-24 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] group-hover:bg-amber-500/10 transition-all duration-700" />
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                         <Trophy className="w-7 h-7 text-emerald-500" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-arc-ink/20 uppercase tracking-[0.3em]">Step 04</span>
                        <span className="text-[10px] font-bold text-emerald-500/60 uppercase">Reputation Mining</span>
                      </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight text-arc-ink">Build Protocol Reputation</h3>
                        <p className="text-sm text-arc-ink/50 leading-relaxed max-w-2xl">
                          Your reputation is a deterministic soulbound projection of your onchain behavior. No manual intervention, no social bias (only execution history)
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4 p-6 rounded-3xl bg-arc-ink/[0.02] border border-arc-line/50">
                           <div className="flex items-center justify-between">
                             <div className="text-[11px] uppercase font-bold text-arc-ink/40 tracking-widest flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                               Developer Tiers
                             </div>
                             <span className="text-[9px] font-mono text-arc-ink/20 italic">Execution Based</span>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              {[
                                { name: 'Rookie' },
                                { name: 'Reliable' },
                                { name: 'Proven' },
                                { name: 'Elite' }
                              ].map(t => (
                                <div key={t.name} className="flex items-center justify-center py-4 rounded-2xl border border-arc-line bg-arc-ink/[0.02] text-[11px] font-medium tracking-tight text-arc-ink/60 hover:bg-arc-ink/[0.04] transition-all hover:scale-[1.02]">
                                  {t.name}
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4 p-6 rounded-3xl bg-arc-ink/[0.02] border border-arc-line/50">
                           <div className="flex items-center justify-between">
                             <div className="text-[11px] uppercase font-bold text-arc-ink/40 tracking-widest flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                               Employer Tiers
                             </div>
                             <span className="text-[9px] font-mono text-arc-ink/20 italic">Capital Based</span>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              {[
                                { name: 'Bronze' },
                                { name: 'Silver' },
                                { name: 'Gold' },
                                { name: 'Diamond' }
                              ].map(t => (
                                <div key={t.name} className="flex items-center justify-center py-4 rounded-2xl border border-arc-line bg-arc-ink/[0.02] text-[11px] font-medium tracking-tight text-arc-ink/60 hover:bg-arc-ink/[0.04] transition-all hover:scale-[1.02]">
                                  {t.name}
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons for Walkthrough */}
                <div className="pt-20 flex flex-col md:flex-row items-center justify-center gap-6">
                  <button 
                    onClick={() => {
                      setShowHowItWorks(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-sm font-bold uppercase tracking-widest text-arc-ink/30 hover:text-arc-ink transition-all flex items-center gap-2 group"
                  >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : !address ? (
              <motion.div 
                key="loading-identity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[70vh] flex items-center justify-center w-full"
              >
                <Loader2 className="w-8 h-8 animate-spin text-arc-ink/20" />
              </motion.div>
            ) : (
              <motion.div
                key={`app-${address}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8 flex-1 w-full"
              >
            {/* Hero Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-medium tracking-tight text-arc-ink leading-tight">
                  {activeTab === 'developer' ? "Developer Identity" : "Escrow Board"}
                  <span className="italic font-serif opacity-70 ml-2">Console.</span>
                </h1>
                <p className="text-arc-ink/60">
                  {activeTab === 'developer' 
                    ? "Your execution history and reputation metrics normalized from raw onchain data."
                    : "Initialize high-trust escrows with verified developers."}
                </p>
              </div>
              
                  {isConnected && (
                <div className="flex items-center gap-3">
                   <div className="glass px-4 py-2 rounded-2xl border border-arc-line flex items-center gap-3">
                     <Github className="w-4 h-4 opacity-40" />
                     <div className="h-4 w-px bg-arc-line" />
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-arc-ink/60">
                            {linkedGithub ? (
                              <GitHubHoverPreview username={linkedGithub as string} />
                            ) : (
                              linkedGithub === undefined ? "Loading..." : "Identity Not Bound"
                            )}
                        </span>
                        {linkedGithub && (
                          <button 
                            onClick={handleResetGithub}
                            title="Unlink Identity"
                            className="p-1 hover:bg-red-50 text-arc-ink/20 hover:text-red-500 rounded transition-colors ml-1"
                          >
                            <RefreshCcw className="w-3 h-3" />
                          </button>
                        )}
                     </div>
                   </div>
                </div>
              )}
            </header>

            {showOnboarding && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-arc-paper/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="max-w-md w-full bg-white rounded-3xl p-8 border border-arc-line shadow-2xl space-y-8"
                >
                  {onboardingStep === 'entry' ? (
                    <div className="space-y-8">
                       <div className="space-y-4 text-center">
                        <div className="w-16 h-16 bg-arc-ink rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-medium tracking-tight">Identity Onboarding</h2>
                        <p className="text-arc-ink/50 text-sm">
                          Welcome to ArcProof OS. To access the decentralized console, you must bind your on-chain address to a GitHub identity.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Button onClick={() => setOnboardingStep('verifying')} className="w-full py-4 rounded-2xl text-lg shadow-xl shadow-arc-ink/10">
                          Get Started
                        </Button>
                        <p className="text-[10px] text-center text-arc-ink/30 px-6 font-medium">
                          This is a one-time process using the Arc Reputation Registry.
                        </p>
                      </div>
                    </div>
                  ) : onboardingStep === 'verifying' ? (
                    <div className="space-y-8">
                      <div className="space-y-4 text-center">
                        <div className="w-16 h-16 bg-arc-ink/5 rounded-2xl flex items-center justify-center mx-auto text-arc-ink border border-arc-line">
                          <Github className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-medium tracking-tight">Source Verification</h2>
                        <p className="text-arc-ink/50 text-sm">
                          Enter your GitHub username to fetch your contribution metrics and verify your professional identity.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-bold tracking-widest text-arc-ink/40 px-1">GitHub Username</label>
                           <div className="relative">
                             <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                             <input 
                               type="text" 
                               placeholder="your_username" 
                               value={onboardingGithub}
                               onChange={(e) => setOnboardingGithub(e.target.value)}
                               className="w-full pl-12 pr-4 py-3 rounded-2xl bg-arc-paper border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all font-medium"
                             />
                           </div>
                        </div>

                        {onboardingError && (
                          <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                            <CircleAlert className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs font-medium">{onboardingError}</span>
                          </div>
                        )}

                        <div className="flex gap-3">
                           <Button variant="secondary" onClick={() => setOnboardingStep('entry')} className="flex-1">Back</Button>
                           <Button 
                             onClick={handleVerifyProfile} 
                             loading={isVerifying}
                             disabled={!onboardingGithub || onboardingGithub.length < 2 || isVerifying}
                             className="flex-[2] py-3 rounded-xl"
                           >
                              {isVerifying ? "Verifying..." : "Verify Account"}
                           </Button>
                        </div>
                      </div>
                    </div>
                  ) : (onboardingStep === 'preview' || onboardingStep === 'binding') && githubPreview ? (
                    <div className="space-y-6">
                      <div className="text-center space-y-4">
                        <div className="relative inline-block">
                          <img 
                            src={githubPreview.avatar_url} 
                            alt={githubPreview.login} 
                            className="w-24 h-24 rounded-3xl border-2 border-arc-ink/10 shadow-lg mx-auto"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute -bottom-2 -right-2 bg-arc-ink text-white p-1.5 rounded-xl shadow-lg">
                            <Github className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight text-arc-ink">@{githubPreview.login}</h2>
                          <p className="text-sm text-arc-ink/50 mt-1">{githubPreview.bio || "Active GitHub Contributor"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass p-3 rounded-2xl border border-arc-line flex flex-col items-center">
                          <Github className="w-3 h-3 mb-1 text-arc-ink/30" />
                          <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Repos</div>
                          <div className="text-lg font-mono font-bold tracking-tight">{githubPreview.public_repos}</div>
                        </div>
                        <div className="glass p-3 rounded-2xl border border-arc-line flex flex-col items-center">
                          <Star className="w-3 h-3 mb-1 text-amber-500/50" />
                          <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Total Stars</div>
                          <div className="text-lg font-mono font-bold tracking-tight">{githubPreview.total_stars || 0}</div>
                        </div>
                        <div className="glass p-3 rounded-2xl border border-arc-line flex flex-col items-center">
                          <Users className="w-3 h-3 mb-1 text-blue-500/50" />
                          <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Followers</div>
                          <div className="text-lg font-mono font-bold tracking-tight">{githubPreview.followers || 0}</div>
                        </div>
                        <div className="glass p-3 rounded-2xl border border-arc-line flex flex-col items-center">
                          <GitPullRequest className="w-3 h-3 mb-1 text-purple-500/50" />
                          <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Merged PRs</div>
                          <div className="text-lg font-mono font-bold tracking-tight">{githubPreview.merged_prs || 0}</div>
                        </div>
                      </div>

                      {onboardingError && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
                          <CircleAlert className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium">{onboardingError}</span>
                        </div>
                      )}

                      {!isBinding ? (
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
                          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-900 leading-normal font-medium">
                            Confirming will link your wallet to this GitHub profile. This is an onchain transaction.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-arc-ink/[0.03] rounded-2xl border border-arc-line flex flex-col items-center gap-4 text-center">
                           <Loader2 className="w-8 h-8 animate-spin text-arc-ink/20" />
                           <div className="space-y-1">
                             <p className="text-sm font-bold text-arc-ink">Wallet Interaction Required</p>
                             <p className="text-[11px] text-arc-ink/40">Please confirm the request in your wallet to bind your decentralized identity.</p>
                           </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          variant="secondary" 
                          onClick={() => setOnboardingStep('verifying')}
                          disabled={isBinding}
                          className="flex-1"
                        >
                          Change
                        </Button>
                        <Button 
                          onClick={handleGithubBind} 
                          loading={isBinding}
                          disabled={isBinding}
                          className="flex-[2] py-4 rounded-2xl text-lg shadow-xl shadow-arc-ink/10"
                        >
                          {isBinding ? "Linking..." : "Link Profile"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </div>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Panel */}
              <div className="lg:col-span-2 space-y-8">
                

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {selectedJobId ? (
                    <motion.div
                      key="detail-view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          onClick={() => setSelectedJobId(null)}
                          className="px-0 hover:bg-transparent text-arc-ink/40 hover:text-arc-ink"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Back to Console
                        </Button>
                      </div>
                      <JobCard jobId={selectedJobId} viewerAddress={address!} role={activeTab} />
                    </motion.div>
                  ) : activeTab === 'developer' ? (
                    <motion.div 
                      key="dev-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <DeveloperProfile address={address!} onSelect={setSelectedJobId} />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="emp-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-10"
                    >
                      <EmployerProfile address={address!} onSelect={setSelectedJobId} />

                      <div className="flex items-center gap-2 border-b border-arc-line pb-4 overflow-x-auto no-scrollbar">
                        <button 
                          onClick={() => setEmployerTab('initialize')}
                          className={cn(
                            "px-6 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                            employerTab === 'initialize' ? "bg-arc-ink text-white shadow-lg" : "text-arc-ink/40 hover:bg-arc-ink/5"
                          )}
                        >
                          Create Escrow Job
                        </button>
                        <button 
                          onClick={() => setEmployerTab('marketplace')}
                          className={cn(
                            "px-6 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                            employerTab === 'marketplace' ? "bg-arc-ink text-white shadow-lg" : "text-arc-ink/40 hover:bg-arc-ink/5"
                          )}
                        >
                          Escrow Board
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {employerTab === 'initialize' ? (
                          <motion.div
                            key="emp-init"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-6"
                          >
                            {autoFlowJobId && creationStatus !== 'funding' && (
                              <SequentialFundingFlow 
                                jobId={autoFlowJobId} 
                                onComplete={() => {
                                  setAutoFlowJobId(null);
                                  setCreationStatus('success');
                                }} 
                                onCancel={() => {
                                  setAutoFlowJobId(null);
                                  setCreationStatus('idle');
                                }}
                              />
                            )}
                            <EmployerPanel 
                              key={lastCreatedJobId?.toString() || 'initial'}
                              onJobCreated={handleJobCreated} 
                              onCreating={setIsCreatingJob}
                              onCreationStart={handleJobCreationStart}
                              onCreationError={setCreationError}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="emp-market"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-8"
                          >
                             <JobExplorer address={address!} role="employer" onSelect={setSelectedJobId} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="p-0 overflow-hidden">
                  <div className="p-4 bg-arc-ink text-white font-medium flex items-center justify-between">
                    <span className="text-xs tracking-widest uppercase">Escrow Protocol</span>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-arc-ink">
                        <CircleCheck className="w-4 h-4 text-emerald-500" />
                        Automated Milestone Payments
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-arc-ink">
                        <CircleCheck className="w-4 h-4 text-emerald-500" />
                        DevScore-Weighted Deposits
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-arc-ink">
                        <CircleCheck className="w-4 h-4 text-emerald-500" />
                        Immutable Dispute Resolution
                      </div>
                    </div>

                      <div className="text-[10px] uppercase font-bold text-arc-ink/30 tracking-widest flex items-center justify-between">
                        <span>Identity Context</span>
                        <Badge className="bg-arc-ink/5 text-arc-ink/40">v1.2.4</Badge>
                      </div>

                    <div className="pt-4 border-t border-arc-line">
                      <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-3 tracking-widest">Network Logic</div>
                      <div className="space-y-2 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="opacity-40">Chain</span>
                          <span>Arc Testnet</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-40">Currency</span>
                          <span>USDC (Settlement)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-40">ChainID</span>
                          <span>5042002</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-40">Settlement</span>
                          <span>Atomic-Escrow</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {lastCreatedJobId && (
                  <Card className="bg-arc-ink/5 border-arc-ink/10 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-arc-ink text-white rounded-lg">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Job Created</div>
                        <div className="text-xs space-x-1">
                          <span className="opacity-40">Job ID:</span>
                          <span className="font-mono font-medium">{lastCreatedJobId.toString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal / Progress Modal */}
      <AnimatePresence>
        {showJobSuccessModal && createdJobData && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-arc-ink/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-white rounded-3xl p-8 border border-arc-line shadow-2xl space-y-8"
            >
              {creationStatus === 'creating' ? (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 bg-arc-ink/5 rounded-full flex items-center justify-center mx-auto text-arc-ink border border-arc-line">
                    {creationError ? <XCircle className="w-8 h-8 text-red-500" /> : <Loader2 className="w-8 h-8 animate-spin" />}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-arc-ink">
                      {creationError ? "Creation Failed" : "Escrow Creation in Progress..."}
                    </h2>
                    <p className="text-arc-ink/50 text-sm">
                      {creationError || "Please confirm the transaction in your wallet to initialize the job on-chain."}
                    </p>
                  </div>
                  {creationError && (
                    <Button 
                      onClick={() => {
                        setShowJobSuccessModal(false);
                        setCreationStatus('idle');
                      }}
                      className="w-full"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
               ) : creationStatus === 'error' ? (
                 <div className="text-center space-y-6 py-4">
                   <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-100">
                     <XCircle className="w-8 h-8" />
                   </div>
                   <div className="space-y-2">
                     <h2 className="text-xl font-bold tracking-tight text-arc-ink">Process Interrupted</h2>
                     <p className="text-arc-ink/50 text-sm">{creationError || "An error occurred during the escrow setup."}</p>
                   </div>
                   <Button 
                     onClick={() => {
                       setShowJobSuccessModal(false);
                       setCreationStatus('idle');
                     }}
                     className="w-full"
                   >
                     Close
                   </Button>
                 </div>
               ) : creationStatus === 'funding' && autoFlowJobId ? (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold tracking-tight text-arc-ink">Escrow Funding</h2>
                    <p className="text-arc-ink/50 text-xs italic">USDC Approval & Deposit</p>
                  </div>
                  <SequentialFundingFlow 
                       jobId={autoFlowJobId} 
                       compact
                       onComplete={(txHash) => {
                         setCreationStatus('success');
                         if (txHash) setSuccessHash(txHash);
                       }} 
                       onCancel={() => {
                         setCreationStatus('idle');
                         setShowJobSuccessModal(false);
                         setAutoFlowJobId(null);
                       }}
                    />
                </div>
              ) : (
                <>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/20">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-[28px] font-bold tracking-tight text-arc-ink leading-tight">Escrow Finalized</h2>
                      <p className="text-lg font-medium text-arc-ink/60">Job Registered Onchain</p>
                    </div>
                    <p className="text-arc-ink/40 text-[10px] font-mono tracking-widest uppercase">
                      Local Instance #{createdJobData.id?.toString() || lastCreatedJobId?.toString()}
                    </p>
                    
                    {successHash && (
                      <a 
                        href={`https://testnet.arcscan.app/tx/${successHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-arc-ink/40 hover:text-arc-ink transition-colors group mx-auto pt-2"
                      >
                        View Transaction Reference <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={() => {
                        setShowJobSuccessModal(false);
                        setCreationStatus('idle');
                        setCreatedJobData(null);
                        setAutoFlowJobId(null);
                        setSuccessHash(null);
                        setEmployerTab('initialize');
                      }}
                      className="w-full py-4 text-lg"
                    >
                      Create New Escrow
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        setShowJobSuccessModal(false);
                        setCreationStatus('idle');
                        setAutoFlowJobId(null);
                        setSuccessHash(null);
                        setEmployerTab('marketplace');
                      }}
                      className="w-full py-3"
                    >
                      Back to Employer Console
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>

      <footer className="mt-12 border-t border-arc-line p-12 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
           <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5" />
                 <span className="font-serif italic font-medium text-lg">ArcProof</span>
              </div>
              <div className="text-[10px] font-mono tracking-tighter uppercase font-bold">
                 Execution-verified Reputation Protocol
              </div>
           </div>
           
           <div className="text-[10px] uppercase font-bold tracking-[0.4em] text-center">
              built by <a href="http://www.x.com/idnurey" target="_blank" rel="noopener noreferrer" className="text-arc-ink hover:text-blue-500 transition-all duration-300 decoration-arc-ink/20 underline-offset-8 hover:underline">archers</a>
           </div>

           <div className="flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest">
              <span className="opacity-50">Mainnet Alpha</span>
              <span className="opacity-50">V1.0.4</span>
           </div>
        </div>
      </footer>
      </div>
    </AppContext.Provider>
    </ErrorBoundary>
  );
}

// --- Specific Components ---

function SequentialFundingFlow({ jobId, onComplete, onCancel, compact }: { jobId: bigint, onComplete: (hash?: string) => void, onCancel?: () => void, compact?: boolean }) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data: job, refetch: refetchJob } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'jobs',
    args: [jobId],
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, JOB_ESCROW_ADDRESS] : undefined,
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { writeContract, data: hash, isPending, status: writeStatus, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash, confirmations: 1 });

  // Deterministic Step Machine
  const [step, setStep] = useState<'idle' | 'analyzing' | 'approving' | 'awaiting_allowance' | 'funding' | 'awaiting_funding' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [lastHandledHash, setLastHandledHash] = useState<string | null>(null);

  // 1. Initial State Analysis
  useEffect(() => {
    if (!job || allowance === undefined || balance === undefined) return;
    const [,, amount,, , status] = job as any;
    
    if (step === 'idle') {
      if (Number(status) !== 0) {
        setStep('done');
      } else {
        setStep('analyzing');
      }
    }

    if (step === 'analyzing') {
      console.log(`[Escrow Flow] Analyzing: Balance=${balance}, Allowance=${allowance}, Required=${amount}`);
      // Check balance first
      if ((balance as bigint) < (amount as bigint)) {
        setStep('error');
        setErrorMessage(`Insufficient USDC balance. Found ${formatUnits(balance as bigint, USDC_DECIMALS)}, need ${formatUnits(amount as bigint, USDC_DECIMALS)}.`);
        return;
      }

      if ((allowance as bigint) < (amount as bigint)) {
        setStep('approving');
      } else {
        setStep('funding');
      }
    }
  }, [job, allowance, balance, step]);

  // 2. Action Triggering (Strictly once per step)
  useEffect(() => {
    if (isPending || isConfirming || step === 'done' || step === 'analyzing' || step === 'error' || step === 'idle') return;
    if (step === 'awaiting_allowance' || step === 'awaiting_funding') return;
    if (writeStatus === 'pending') return; 
    if (hasTriggered) return;

    if (step === 'approving' && job) {
      const [,, amount] = job as any;
      console.log(`[Escrow Flow] TRIGGER: approve(${formatUnits(amount, USDC_DECIMALS)})`);
      setHasTriggered(true);
      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [JOB_ESCROW_ADDRESS, amount],
      } as any);
    } else if (step === 'funding') {
      console.log(`[Escrow Flow] TRIGGER: fundJob(${jobId})`);
      setHasTriggered(true);
      writeContract({
        address: JOB_ESCROW_ADDRESS,
        abi: JOB_ESCROW_ABI,
        functionName: 'fundJob',
        args: [BigInt(jobId.toString())],
      } as any);
    }
  }, [step, job, isPending, isConfirming, writeStatus, writeContract, jobId, hasTriggered]);

  // 3. Success Lifecycle & State Progression
  useEffect(() => {
    if (isSuccess && hash && hash !== lastHandledHash) {
      setLastHandledHash(hash as string);
      setHasTriggered(false); // Reset trigger for NEXT step
      queryClient.invalidateQueries();
      
      if (step === 'approving') {
         console.log("[Escrow Flow] SUCCESS: Approval confirmed.");
         setStep('awaiting_allowance');
         const checkAllowance = async (retries = 3) => {
           console.log(`[Escrow Flow] Syncing allowance... (Retries left: ${retries})`);
           const { data: newAllowance } = await refetchAllowance();
           const [,, amount] = job as any;
           if (newAllowance !== undefined && (newAllowance as bigint) >= (amount as bigint)) {
             setStep('funding');
           } else if (retries > 0) {
             setTimeout(() => checkAllowance(retries - 1), 2000);
           } else {
             setStep('error');
             setErrorMessage("USDC approval not reflected on-chain yet. Try clicking retry.");
           }
         };
         checkAllowance();
      } else if (step === 'funding') {
         console.log("[Escrow Flow] SUCCESS: Job funded.");
         setStep('awaiting_funding');
         
         const checkFunding = async (retries = 3) => {
           console.log(`[Escrow Flow] Syncing job status... (Retries left: ${retries})`);
           const { data: res } = await refetchJob();
           const [,,,,, status] = (res as any) || [0,0,0,0,0,0];
           if (Number(status) !== 0) {
              setStep('done');
              if (compact) onComplete(hash || undefined);
              else setTimeout(() => onComplete(hash || undefined), 2000);
           } else if (retries > 0) {
             setTimeout(() => checkFunding(retries - 1), 2500);
           } else {
             setStep('error');
             setErrorMessage("Escrow state not updated after funding. Please refresh.");
           }
         };
         checkFunding();
      }
    }
  }, [isSuccess, hash, lastHandledHash, step, refetchAllowance, refetchJob, compact, onComplete, queryClient, job]);

  // Handle Error path
  useEffect(() => {
    if (writeError) {
      console.error("[Escrow Flow] Write Error:", writeError);
      setStep('error');
      const err = (writeError as any).shortMessage || writeError.message;
      setErrorMessage(err.includes('User rejected') ? "Transaction was rejected in your wallet." : `Failed: ${err}`);
    }
    if (confirmError) {
      console.error("[Escrow Flow] Confirm Error:", confirmError);
      setStep('error');
      setErrorMessage("The transaction was submitted but failed on-chain.");
    }
  }, [writeError, confirmError]);

  return (
    <div className={cn(
      "relative overflow-hidden transition-all duration-500 rounded-2xl border border-arc-line",
      compact ? "p-5 bg-arc-ink text-white" : "p-6 glass bg-arc-ink text-white card-border"
    )}>
       <div className="absolute top-0 right-0 p-4 opacity-10">
         {step === 'error' ? <XCircle className="w-10 h-10" /> : <Zap className="w-10 h-10" />}
       </div>
       <div className="flex flex-col gap-4">
         <div className="flex items-center gap-3">
           <div className="p-2 bg-white/10 rounded-lg">
             {step === 'done' ? (
               <CircleCheck className="w-4 h-4 text-emerald-400" />
             ) : step === 'error' ? (
               <CircleAlert className="w-4 h-4 text-red-500" />
             ) : (
               <Loader2 className="w-4 h-4 animate-spin text-arc-accent" />
             )}
           </div>
           <div className="flex-1">
             <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  {step === 'error' ? "Process Interrupted" : "On-chain Settlement"}
                </h4>
                {balance !== undefined && job && (
                   <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 font-mono">
                     {formatUnits(balance as bigint, USDC_DECIMALS)} / {formatUnits((job as any)[2], USDC_DECIMALS)} USDC
                   </span>
                )}
             </div>
             <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Phase: {step.replace('_', ' ')}</p>
           </div>
         </div>
         
         <div className="flex items-center gap-4">
            <div className={cn("flex-1 h-1 rounded-full bg-white/10 overflow-hidden relative")}>
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: step === 'approving' || step === 'awaiting_allowance' ? '50%' : step === 'funding' || step === 'awaiting_funding' || step === 'done' ? '100%' : '0%' }}
                 className="absolute inset-0 bg-white"
               />
            </div>
            <div className={cn("flex-1 h-1 rounded-full bg-white/10 overflow-hidden relative")}>
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: step === 'funding' || step === 'awaiting_funding' ? '50%' : step === 'done' ? '100%' : '0%' }}
                 className="absolute inset-0 bg-white"
               />
            </div>
         </div>
         
         <div className="flex items-center justify-between min-h-[1.5rem] gap-4">
            <p className={cn("text-[11px] font-medium leading-tight line-clamp-2", step === 'error' ? "text-red-400" : "text-white/70")}>
               {step === 'analyzing' && "Analyzing wallet state and allowance..."}
               {step === 'approving' && (isConfirming ? "Confirming Spent Approval..." : "Awaiting USDC Approval Signature...")}
               {step === 'awaiting_allowance' && "Confirming allowance on-chain..."}
               {step === 'funding' && (isConfirming ? "Registering Escrow Deposit..." : "Awaiting Funding Signature...")}
               {step === 'awaiting_funding' && "Finalizing on-chain state..."}
               {step === 'done' && "Success! Job is now fully funded."}
               {errorMessage}
            </p>
            {step === 'error' && (
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => {
                  setStep('idle');
                  setErrorMessage(null);
                  setHasTriggered(false);
                  queryClient.invalidateQueries();
                }} className="text-white hover:bg-white/10 text-[10px] h-7 border border-white/20">
                  Retry
                </Button>
                {onCancel && (
                  <Button variant="ghost" size="sm" onClick={onCancel} className="text-white/60 hover:bg-white/10 text-[10px] h-7 border border-white/20">
                    Back to Create Escrow
                  </Button>
                )}
              </div>
            )}
         </div>
       </div>
    </div>

  );
}

function EmployerPanel({ onJobCreated, onCreating, onCreationStart, onCreationError }: { onJobCreated: (id: bigint, params?: any) => void, onCreating: (state: boolean) => void, onCreationStart: (params: any) => void, onCreationError: (error: string) => void, key?: string }) {
  const { alert } = useAppContext();
  const [devAddress, setDevAddress] = useState<string>(zeroAddress);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [duration, setDuration] = useState(''); // Default blank
  const [amount, setAmount] = useState('0.00'); // Default 0.00
  
  const { data: devProfileData } = useReadContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'getFullProfile',
    args: devAddress && devAddress.startsWith('0x') && devAddress.length === 42 && devAddress !== zeroAddress ? [devAddress as `0x${string}`] : undefined,
    query: { enabled: devAddress.startsWith('0x') && devAddress.length === 42 && devAddress !== zeroAddress }
  });

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash, confirmations: 1 });

  useEffect(() => {
    if (isPending || isConfirming) {
      onCreating(true);
    }
  }, [isPending, isConfirming, onCreating]);

  useEffect(() => {
    if (writeError) {
      onCreating(false);
      onCreationError(writeError.message || "Transaction failed");
    }
  }, [writeError, onCreating, onCreationError]);

  const hasProcessedReceipt = useRef<string | null>(null);

  useEffect(() => {
    const titleVal = title;
    const descVal = description;
    const reqVal = requirements;
    const durVal = duration;
    const amtVal = amount;

    if (isConfirmed && receipt && hasProcessedReceipt.current !== receipt.transactionHash) {
      hasProcessedReceipt.current = receipt.transactionHash;
      onCreating(false);
      try {
        const logs = parseEventLogs({
          abi: JOB_ESCROW_ABI,
          eventName: 'JobCreated',
          logs: receipt.logs
        });
        if (logs.length > 0) {
          const jobId = (logs[0] as any).args.jobId;
          onJobCreated(jobId, { title: titleVal, description: descVal, requirements: reqVal, duration: durVal, amount: amtVal, upfront: 0 });
        }
      } catch (e) {
        console.error("Failed to parse logs from receipt", e);
      }
    }
  }, [isConfirmed, receipt, onJobCreated, onCreating, title, description, requirements, duration, amount]);

  const handleCreate = () => {
    if (!devAddress || !amount || !title || !description) {
      alert({ title: "Validation Error", message: "Please fill in all required fields", type: "error" });
      return;
    }
    
    const metadata = JSON.stringify({
      title,
      description,
      requirements,
      duration: Number(duration)
    });

    onCreationStart({ title, description, requirements, duration, amount, upfront: 0 });

    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'createJob',
      args: [devAddress as `0x${string}`, parseUnits(amount, USDC_DECIMALS), BigInt(0), metadata],
    } as any);
  };

  const handleTitleChange = (val: string) => {
    // Only letters and spaces allowed
    const sanitized = val.replace(/[^a-zA-Z\s]/g, "");
    setTitle(sanitized);
  };

  const handleDescriptionChange = (val: string) => {
    // Alphanumeric and spaces/line breaks only
    const sanitized = val.replace(/[^a-zA-Z0-9\s\n\r]/g, "");
    setDescription(sanitized);
  };

  const handleAmountChange = (val: string) => {
    // Floating point number only, reject scientific notation
    if (val.toLowerCase().includes('e')) return;
    if (/^\d*\.?\d*$/.test(val)) {
      setAmount(val);
    }
  };

  const handleAmountBlur = () => {
    const val = parseFloat(amount || "0");
    if (isNaN(val)) {
      setAmount("0.00");
    } else {
      setAmount(val.toFixed(2));
    }
  };

  const adjustDuration = (delta: number) => {
    setDuration(prev => {
      const current = Number(prev) || 0;
      const newVal = Math.max(1, Math.min(365, current + delta));
      return newVal.toString();
    });
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold tracking-tight">Create Escrow Job</h3>
        <Badge className="bg-arc-ink/5 text-arc-ink/40">USDC Settlement</Badge>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Job Title</label>
          <input 
            type="text" 
            placeholder="e.g. UI Redesign for DeFi App" 
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-arc-paper border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Job Description</label>
          <textarea 
            placeholder="Detailed scope of work..." 
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-arc-paper border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all text-sm resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Requirements</label>
          <input 
            type="text" 
            placeholder="React, Tailwind, ethers.js..." 
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-arc-paper border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Duration (Days)</label>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => adjustDuration(-1)}
                className="h-10 px-3 border border-arc-line bg-arc-paper hover:bg-arc-line/10 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <input 
                type="number" 
                min="1"
                max="365"
                placeholder="Duration" 
                value={duration}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (isNaN(val)) setDuration("");
                  else setDuration(Math.max(1, Math.min(365, val)).toString());
                }}
                className="w-full px-4 py-2.5 h-10 rounded-xl bg-arc-paper border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all font-mono text-sm text-center"
              />
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => adjustDuration(1)}
                className="h-10 px-3 border border-arc-line bg-arc-paper hover:bg-arc-line/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Total Budget (USDC)</label>
            <input 
              type="text" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onBlur={handleAmountBlur}
              className="w-full px-4 py-2.5 h-10 rounded-xl bg-arc-paper border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all font-mono text-sm"
            />
          </div>
        </div>

        <Button 
          onClick={handleCreate} 
          disabled={isPending || isConfirming} 
          className="w-full py-4 rounded-2xl shadow-xl shadow-arc-ink/10 flex items-center justify-center gap-2"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Securing Escrow...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Initialize & Fund Escrow
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function CollapsibleJobGroup({ 
  title, 
  icon: Icon, 
  children, 
  count,
  defaultOpen = false 
}: { 
  title: string, 
  icon: any, 
  children: React.ReactNode,
  count?: number,
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full group transition-all hover:bg-arc-ink/5 p-2 -mx-2 rounded-xl"
      >
        <div className="flex items-center gap-2 px-1">
          <Icon className={cn("w-4 h-4 transition-colors", isOpen ? "text-arc-ink" : "text-arc-ink/40")} />
          <span className={cn("text-[10px] uppercase font-bold tracking-widest transition-colors", isOpen ? "text-arc-ink" : "text-arc-ink/40")}>
            {title}
          </span>
          {count !== undefined && count > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] bg-arc-ink/10 text-arc-ink font-bold">
              {count}
            </span>
          )}
        </div>
        <ChevronDown className={cn("w-3 h-3 text-arc-ink/20 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployerProfile({ address, onSelect }: { address: `0x${string}`, onSelect: (id: bigint) => void }) {
  const { refetchJobs, allJobs, jobIdentities, derivedStats } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profile = derivedStats.employer;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refetchJobs();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-10">
      <div className={cn("space-y-6 transition-opacity", !profile.rated && "opacity-60")}>
        <div className="flex items-center justify-between border-b border-arc-line pb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-arc-ink" />
            <h2 className="text-xl font-medium tracking-tight">Reputation Matrix</h2>
            <div className="flex items-center gap-6 ml-4">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-arc-ink/30 leading-tight">Reputation Tier</span>
                <span className={cn("text-sm font-medium", !profile.rated ? "text-arc-ink/40" : "text-arc-ink")}>
                  {profile.rated ? profile.tier : "Unrated"}
                </span>
              </div>
              <div className="flex flex-col border-l border-arc-line pl-6">
                <span className="text-[9px] uppercase font-bold text-arc-ink/30 leading-tight">Score</span>
                <span className="text-sm font-bold text-arc-ink">
                  {profile.rated ? `=> ${profile.score}` : "--"}
                </span>
              </div>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg hover:bg-arc-ink/5 transition-colors disabled:opacity-50 ml-2"
              title="Refresh Protocol State"
            >
              <RefreshCcw className={cn("w-4 h-4 text-arc-ink/40", isRefreshing && "animate-spin")} />
            </button>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Protocol Truth</Badge>
        </div>
        
        {!profile.rated && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex items-center gap-3">
             <AlertTriangle className="w-4 h-4 text-amber-500" />
             <div className="text-xs text-amber-700 font-medium">
               Minimum 3 funded jobs required for reputation indexing. 
               Current: {profile.funded}/3
             </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Completed Jobs</div>
             <div className="text-xl font-mono">{profile.completed}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Failed Settlements</div>
             <div className="text-xl font-mono text-red-500">{profile.failed}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Disputed Jobs</div>
             <div className="text-xl font-mono text-purple-600">{profile.disputes}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Escrowed Jobs</div>
             <div className="text-xl font-mono text-emerald-600">${Number(formatUnits(profile.paid, USDC_DECIMALS)).toLocaleString()}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Disputes Won</div>
             <div className="text-xl font-mono text-emerald-600">+{profile.disputesWon}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Disputes Lost</div>
             <div className="text-xl font-mono text-red-500">-{profile.disputesLost}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeveloperProfile({ address, onSelect }: { address: `0x${string}`, onSelect: (id: bigint) => void }) {
  const { jobIdentities, allJobs: rawAllJobs, refetchJobs, jobsData, derivedStats, resolutionHistory } = useAppContext();
  
  const allJobs = useMemo(() => {
    return rawAllJobs.filter(id => {
      const job = jobsData[id.toString()];
      if (!job) return true; // Keep visible if data not yet loaded to prevent total flicker
      const employerAddr = (job[0] || "").toString().toLowerCase();
      // Strict Role Isolation: exclude if user is the employer
      const isUserEmployer = employerAddr === address?.toLowerCase();
      return !isUserEmployer;
    });
  }, [rawAllJobs, jobsData, address]);

  const hasJobs = allJobs.length > 0;
  const items = useMemo(() => {
    const active: bigint[] = [];
    const completed: bigint[] = [];
    const failed: bigint[] = [];

    allJobs.forEach(id => {
      const job = jobsData[id.toString()];
      if (!job) return;
      
      const developer = job[1];
      const status = job[5];
      if (!developer || developer === zeroAddress) return;
      if (developer.toLowerCase() !== address?.toLowerCase()) return;
      
      const s = Number(status);
      const res = resolutionHistory[id.toString()];
      
      const isFailed = s === 6 || s === 7 || (res && res.winner === 'emp');
      const isCompleted = s === 4 || (res && res.winner === 'dev');
      const isActive = !isFailed && !isCompleted && s >= 2 && s <= 8;

      if (isActive) active.push(id);
      if (isCompleted) completed.push(id);
      if (isFailed) failed.push(id);
    });

    return { active, completed, failed };
  }, [allJobs, jobsData, address, resolutionHistory]);

  const profile = derivedStats.developer;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    refetchJobs();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const tier = profile.rated ? profile.tier : 'Unrated';
  const score = profile.score;

  const counts = {
    active: items.active.length,
    completed: items.completed.length,
    failed: items.failed.length
  };

  return (
    <div className="space-y-10">
      {/* Detailed Signals Section */}
      <div className={cn("space-y-6 transition-opacity", !profile.rated && "opacity-60")}>
        <div className="flex items-center justify-between border-b border-arc-line pb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-arc-ink" />
            <h2 className="text-xl font-medium tracking-tight">Reputation Matrix</h2>
            <div className="flex items-center gap-6 ml-4">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-arc-ink/30 leading-tight">Reputation Tier</span>
                <span className={cn("text-sm font-medium", !profile.rated ? "text-arc-ink/40" : "text-arc-ink")}>
                  {tier}
                </span>
              </div>
              <div className="flex flex-col border-l border-arc-line pl-6">
                <span className="text-[9px] uppercase font-bold text-arc-ink/30 leading-tight">Score</span>
                <span className="text-sm font-bold text-arc-ink">
                  {profile.rated ? `=> ${score}` : "--"}
                </span>
              </div>
            </div>
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg hover:bg-arc-ink/5 transition-colors disabled:opacity-50 ml-2"
              title="Refresh Reputation"
            >
              <RefreshCcw className={cn("w-4 h-4 text-arc-ink/40", isRefreshing && "animate-spin")} />
            </button>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active Indexing</Badge>
        </div>

        {!profile.rated && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex items-center gap-3">
             <AlertTriangle className="w-4 h-4 text-amber-500" />
             <div className="text-xs text-amber-700 font-medium">
               Minimum 3 completed jobs required for reputation indexing. 
               Current: {profile.totalJobs}/3
             </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Completed</div>
             <div className="text-xl font-mono">{profile.completed}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Failed</div>
             <div className="text-xl font-mono">{profile.failed}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Total Earned</div>
             <div className="text-xl font-mono">${Math.floor(Number(formatUnits(profile.earned, USDC_DECIMALS))).toLocaleString()}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center bg-purple-50/30">
             <div className="text-[10px] uppercase font-bold text-purple-600/40 mb-1">Disputed Jobs</div>
             <div className="text-xl font-mono text-purple-600">{profile.disputes}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Disputes Won</div>
             <div className="text-xl font-mono text-emerald-600">+{profile.disputesWon}</div>
          </div>
          <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
             <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Disputes Lost</div>
             <div className="text-xl font-mono text-red-500">-{profile.disputesLost}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight">Work History</h2>
            <Badge className="bg-arc-ink text-white">Live Lifecycle</Badge>
          </div>
          
          <div className="space-y-6">
            <CollapsibleJobGroup title="Active Jobs" icon={Clock} defaultOpen={true} count={counts.active}>
              {items.active.length > 0 ? items.active.map(id => (
                <JobCard key={id.toString()} jobId={id} viewerAddress={address} compact onSelect={onSelect} role="developer" />
              )) : (
                <div className="text-xs text-arc-ink/30 italic p-4 border border-dashed border-arc-line rounded-2xl">No active jobs found.</div>
              )}
            </CollapsibleJobGroup>
            
            <CollapsibleJobGroup title="Completed Jobs" icon={CircleCheck} count={counts.completed}>
              {items.completed.length > 0 ? items.completed.map(id => (
                <JobCard key={id.toString()} jobId={id} viewerAddress={address} compact onSelect={onSelect} role="developer" />
              )) : (
                <div className="text-xs text-arc-ink/30 italic p-4 border border-dashed border-arc-line rounded-2xl">No completed jobs found.</div>
              )}
            </CollapsibleJobGroup>

            <CollapsibleJobGroup title="Failed Settlements" icon={XCircle} count={counts.failed}>
              {items.failed.length > 0 ? items.failed.map(id => (
                <JobCard key={id.toString()} jobId={id} viewerAddress={address} compact onSelect={onSelect} role="developer" />
              )) : (
                <div className="text-xs text-arc-ink/30 italic p-4 border border-dashed border-arc-line rounded-2xl">No failed settlements found.</div>
              )}
            </CollapsibleJobGroup>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight">Available Markets</h2>
            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">Live Opportunities</Badge>
          </div>
          
          <div className="space-y-4">
            {allJobs.length > 0 ? (
              <div className="space-y-4">
                {allJobs.map(id => {
                  const identity = jobIdentities[id.toString()];
                  const job = jobsData[id.toString()];
                  if (!job) return null;
                  const status = Number(job[5]);
                  // Only show funded and not assigned jobs as "opportunities"
                  if (status === 1 && (identity?.developer === zeroAddress || !identity?.developer)) {
                    return <JobCard key={id.toString()} jobId={id} viewerAddress={address} compact onSelect={onSelect} />;
                  }
                  return null;
                })}
              </div>
            ) : (
              <div className="p-12 border border-dashed border-arc-line rounded-3xl flex flex-col items-center justify-center text-center space-y-4 bg-arc-ink/[0.02]">
                <div className="p-4 bg-arc-ink/5 rounded-full">
                   <Zap className="w-8 h-8 text-arc-ink/20" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-arc-ink/60">No new opportunities</p>
                  <p className="text-xs text-arc-ink/30">Check back later for newly funded jobs.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobFilterWrapper({ jobId, viewerAddress, mode, onSelect }: { key?: string, jobId: bigint, viewerAddress: `0x${string}`, mode: 'active' | 'completed' | 'failed', onSelect: (id: bigint) => void }) {
  const { jobsData, resolutionHistory } = useAppContext();
  const job = jobsData[jobId.toString()];

  if (!job) return null;
  const developer = job[1];
  const status = job[5];

  if (!developer || developer === zeroAddress) return null;
  
  const isMine = developer.toLowerCase() === viewerAddress?.toLowerCase();
  const s = Number(status);
  const res = resolutionHistory[jobId.toString()];
  
  // Deterministic Lifecycle Logic
  const isFailed = s === 6 || s === 7 || (res && res.winner === 'emp');
  const isCompleted = s === 4 || (res && res.winner === 'dev');
  const isActive = !isFailed && !isCompleted && s >= 2 && s <= 8;

  if (mode === 'active' && (!isMine || !isActive)) return null;
  if (mode === 'completed' && (!isMine || !isCompleted)) return null;
  if (mode === 'failed' && (!isMine || !isFailed)) return null;

  return <JobCard jobId={jobId} viewerAddress={viewerAddress} compact onSelect={onSelect} role="developer" />;
}

function JobExplorer({ address, role, onSelect }: { address: `0x${string}`, role: 'developer' | 'employer', onSelect: (id: bigint) => void }) {
  const { derivedStats } = useAppContext();
  const profile = derivedStats.employer;

  if (role === 'developer') return null; // Logic moved to DeveloperProfile

  if (role === 'employer') {
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium tracking-tight">Escrow Board</h2>
            <Badge className="bg-arc-ink/5 text-arc-ink/40">Employer Admin</Badge>
          </div>
        </div>

        <div className="space-y-6">
          <CollapsibleJobGroup title="Open Jobs" icon={Zap} defaultOpen={true} count={profile.open}>
            <EmployerJobSection 
              address={address} 
              statuses={[0, 1]} 
              onSelect={onSelect} 
            />
          </CollapsibleJobGroup>

          <CollapsibleJobGroup title="Active Jobs" icon={Clock} count={profile.active}>
            <EmployerJobSection 
              address={address} 
              statuses={[2, 3, 5, 8]} 
              onSelect={onSelect} 
            />
          </CollapsibleJobGroup>

          <CollapsibleJobGroup title="Completed Jobs" icon={CircleCheck} count={profile.completed}>
            <EmployerJobSection 
              address={address} 
              statuses={[4]} 
              isCompletedGroup
              onSelect={onSelect} 
            />
          </CollapsibleJobGroup>

          <CollapsibleJobGroup title="Failed Settlements" icon={XCircle} count={profile.failed}>
            <EmployerJobSection 
              address={address} 
              statuses={[7]} 
              isFailedSettlement
              onSelect={onSelect} 
            />
          </CollapsibleJobGroup>
        </div>
      </div>
    );
  }

  return null;
}

function EmployerJobSection({ address, statuses, onSelect, isFailedSettlement, isCompletedGroup }: { address: `0x${string}`, statuses: number[], onSelect: (id: bigint) => void, isFailedSettlement?: boolean, isCompletedGroup?: boolean }) {
  const { allJobs, jobsData, resolutionHistory } = useAppContext();
  
  const relevantJobs = useMemo(() => {
    return allJobs.filter(id => {
      const job = jobsData[id.toString()];
      if (!job) return false;
      
      const employerAddr = (job[0] || "").toString().toLowerCase();
      const isMine = employerAddr === address?.toLowerCase();
      if (!isMine) return false;

      const status = Number(job[5]);
      const res = resolutionHistory[id.toString()];
      
      if (isFailedSettlement) {
         // Employer view "Failed Settlements" = Cancellation, Rejection, or Refunded (Dispute Won)
         return (status === 6 || status === 7 || (res && res.winner === 'emp'));
      }

      if (isCompletedGroup) {
         // Employer view "Completed Jobs" = Normally completed or Paid out (Dispute Lost)
         return (status === 4 || (res && res.winner === 'dev'));
      }

      // Active jobs (or Open) should not show if they are already resolved/settled
      if (res || status === 4 || status === 6 || status === 7) return false;

      return statuses.includes(status);
    });
  }, [allJobs, jobsData, address, statuses, isFailedSettlement, isCompletedGroup, resolutionHistory]);

  if (relevantJobs.length === 0) {
    return <div className="text-xs text-arc-ink/30 italic p-4 border border-dashed border-arc-line rounded-2xl">No projects found in this stage.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {relevantJobs.map(id => (
         <JobCard key={id.toString()} jobId={id} viewerAddress={address} compact onSelect={onSelect} role="employer" />
      ))}
    </div>
  );
}

function JobStatusFilter({ jobId, viewerAddress, targetStatuses, onSelect, jobIdentities }: { key?: string, jobId: bigint, viewerAddress: `0x${string}`, targetStatuses: number[], onSelect: (id: bigint) => void, jobIdentities: any }) {
  const { data: job } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'jobs',
    args: [jobId],
  });

  if (!job) return null;
  const jobArray = Array.isArray(job) ? job : null;
  const employer = jobArray ? jobArray[0] : (job as any).employer;
  const status = jobArray ? jobArray[5] : (job as any).status;

  if (!employer || employer === zeroAddress) return null;

  if (employer?.toLowerCase() !== viewerAddress?.toLowerCase()) return null;
  if (!targetStatuses.includes(Number(status))) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <JobCard jobId={jobId} viewerAddress={viewerAddress} compact onSelect={onSelect} role="employer" />
    </motion.div>
  );
}

function JobDiscoveryFilter({ jobId, viewerAddress, role, onSelect, jobIdentities }: { key?: string, jobId: bigint, viewerAddress: `0x${string}`, role: 'developer' | 'employer', onSelect: (id: bigint) => void, jobIdentities: any }) {
  const { data: job } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'jobs',
    args: [jobId],
  });

  if (!job) return null;
  const jobArray = Array.isArray(job) ? job : null;
  const employer = jobArray ? jobArray[0] : (job as any).employer;
  const status = jobArray ? jobArray[5] : (job as any).status;

  if (!employer || employer === zeroAddress) return null;

  // Requirement: Only show jobs in 'Funded' status (1) for developers in public explorer, and exclude self-posted jobs
  if (role === 'developer' && (Number(status) !== 1 || (employer && employer.toLowerCase() === viewerAddress?.toLowerCase()))) return null;
  if (role === 'employer' && employer?.toLowerCase() !== viewerAddress?.toLowerCase()) return null;
  
  return <JobCard jobId={jobId} viewerAddress={viewerAddress} compact onSelect={onSelect} role={role} />;
}

function RejectionTimer({ jobId, onExpire }: { jobId: bigint, onExpire?: () => void }) {
  const { data: rejectionTimestamp } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'rejectionTimestamps',
    args: [jobId],
  });

  const { writeContract } = useWriteContract();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!rejectionTimestamp) return;
    
    const rTimestamp = Number(rejectionTimestamp);
    if (rTimestamp === 0) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = (rTimestamp + 24 * 60 * 60) - now;
      
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        if (onExpire) onExpire();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rejectionTimestamp, jobId, onExpire]);

  if (timeLeft === null) return null;

  if (timeLeft === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white animate-pulse cursor-pointer" onClick={() => onExpire?.()}>
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase font-bold tracking-wider">Timeout Reached - Trigger Refund</span>
      </div>
    );
  }

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-mono font-bold">{h}h</span>
        <span className="text-xs font-mono font-bold">{m}m</span>
        <span className="text-[10px] font-mono opacity-60">{s}s</span>
      </div>
      <span className="text-[10px] uppercase font-bold tracking-wider ml-1">Auto-Refund In</span>
    </div>
  );
}

function DisputeTimer({ jobId, onExpire }: { jobId: any, onExpire?: () => void }) {
  const { data: disputeTimestamp } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'disputeTimestamps',
    args: [jobId],
  });

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!disputeTimestamp) return;
    const dTimestamp = Number(disputeTimestamp);
    if (dTimestamp === 0) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = (dTimestamp + 24 * 60 * 60) - now;
      
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        if (onExpire) onExpire();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [disputeTimestamp, jobId, onExpire]);

  if (timeLeft === null) return null;

  if (timeLeft === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white animate-pulse cursor-pointer" onClick={() => onExpire?.()}>
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase font-bold tracking-wider underline">Dispute Window Expired - Finalize Refund</span>
      </div>
    );
  }

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 border border-orange-200">
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-mono font-bold">{h}h</span>
        <span className="text-xs font-mono font-bold">{m}m</span>
        <span className="text-[10px] font-mono opacity-60">{s}s</span>
      </div>
      <span className="text-[10px] uppercase font-bold tracking-wider ml-1">Dispute Finality In</span>
    </div>
  );
}

function CountdownTimer({ jobId, durationDays, compact }: { jobId: bigint, durationDays: number, compact?: boolean }) {
  const timerPublicClient = usePublicClient();
  const [assignedAt, setAssignedAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    async function getAssignmentTime() {
      if (!timerPublicClient) return;
      try {
        const toBlock = await timerPublicClient.getBlockNumber();
        const fromBlock = toBlock > BigInt(5000) ? toBlock - BigInt(5000) : BigInt(0);
        
        const logs = await timerPublicClient.getLogs({
          address: JOB_ESCROW_ADDRESS,
          event: {
            type: 'event',
            name: 'JobAssigned',
            inputs: [
              { type: 'uint256', name: 'jobId', indexed: true },
              { type: 'address', name: 'developer', indexed: true }
            ]
          },
          args: { jobId },
          fromBlock,
          toBlock
        });

        if (logs.length > 0) {
          const block = await timerPublicClient.getBlock({ blockHash: logs[0].blockHash! });
          setAssignedAt(Number(block.timestamp));
        }
      } catch (e) {
        console.error("Error fetching logs for JobAssigned", e);
      }
    }
    getAssignmentTime();
  }, [jobId, timerPublicClient]);

  useEffect(() => {
    if (!assignedAt) return;
    
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = assignedAt + (durationDays * 24 * 60 * 60);
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
      } else {
        const d = Math.floor(diff / (24 * 60 * 60));
        const h = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
        const m = Math.floor((diff % (60 * 60)) / 60);
        const s = diff % 60;
        setTimeLeft({ d, h, m, s });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [assignedAt, durationDays]);

  if (!timeLeft) return null;

  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-lg bg-arc-ink/5 border border-arc-line transition-all duration-300",
      compact ? "px-1.5 py-0.5" : "px-3 py-1.5"
    )}>
      <Clock className={cn("text-arc-ink/40", compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
      <div className="flex items-baseline gap-1 focus-within:ring-0">
        <span className={cn("font-mono font-bold", compact ? "text-[10px]" : "text-xs")}>{timeLeft.d}d</span>
        <span className={cn("font-mono font-bold", compact ? "text-[10px]" : "text-xs")}>{timeLeft.h}h</span>
        <span className={cn("font-mono font-bold", compact ? "text-[10px]" : "text-xs")}>{timeLeft.m}m</span>
        {!compact && <span className="text-[10px] font-mono opacity-40">{timeLeft.s}s</span>}
      </div>
      {!compact && <span className="text-[10px] uppercase font-bold text-arc-ink/40 tracking-wider ml-1">Left</span>}
    </div>
  );
}

function ActiveWalletIdentity({ 
  address, 
  fallback, 
  className,
  stats,
  mode = 'detailed'
}: { 
  address: string, 
  fallback?: string, 
  className?: string,
  stats?: { tier: string, score: number },
  mode?: 'summary' | 'detailed'
}) {
  const { data: github } = useReadContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'addressToGithub',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && address !== zeroAddress }
  });

  const username = (github && github !== zeroAddress && github !== "") ? github as string : null;
  const addressFallback = fallback || (address ? `${address.slice(0, 8)}...` : 'Unknown');

  if (mode === 'summary') {
    return (
      <div className={cn("font-mono text-[10px] items-center gap-1.5", className)}>
        {username ? (
          <GitHubHoverPreview username={username} />
        ) : (
          <span className="opacity-60">{addressFallback}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="font-mono flex items-center gap-1.5 text-xs">
        {username ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-arc-ink/40 font-bold uppercase tracking-widest text-[10px]">GitHub:</span>
              <GitHubHoverPreview username={username} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-arc-ink/40 font-bold uppercase tracking-widest text-[10px]">Wallet:</span>
              <span className="opacity-60 text-[10px]">{addressFallback}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-arc-ink/40 font-bold uppercase tracking-widest text-[10px]">Wallet:</span>
            <span className="opacity-60 text-xs">{addressFallback}</span>
          </div>
        )}
      </div>
      {stats && (
        <Badge className="bg-arc-ink text-white shrink-0 w-fit">
          {stats.tier} ({stats.score})
        </Badge>
      )}
    </div>
  );
}

function JobCard({ jobId, viewerAddress, compact, onSelect, role }: { key?: string, jobId: bigint, viewerAddress: `0x${string}`, compact?: boolean, onSelect?: (id: bigint) => void, role?: 'developer' | 'employer' }) {
  const { interactionState, setInteractionState, alert, jobsData, refetchJobs, resolutionHistory, disputedJobs } = useAppContext();
  const job = jobsData[jobId.toString()];
  
  const queryClient = useQueryClient();
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['job', jobId.toString()] });
    refetchJobs();
  }, [jobId, refetchJobs, queryClient]);

  const { data: activeJobsCount } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'activeJobsCount',
    args: viewerAddress ? [viewerAddress] : undefined,
    query: { enabled: !!viewerAddress }
  });

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: viewerAddress ? [viewerAddress, JOB_ESCROW_ADDRESS] : undefined,
    query: { enabled: !!viewerAddress }
  });

  const { data: resubCount } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'resubmissionCount',
    args: [jobId],
  });

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
    confirmations: 1
  });

  useEffect(() => {
    if (writeError) {
      console.error("[Escrow Debug] Write Error:", writeError);
      const msg = writeError.message.toLowerCase();
      if (msg.includes("user rejected")) return;
      alert({ 
        title: "Transaction Error", 
        message: writeError.message.slice(0, 100) + (writeError.message.length > 100 ? '...' : ''),
        type: "error"
      });
    }
  }, [writeError, alert]);

  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess, refetch]);

  if (!job || job[0] === zeroAddress) return compact ? null : <Card>Job not found</Card>;

  const [employer, developer, amount, upfrontAmount, metadataURL, status, upfrontPaid, upfrontPercent] = job as any;
  const isEmployer = viewerAddress?.toLowerCase() === employer?.toLowerCase();
  const isDeveloper = viewerAddress?.toLowerCase() === developer?.toLowerCase();

  const actualRole = role || (isDeveloper ? 'developer' : (isEmployer ? 'employer' : undefined));

  // Requirement: Employer should never have access to the same job that he posted when he switch to his developer section
  if (actualRole === 'developer' && isEmployer) {
    return null;
  }

  const rawStatusLabels = ["REQUESTED", "FUNDED", "ACCEPTED", "SUBMITTED", "COMPLETED", "DISPUTED", "CANCELLED", "REJECTED"];
  
  const disputedAt = disputedJobs[jobId.toString()] || 0n;
  let res = resolutionHistory[jobId.toString()];
  const isDisputed = disputedAt > 0n || Number(status) === 5 || !!res;
  
  // Heuristic Fallback
  if (!res && isDisputed) {
     if (Number(status) === 4) res = { winner: 'dev' };
     if (Number(status) === 7 || Number(status) === 6) res = { winner: 'emp' };
  }
  
  let displayStatus = rawStatusLabels[Number(status)];
  let isDisputeVictory = false;
  
  // Deterministic outcome mapping for disputes
  if (res) {
    const isWinner = actualRole ? (res.winner === (actualRole === 'developer' ? 'dev' : 'emp')) : false;
    displayStatus = isWinner ? "DISPUTE WON" : "DISPUTE LOST";
    isDisputeVictory = isWinner;
  } else if (Number(status) === 6) {
    displayStatus = "CANCELLED";
  } else if (Number(status) === 4) {
    displayStatus = "COMPLETED";
  } else if (Number(status) === 5) {
    displayStatus = "DISPUTED";
  } else if (Number(status) === 1 || Number(status) === 0) {
    displayStatus = "REQUESTED";
  } else if (Number(status) === 2 || Number(status) === 3) {
    displayStatus = "ACCEPTED";
  } else if (Number(status) === 7) {
    displayStatus = "REJECTED";
  } else if (Number(status) === 8) { // RESOLVING is sometimes used internally, map to DISPUTED
    displayStatus = "DISPUTED";
  }
  
  let parsedMetadata = { title: "Unnamed Job", description: "No description provided.", requirements: "None", duration: 0 };
  try {
    if (metadataURL && metadataURL.startsWith('{')) {
      parsedMetadata = JSON.parse(metadataURL);
    }
  } catch (e) {
    console.warn("Failed to parse metadata", e);
  }

  const needsApproval = allowance !== undefined && (allowance as bigint) < (amount as bigint);
  const hasResubmitted = Number(resubCount || 0) >= 1;

  const handleApprove = () => {
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [JOB_ESCROW_ADDRESS, amount as bigint],
    } as any);
  };

  const handleCancel = () => {
    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'cancelJob',
      args: [BigInt(jobId.toString())],
    } as any);
  };

  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submissionData, setSubmissionData] = useState({
    description: '',
    externalLink: '',
    fileName: '',
    fileData: ''
  });

  const handleAccept = () => {
    if (isEmployer) {
      alert({
        title: "Validation Error",
        message: "As the employer, you cannot accept your own job. Please connect a different wallet to act as a developer.",
        type: "error"
      });
      return;
    }
    if (activeJobsCount && (activeJobsCount as bigint) >= BigInt(100)) {
      alert({
        title: "Validation Error",
        message: "Job limit reached (100 active jobs max)",
        type: "error"
      });
      return;
    }
    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'acceptJob',
      args: [BigInt(jobId.toString())],
    } as any);
  };

  const handleSubmit = () => {
    if (!submissionData.description) {
      alert({ title: "Submission Error", message: "Please provide a description of the work performed.", type: "error" });
      return;
    }
    
    if (Number(status) === 7) {
      setIsSubmittingWork(true);
      setShowResubmitConfirm(false);
    }
    
    if (submissionData.fileData) {
      setInteractionState(prev => ({
        ...prev,
        assets: { ...prev.assets, [jobId.toString()]: submissionData.fileData }
      }));
    }

    const { fileData, ...metadata } = submissionData;
    const submissionBody = JSON.stringify({
      ...metadata,
      submittedAt: Date.now()
    });

    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: "submitWork",
      args: [jobId, submissionBody],
    } as any);
  };

  const handleApproveWork = () => {
    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'approveWork',
      args: [BigInt(jobId.toString())],
    } as any);
  };

  const handleRejectWork = () => {
    if (!rejectionReason) {
      setShowRejectInput(true);
      return;
    }
    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'rejectWork',
      args: [BigInt(jobId.toString()), rejectionReason],
    } as any);
    setRejectionReason("");
    setShowRejectInput(false);
  };

  const handleFund = () => {
    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'fundJob',
      args: [BigInt(jobId.toString())],
    } as any);
  };

  const handleAcceptRejection = () => {
    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'acceptRejection',
      args: [BigInt(jobId.toString())],
    } as any);
  };

  const handleExpireRejection = () => {
    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'cancelJob',
      args: [BigInt(jobId.toString())],
    } as any);
  };

  const handleExpireDispute = () => {
    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'resolveDispute',
      args: [BigInt(jobId.toString()), true], // Favor developer by default on timeout
    } as any);
  };

  const { allDerivedStats } = useAppContext();
  
  const empRep = allDerivedStats[(employer as string).toLowerCase()] || {
    employer: { score: 0, tier: 'Rookie' }
  };
  
  const devRep = developer && developer !== zeroAddress ? (allDerivedStats[developer.toLowerCase()] || {
    developer: { score: 0, tier: 'Rookie' }
  }) : null;

  const cardPublicClient = usePublicClient();
  
  useEffect(() => {
    async function getPastEvents() {
      if (!cardPublicClient || !jobId) return;
      try {
        const toBlock = await cardPublicClient.getBlockNumber();
        const startBlock = toBlock > BigInt(10000) ? toBlock - BigInt(10000) : BigInt(0);
        
        const submissionLogs = await cardPublicClient.getLogs({
          address: JOB_ESCROW_ADDRESS,
          event: {
            type: 'event',
            name: 'WorkSubmitted',
            inputs: [
              { type: 'uint256', name: 'jobId', indexed: true },
              { type: 'string', name: 'proofHash' }
            ]
          },
          args: { jobId },
          fromBlock: startBlock,
          toBlock
        });

        if (submissionLogs.length > 0) {
          const log = submissionLogs[submissionLogs.length - 1] as any;
          const rawHash = log.args.proofHash;
          if (rawHash && rawHash.trim().startsWith('{')) {
            setSubmissionInfo(JSON.parse(rawHash));
          }
        }

        const rejectionLogs = await cardPublicClient.getLogs({
          address: JOB_ESCROW_ADDRESS,
          event: {
            type: 'event',
            name: 'WorkRejected',
            inputs: [
              { type: 'uint256', name: 'jobId', indexed: true },
              { type: 'uint256', name: 'rejectionTimestamp', indexed: false },
              { type: 'string', name: 'reason', indexed: false }
            ]
          },
          args: { jobId },
          fromBlock: startBlock,
          toBlock
        });

        if (rejectionLogs.length > 0) {
          const log = rejectionLogs[rejectionLogs.length - 1] as any;
          setRejectionReasonText(log.args.reason);
        }
      } catch (e) {
        console.error("Historical events fetch failed", e);
      }
    }
    if (Number(status) >= 3) {
      getPastEvents();
    }
  }, [jobId, status, cardPublicClient]);

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'WorkRejected',
    onLogs(logs) {
      const relevantLog = logs.find((log: any) => BigInt(log.args.jobId) === BigInt(jobId));
      if (relevantLog) {
        setRejectionReasonText((relevantLog.args as any).reason);
        refetch();
      }
    },
  });

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'WorkSubmitted',
    onLogs(logs) {
      const relevantLog = logs.find((log: any) => BigInt(log.args.jobId) === BigInt(jobId));
      if (relevantLog) {
        try {
          const content = (relevantLog.args as any).proofHash;
          if (content && content.trim().startsWith('{')) {
            setSubmissionInfo(JSON.parse(content));
          }
        } catch (e) {
          console.warn("Failed to parse submission event data", e);
        }
        refetch();
      }
    },
  });

  const accessRequested = interactionState.accessRequests[jobId.toString()] || false;
  const keysSubmitted = interactionState.keysSubmitted[jobId.toString()];

  const handleDemandAccess = () => {
    setInteractionState(prev => ({
      ...prev,
      accessRequests: { ...prev.accessRequests, [jobId.toString()]: true }
    }));
  };

  const [keySubmission, setKeySubmission] = useState({ backendKeys: '', repoAccess: '' });
  
  const downloadFile = (fileName: string) => {
    const storedData = interactionState.assets[jobId.toString()];
    
    if (storedData) {
      const link = document.createElement('a');
      link.href = storedData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const content = `ARC SECURE PROTOCOL - DECRYPTION ERROR\n\nJob ID: ${jobId}\nFile Name: ${fileName}\n\nREASON: Original binary fragments not found in local handover vault.\n\nWORK DESCRIPTION:\n${submissionInfo?.description || 'N/A'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `MISSING_${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleSubmitKeys = () => {
    setInteractionState(prev => ({
      ...prev,
      keysSubmitted: { 
        ...prev.keysSubmitted, 
        [jobId.toString()]: { ...keySubmission, submittedAt: Date.now() } 
      }
    }));
  };

  const [rejectionReasonText, setRejectionReasonText] = useState<string | null>(null);
  const [submissionInfo, setSubmissionInfo] = useState<any>(null);

  if (compact) {
    return (
      <Card 
        onClick={() => onSelect?.(jobId)}
        className="p-4 space-y-3 cursor-pointer hover:border-arc-ink/40 transition-all group relative overflow-hidden"
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 overflow-hidden">
             <div className="flex flex-wrap items-center gap-1.5 min-w-0">
               <Badge className="bg-arc-ink/5 text-arc-ink/40 shrink-0">#{jobId.toString()}</Badge>
               <div className="min-w-0">
                 {Number(status) === 7 ? (
                   <RejectionTimer jobId={jobId} onExpire={handleExpireRejection} />
                 ) : Number(status) === 5 ? (
                   <DisputeTimer jobId={jobId} onExpire={handleExpireDispute} />
                 ) : (Number(status) === 2 || Number(status) === 3) && (
                   <CountdownTimer jobId={jobId} durationDays={parsedMetadata.duration} compact />
                 )}
               </div>
             </div>
             <Badge className={cn(
               "shrink-0 border whitespace-nowrap",
               Number(status) === 3 || displayStatus === "DISPUTE WON" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : 
               displayStatus === "DISPUTE LOST" || displayStatus === "CANCELLED" || displayStatus === "REJECTED" ? "bg-red-500/10 text-red-600 border-red-500/20" :
               "bg-arc-ink/5 text-arc-ink/40 border-arc-line"
             )}>
               {displayStatus}
             </Badge>
          </div>
          
          <div className="space-y-1">
            <h4 className="font-bold text-sm truncate text-arc-ink group-hover:text-arc-ink transition-colors leading-tight">
              {parsedMetadata.title}
            </h4>
            <p className="text-[11px] text-arc-ink/50 line-clamp-2 leading-relaxed h-[2.5em]">
              {parsedMetadata.description}
            </p>
          </div>
        </div>

        {parsedMetadata.requirements && (
          <div className="flex flex-wrap gap-1">
            {parsedMetadata.requirements.split(',').slice(0, 3).map((skill, i) => (
              <span key={i} className="text-[9px] font-bold text-arc-ink/30 uppercase tracking-tighter">
                {skill.trim()}{i < 2 && parsedMetadata.requirements.split(',').length > i + 1 ? ' ·' : ''}
              </span>
            ))}
          </div>
        )}

        {Number(status) === 7 && rejectionReasonText && (
          <div className="bg-red-50 p-2 rounded-lg border border-red-100 flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-red-900 line-clamp-1 italic font-medium">"{rejectionReasonText}"</p>
          </div>
        )}

        <div className="flex justify-between items-end pt-1 border-t border-arc-line/40">
           <div className="flex items-center gap-1.5 overflow-hidden">
             <div className="text-[10px] text-arc-ink/40 font-bold uppercase tracking-wider shrink-0">By</div>
             <ActiveWalletIdentity 
               address={employer} 
               className="scale-90 origin-left"
               stats={empRep.employer}
               mode="summary"
             />
           </div>
           <div className="text-sm font-mono font-bold text-arc-ink/80 shrink-0">
             {Math.floor(Number(formatUnits(amount as bigint, USDC_DECIMALS))).toLocaleString()} USDC
           </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-arc-ink rounded-2xl flex items-center justify-center text-white shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-arc-ink text-white">Job #{jobId.toString()}</Badge>
              {Number(status) === 7 ? (
                <RejectionTimer jobId={jobId} onExpire={handleExpireRejection} />
              ) : Number(status) === 5 ? (
                <DisputeTimer jobId={jobId} onExpire={handleExpireDispute} />
              ) : (Number(status) === 2 || Number(status) === 3) && (
                <CountdownTimer jobId={jobId} durationDays={parsedMetadata.duration} />
              )}
            </div>
            <h3 className="text-xl font-semibold tracking-tight">{parsedMetadata.title}</h3>
            <div className={cn(
              "text-[10px] uppercase font-bold tracking-widest flex items-center gap-1",
              (displayStatus || "").includes("LOST") || displayStatus === "CANCELLED" || displayStatus === "REJECTED" ? "text-red-500" : "text-emerald-600"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                (displayStatus || "").includes("LOST") || displayStatus === "CANCELLED" || displayStatus === "REJECTED" ? "bg-red-500" : "bg-emerald-500"
              )} />
              {displayStatus || "UNKNOWN"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-arc-ink">{Math.floor(Number(formatUnits(amount as bigint, USDC_DECIMALS))).toLocaleString()} USDC</div>
          <div className="text-[10px] text-arc-ink/40 uppercase font-black tracking-tight">Standard Escrow Settlement</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-arc-paper rounded-2xl border border-arc-line space-y-3">
           <div className="space-y-1">
            <span className="text-[10px] font-bold text-arc-ink/30 uppercase tracking-widest">Scope & Description</span>
            <p className="text-xs text-arc-ink/70 leading-relaxed">{parsedMetadata.description}</p>
           </div>
           <div className="grid grid-cols-2 gap-4 pt-2 border-t border-arc-line/50">
             <div className="space-y-1">
                <span className="text-[10px] font-bold text-arc-ink/30 uppercase tracking-widest">Requirements</span>
                <p className="text-xs font-medium">{parsedMetadata.requirements}</p>
             </div>
             <div className="space-y-1">
                <span className="text-[10px] font-bold text-arc-ink/30 uppercase tracking-widest">Duration</span>
                <p className="text-xs font-medium">{parsedMetadata.duration} Days</p>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-arc-paper rounded-2xl border border-arc-line italic">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-arc-ink/40 uppercase tracking-widest">Employer</div>
            <ActiveWalletIdentity 
              address={employer} 
              stats={empRep.employer}
            />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-arc-ink/40 uppercase tracking-widest">Developer</div>
            {developer === zeroAddress ? (
              <div className="text-xs font-mono text-arc-ink/40">NOT ASSIGNED</div>
            ) : (
              <ActiveWalletIdentity 
                address={developer} 
                stats={devRep?.developer}
              />
            )}
          </div>
        </div>

        {(isEmployer || isDeveloper) && Number(status) >= 3 && (
          <div className="space-y-4">
            {Number(status) === 7 && rejectionReasonText && (
               <div className="p-5 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Rejection Feedback from Employer</span>
                  </div>
                  <p className="text-sm text-red-900 font-medium italic leading-relaxed">"{rejectionReasonText}"</p>
               </div>
            )}

            {submissionInfo && (
              <div className="p-5 bg-emerald-500/[0.03] rounded-2xl border border-emerald-500/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-emerald-900 tracking-tight">Work Evidence & Report</h4>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {Number(status) === 3 ? "Awaiting Review" : "Submission Archive"}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/40 p-3 rounded-xl border border-emerald-500/5">
                    <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mb-1.5">Developer Commentaries</p>
                    <p className="text-xs text-emerald-900/80 leading-relaxed font-medium italic">
                      "{submissionInfo.description}"
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {submissionInfo.fileName && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          downloadFile(submissionInfo.fileName);
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-arc-line hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all text-left shadow-sm group cursor-pointer z-10"
                      >
                        <div className="p-2 bg-emerald-500/5 rounded-xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none">
                          <FileArchive className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 pointer-events-none">
                          <p className="text-[11px] font-bold text-arc-ink truncate">{submissionInfo.fileName}</p>
                          <p className="text-[9px] text-emerald-600/60 font-bold uppercase tracking-wider">Download Assets</p>
                        </div>
                      </button>
                    )}
                    {submissionInfo.externalLink && (
                      <a 
                        href={submissionInfo.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-2xl bg-arc-ink text-white hover:opacity-95 transition-all shadow-md group cursor-pointer z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors pointer-events-none">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 pointer-events-none">
                          <p className="text-[11px] font-bold truncate">Live Proof Portal</p>
                          <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Verification Link</p>
                        </div>
                      </a>
                    )}
                  </div>

                  {isEmployer && Number(status) === 3 && (
                    <div className="pt-2 border-t border-emerald-500/10 space-y-3">
                      <Button 
                        variant={accessRequested ? "secondary" : "ghost"}
                        size="sm"
                        onClick={handleDemandAccess}
                        disabled={accessRequested}
                        className={cn(
                          "w-full py-3 h-auto text-[10px] uppercase font-bold tracking-widest gap-2 flex items-center justify-center shadow-sm transition-all",
                          accessRequested ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100"
                        )}
                      >
                        {accessRequested ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Access Demanded - Awaiting Keys
                          </>
                        ) : (
                          <>
                            <Key className="w-3.5 h-3.5" />
                            Demand Full Access to Backend Keys & Private Repos
                          </>
                        )}
                      </Button>

                      {keysSubmitted && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2"
                        >
                          <div className="flex items-center gap-2 text-blue-800">
                            <Key className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Access Keys Handover</span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] text-blue-600/60 font-bold uppercase">Backend Secrets</div>
                            <code className="block text-[10px] bg-white p-2 rounded border border-blue-100 font-mono break-all text-arc-ink">
                              {keysSubmitted.backendKeys}
                            </code>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] text-blue-600/60 font-bold uppercase">Private Repository</div>
                            <a href={keysSubmitted.repoAccess} target="_blank" rel="noreferrer" className="text-[10px] text-blue-700 underline font-medium break-all">
                              {keysSubmitted.repoAccess}
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Employer Specific Actions */}
        {role === 'employer' && (
          <>
            {Number(status) === 0 && viewerAddress === employer && (
              <div className="flex gap-2">
                {needsApproval ? (
                  <Button onClick={handleApprove} loading={isPending || isConfirming} className="flex-1">
                    Approve USDC
                  </Button>
                ) : (
                  <Button onClick={handleFund} loading={isPending || isConfirming} className="flex-1">
                    Fund Escrow
                  </Button>
                )}
                <Button variant="ghost" onClick={handleCancel} loading={isPending || isConfirming} className="text-red-500 border border-red-100 hover:bg-red-50 px-4">
                  Cancel
                </Button>
              </div>
            )}

            {Number(status) === 1 && isEmployer && (
               <Button variant="ghost" onClick={handleCancel} loading={isPending || isConfirming} className="w-full text-red-500 border border-red-500/20 hover:bg-red-50">
               Cancel Job & Reclaim Funds
             </Button>
            )}

            {Number(status) === 3 && viewerAddress === employer && (
              <div className="space-y-4">
                {showRejectInput ? (
                  <div className="space-y-2 p-4 bg-red-50/50 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-red-400 px-1">Rejection Reason</label>
                    <textarea 
                      placeholder="Explain why the work is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white border border-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 text-sm min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleRejectWork} 
                        className="flex-1 bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-200"
                        loading={isPending || isConfirming}
                      >
                        Confirm Rejection
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowRejectInput(false)} 
                        className="px-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleApproveWork} loading={isPending || isConfirming} className="flex-1 shadow-lg shadow-emerald-500/10">
                      Approve & Release
                    </Button>
                    <Button variant="ghost" onClick={() => setShowRejectInput(true)} loading={isPending || isConfirming} className="text-red-500 border border-red-100 hover:bg-red-50">
                      Reject Work
                    </Button>
                  </div>
                )}
              </div>
            )}

            {Number(status) === 5 && viewerAddress === employer && (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="primary" 
                  onClick={() => writeContract({ address: JOB_ESCROW_ADDRESS, abi: JOB_ESCROW_ABI, functionName: 'resolveDispute', args: [BigInt(jobId.toString()), true] } as any)}
                  loading={isPending || isConfirming}
                  className="py-3"
                >
                  Favor Developer
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => writeContract({ address: JOB_ESCROW_ADDRESS, abi: JOB_ESCROW_ABI, functionName: 'resolveDispute', args: [BigInt(jobId.toString()), false] } as any)}
                  loading={isPending || isConfirming}
                  className="py-3"
                >
                  Favor Employer
                </Button>
              </div>
            )}
          </>
        )}

        {/* Developer Specific Actions */}
        {role === 'developer' && (
          <>
            {Number(status) === 1 && (developer === zeroAddress || developer === viewerAddress) && (
              <Button 
                onClick={handleAccept} 
                loading={isPending || isConfirming} 
                className="w-full"
                disabled={isEmployer}
              >
                {isEmployer ? "Awaiting Developer" : "Accept Job"}
              </Button>
            )}

            {(Number(status) === 2 || (Number(status) === 7 && isSubmittingWork)) && viewerAddress === developer && (
              <div className="space-y-4">
                {!isSubmittingWork ? (
                  <Button onClick={() => setIsSubmittingWork(true)} className="w-full">
                    Submit Work
                  </Button>
                ) : (
                  <div className="p-4 bg-arc-ink/5 rounded-2xl border border-arc-line space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold tracking-tight">Work Submission Form</h4>
                      <button onClick={() => setIsSubmittingWork(false)} className="text-arc-ink/40 hover:text-arc-ink">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Implementation Description</label>
                        <textarea 
                          placeholder="Describe the work you've completed..." 
                          value={submissionData.description}
                          onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all text-xs resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Proof of Work (ZIP, PDF, DOCX, CSV, XLSX, JPG, PNG)</label>
                          <div className="relative group cursor-pointer">
                            <input 
                              type="file" 
                              accept=".zip,.pdf,.docx,.csv,.xlsx,.jpg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (re) => {
                                    const dataUrl = re.target?.result as string;
                                    setSubmissionData(prev => ({ 
                                      ...prev, 
                                      fileName: file.name,
                                      fileData: dataUrl 
                                    }));
                                    // Pre-save to local storage for handover simulation
                                    localStorage.setItem(`arc_asset_${jobId.toString()}`, dataUrl);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                            />
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-arc-line group-hover:bg-arc-ink/[0.02] transition-colors text-xs text-arc-ink/60">
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate">{submissionData.fileName || "Select asset to upload..."}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">External Link (PR/Loom)</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="https://github.com/..." 
                              value={submissionData.externalLink}
                              onChange={(e) => setSubmissionData(prev => ({ ...prev, externalLink: e.target.value }))}
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all text-xs"
                            />
                            <Link className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-arc-ink/30" />
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleSubmit} loading={isPending || isConfirming} className="w-full">
                        Finalize Submission
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {Number(status) === 3 && viewerAddress === developer && (
              <div className="space-y-4">
                <div className="text-center py-2 px-4 rounded-xl bg-arc-ink/5 text-arc-ink/40 text-xs font-medium">
                  Awaiting Employer Approval
                </div>

                {accessRequested && !keysSubmitted && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-900 tracking-tight">Access Demand Detected</h4>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Handover Required for Approval</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-blue-600/60 px-1">Backend Keys / Secrets</label>
                        <textarea 
                          placeholder="DB_URI=..., API_KEY=..." 
                          value={keySubmission.backendKeys}
                          onChange={(e) => setKeySubmission(prev => ({ ...prev, backendKeys: e.target.value }))}
                          rows={2}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-blue-100 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-mono"
                        ></textarea>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-blue-600/60 px-1">Private Repository Link</label>
                        <input 
                          type="text"
                          placeholder="https://github.com/org/private-repo"
                          value={keySubmission.repoAccess}
                          onChange={(e) => setKeySubmission(prev => ({ ...prev, repoAccess: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-blue-100 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs"
                        />
                      </div>
                      <Button onClick={handleSubmitKeys} className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                        Submit Access Keys & Private Repos
                      </Button>
                    </div>
                  </motion.div>
                )}

                {keysSubmitted && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-800">Sensitive Keys Transmitted Securely</span>
                  </div>
                )}
              </div>
            )}

            {Number(status) === 4 && viewerAddress === developer && (
              <Button disabled className="w-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Funds Received
              </Button>
            )}
            
            {Number(status) === 5 && viewerAddress === developer && (
               <div className="text-center py-3 px-4 rounded-xl bg-orange-500/10 text-orange-600 text-xs font-bold uppercase tracking-widest">
                  Dispute Under Review
               </div>
            )}
            
            {Number(status) === 7 && viewerAddress === developer && (
               <div className="space-y-3">
                 <div className="text-center py-3 px-4 rounded-xl bg-red-500/10 text-red-600 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <CircleAlert className="w-4 h-4" />
                    Work Rejected by Employer
                 </div>
                 
                 {!isSubmittingWork && (
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     {!hasResubmitted ? (
                        <Button onClick={() => setShowResubmitConfirm(true)} className="flex-1">
                          Resubmit Work
                        </Button>
                     ) : (
                        <div className="text-[10px] text-arc-ink/30 italic flex items-center justify-center border border-arc-line rounded-xl px-2">Final Resubmission Pending</div>
                     )}
                     <Button 
                       variant="secondary" 
                       onClick={handleAcceptRejection} 
                       loading={isPending || isConfirming}
                       className="flex-1"
                     >
                       Accept Rejection
                     </Button>
                     <Button 
                       variant="ghost" 
                       onClick={() => writeContract({ address: JOB_ESCROW_ADDRESS, abi: JOB_ESCROW_ABI, functionName: 'openDispute', args: [BigInt(jobId.toString())] } as any)} 
                       loading={isPending || isConfirming}
                       className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                     >
                       Open Dispute
                     </Button>
                   </div>
                 )}

                 {/* Confirmation Modal for Resubmission */}
                 <AnimatePresence>
                   {showResubmitConfirm && (
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-arc-ink/60 backdrop-blur-sm shadow-2xl"
                        onClick={() => setShowResubmitConfirm(false)}
                     >
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.95, opacity: 0, y: 20 }}
                          onClick={(e) => e.stopPropagation()}
                          className="max-w-md w-full bg-white rounded-3xl p-8 border border-arc-line shadow-2xl space-y-6"
                        >
                          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-2">
                            <RefreshCcw className="w-8 h-8" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold tracking-tight text-arc-ink">Final Resubmission Opportunity</h3>
                            <p className="text-arc-ink/60 text-sm leading-relaxed">
                              You have one final opportunity to resubmit this work. No further resubmissions will be allowed for this job.
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setShowResubmitConfirm(false)}>
                              Cancel
                            </Button>
                            <Button onClick={() => { setIsSubmittingWork(true); setShowResubmitConfirm(false); }}>
                              Confirm & Resubmit
                            </Button>
                          </div>
                        </motion.div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            )}
          </>
        )}

        {/* Common Actions (Removed Employer Dispute per request) */}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-arc-line text-[10px] font-mono text-arc-ink/40">
        <div className="flex items-center gap-1 italic">
          <Clock className="w-3 h-3" />
          Status: {displayStatus}
        </div>
        <div className="h-4 w-px bg-arc-line" />
        <div>Upfront Paid: {upfrontPaid ? "YES" : "NO"}</div>
      </div>
    </Card>
  );
}

