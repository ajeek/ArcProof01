
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Loader2,
  Paperclip,
  Link,
  CheckCircle2,
  FileArchive,
  Key,
  AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useBalance,
  useSwitchChain,
  usePublicClient
} from 'wagmi';
import { formatUnits, parseUnits, zeroAddress, parseEventLogs } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { 
  JOB_ESCROW_ADDRESS, 
  JOB_ESCROW_ABI, 
  REPUTATION_REGISTRY_ADDRESS, 
  REPUTATION_REGISTRY_ABI,
  DEV_SCORE_NFT_ADDRESS,
  DEV_SCORE_NFT_ABI,
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

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
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

// --- Main Application ---

export default function App() {
  const queryClient = useQueryClient();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const [activeTab, setActiveTab] = useState<'developer' | 'employer'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('arc_active_mode');
      return (saved === 'developer' || saved === 'employer') ? saved : 'developer';
    }
    return 'developer';
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
  const [allJobs, setAllJobs] = useState<bigint[]>([]);

  // Fetch all JobCreated events for discovery
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

  // Contract Reads: Global Stats or Profile
  const { data: nftSnapshot, refetch: refetchNFT } = useReadContract({
    address: DEV_SCORE_NFT_ADDRESS,
    abi: DEV_SCORE_NFT_ABI,
    functionName: 'getSnapshot',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: registryProfile } = useReadContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'getFullProfile',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { writeContractAsync } = useWriteContract();
  const [bindHash, setBindHash] = useState<`0x${string}` | undefined>();
  const { isSuccess: isBindConfirmed } = useWaitForTransactionReceipt({ hash: bindHash });

  const { data: linkedGithub, refetch: refetchGithub } = useReadContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'addressToGithub',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const handleResetGithub = async () => {
    if (!address) return;
    if (!confirm("Are you sure you want to unlink your GitHub account? This will reset your reputation data on-chain.")) return;

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
        alert(data.error || "Failed to reset GitHub link");
      }
    } catch (err) {
      console.error(err);
      alert("Connection failure during reset");
    }
  };

  useEffect(() => {
    if (isBindConfirmed) {
      refetchGithub();
      setShowOnboarding(false);
      setBindHash(undefined);
    }
  }, [isBindConfirmed, refetchGithub]);

  // Identity Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'entry' | 'verifying' | 'preview' | 'binding'>('entry');
  const [githubPreview, setGithubPreview] = useState<any>(null);
  const [isBinding, setIsBinding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [onboardingGithub, setOnboardingGithub] = useState('');
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  useEffect(() => {
    // Only show onboarding if the wallet is connected and we have confirmed
    // that there is NO linked GitHub on-chain (linkedGithub === "").
    // If linkedGithub is undefined, it means the query is still loading.
    if (isConnected && (linkedGithub === "" || linkedGithub === "0x0000000000000000000000000000000000000000")) {
      setShowOnboarding(true);
      if (onboardingStep === 'binding' && !isBinding) {
        // Reset if we somehow got stuck
        setOnboardingStep('entry');
      }
    } else if (linkedGithub !== "" && linkedGithub !== undefined && linkedGithub !== "0x0000000000000000000000000000000000000000") {
      // User is already linked on-chain, definitely hide onboarding
      setShowOnboarding(false);
    } else if (!isConnected) {
      // Not connected, hide onboarding and reset state for next session
      setShowOnboarding(false);
      setOnboardingStep('entry');
      setGithubPreview(null);
      setOnboardingGithub('');
    }
  }, [isConnected, linkedGithub]);

  // Handle auto-flow trigger from creation
  const handleJobCreated = useCallback((id: bigint, params?: any) => {
    setLastCreatedJobId(id);
    setAutoFlowJobId(id);
    if (params) {
      setCreatedJobData((prev: any) => ({ ...prev, ...params, id }));
      setCreationStatus('funding');
    }
    // Refresh job list
    refetchJobCount();
    queryClient.invalidateQueries({ queryKey: [JOB_ESCROW_ADDRESS] });
  }, [refetchJobCount, queryClient]);

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
      // 1. Trigger Direct Binding via Backend Indexer (more reliable than signature)
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

      // 2. Track the transaction returned by the server
      if (data.txHash) {
        console.log("[GitHub Bind] Server initiated transaction:", data.txHash);
        setBindHash(data.txHash);
      } else {
        // Fallback for immediate success
        refetchGithub();
        setShowOnboarding(false);
      }
    } catch (err: any) {
      console.error("[GitHub Bind] Error:", err);
      setOnboardingError(err.message || "Connection failure during binding");
      setOnboardingStep('preview');
    } finally {
      setIsBinding(false);
    }
  };

  // Event Watcher for Job Lifecycle Updates
  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'Refunded',
    onLogs() {
      queryClient.invalidateQueries();
    },
  });

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'JobClosed',
    onLogs() {
      queryClient.invalidateQueries();
    },
  });

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'DisputeOpened',
    onLogs() {
      queryClient.invalidateQueries();
    },
  });

  // Event Watcher for Job Creation (Explicit Polling)
  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'JobCreated',
    pollingInterval: 2000, // 2s polling for fast feedback
    onLogs(logs) {
      refetchJobCount();
      const newJobs = logs.map((log: any) => log.args.jobId);
      setAllJobs(prev => {
        const combined = [...newJobs, ...prev]; // Prepend new jobs
        return Array.from(new Set(combined)); // Remove duplicates
      });

      if (logs.length > 0) {
        const log = logs[logs.length - 1] as any;
        if (log.args.employer === address) {
          const jobId = log.args.jobId;
          setLastCreatedJobId(jobId);
          if (isCreatingJob) {
            setAutoFlowJobId(jobId);
            setIsCreatingJob(false);
          }
        } else if (log.args.developer === address) {
          setLastCreatedJobId(log.args.jobId);
        }
      }
    },
  });

  const stats = useMemo(() => {
    if (!nftSnapshot) return { score: 0, tier: "Rookie", lastUpdated: 0 };
    return {
      score: (nftSnapshot as any)[0] || 0,
      tier: (nftSnapshot as any)[1] || "Rookie",
      lastUpdated: Number((nftSnapshot as any)[2] || 0)
    };
  }, [nftSnapshot]);

  const activeJobs = useMemo(() => {
    // This will be filtered in the JobExplorer component or by passing a list
    // For now we just track that we need to pass this state down.
    return 0; // Placeholder
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="h-16 border-b border-arc-line flex items-center justify-between px-6 sticky top-0 bg-arc-paper/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-arc-ink rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="font-semibold tracking-tighter text-xl italic font-serif">ArcProof</span>
          <span className="text-[10px] bg-arc-ink/5 px-1.5 py-0.5 rounded text-arc-ink/60 uppercase tracking-widest ml-2 font-medium">Testnet</span>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
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
                  {usdcBalance ? Math.floor(Number(formatUnits(usdcBalance as bigint, 6))).toLocaleString() : "0"} USDC
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
        {!isConnected ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-24 h-24 bg-arc-ink/[0.03] rounded-full flex items-center justify-center border border-arc-line">
              <ShieldCheck className="w-12 h-12 opacity-20" />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight">Deterministic Work Settlement Infrastructure</h1>
              <p className="text-arc-ink/50 max-w-2xl mx-auto text-lg text-center">
                Escrow work, verify execution, and settle USDC through programmable onchain state transitions with sub second deterministic finality on Arc
              </p>
            </div>
            <Button onClick={() => connect({ connector: connectors[0] })} className="px-16 py-4 rounded-2xl shadow-2xl shadow-arc-ink/20 text-lg">
              Launch Dashboard
            </Button>
          </div>
        ) : (
          <>
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
                
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-arc-ink/40 font-semibold mb-1">Onchain Tier</div>
                      <div className="text-3xl font-serif italic text-arc-ink/80">{stats.tier}</div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600">
                      <CircleCheck className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified Snapshot</span>
                    </div>
                  </Card>
                  
                  <Card className="flex flex-col justify-between border-arc-ink/10 bg-arc-paper">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-arc-ink/40 font-semibold mb-1">Reputation Score</div>
                      <div className="text-3xl font-mono text-arc-ink/80">
                        {registryProfile ? (registryProfile as any).reputation?.coreIndex || "0" : "0"}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                       <Badge className={cn(
                         "text-[9px]",
                         (registryProfile as any)?.reputation?.riskProfile === 'Low' ? "bg-emerald-100 text-emerald-700" :
                         (registryProfile as any)?.reputation?.riskProfile === 'Medium' ? "bg-amber-100 text-amber-700" :
                         "bg-red-100 text-red-700"
                       )}>
                         {(registryProfile as any)?.reputation?.riskProfile || 'Unknown'} Risk
                       </Badge>
                       <span className="text-[10px] font-medium text-arc-ink/40">Escrow Profile</span>
                    </div>
                  </Card>

                  <Card className="flex flex-col justify-between border-arc-ink/20 bg-arc-ink text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <ShieldCheck className="w-16 h-16" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mb-1">NFT DevScore</div>
                      <div className="text-4xl font-mono">{stats.score}</div>
                    </div>
                    <div className="mt-4 flex items-center justify-between z-10">
                      <span className="text-[10px] text-white/40 font-mono">ID: ...{DEV_SCORE_NFT_ADDRESS.slice(-4)}</span>
                      <RefreshNFTButton onRefresh={refetchNFT} />
                    </div>
                  </Card>
                </div>

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
                      <DeveloperProfile address={address!} allJobs={allJobs} onSelect={setSelectedJobId} />
                      <JobExplorer address={address!} role="developer" allJobs={allJobs} onSelect={setSelectedJobId} />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="emp-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
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
                              />
                            )}
                            <EmployerPanel 
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
                          >
                             <JobExplorer address={address!} role="employer" allJobs={allJobs} onSelect={setSelectedJobId} />
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
          </>
        )}
      </main>

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

      <footer className="mt-auto border-t border-arc-line p-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-serif italic font-medium">ArcProof OS</span>
           </div>
           <div className="text-[10px] font-mono tracking-tighter uppercase font-bold">
              Execution-verified Reputation Protocol
           </div>
           <div className="text-[11px] font-mono tracking-tighter">
              {JOB_ESCROW_ADDRESS}
           </div>
        </div>
      </footer>
    </div>
  );
}

// --- Specific Components ---

function RefreshNFTButton({ onRefresh }: { onRefresh?: () => void }) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && onRefresh) {
      onRefresh();
    }
  }, [isSuccess, onRefresh]);

  const handleRefresh = () => {
    writeContract({
      address: DEV_SCORE_NFT_ADDRESS,
      abi: DEV_SCORE_NFT_ABI,
      functionName: 'refreshNFT',
    } as any);
  };

  return (
    <button 
      onClick={handleRefresh} 
      disabled={isPending || isConfirming}
      className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
    >
      {(isPending || isConfirming) ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCcw className="w-4 h-4" />
      )}
    </button>
  );
}

function SequentialFundingFlow({ jobId, onComplete, compact }: { jobId: bigint, onComplete: (hash?: string) => void, compact?: boolean }) {
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
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

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
        setErrorMessage(`Insufficient USDC balance. Found ${formatUnits(balance as bigint, 6)}, need ${formatUnits(amount as bigint, 6)}.`);
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
      console.log(`[Escrow Flow] TRIGGER: approve(${formatUnits(amount, 6)})`);
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
                     {formatUnits(balance as bigint, 6)} / {formatUnits((job as any)[2], 6)} USDC
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
              </div>
            )}
         </div>
       </div>
    </div>

  );
}

function EmployerPanel({ onJobCreated, onCreating, onCreationStart, onCreationError }: { onJobCreated: (id: bigint, params?: any) => void, onCreating: (state: boolean) => void, onCreationStart: (params: any) => void, onCreationError: (error: string) => void }) {
  const [devAddress, setDevAddress] = useState<string>(zeroAddress);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [duration, setDuration] = useState('14');
  const [amount, setAmount] = useState('');
  const [upfront, setUpfront] = useState(0);
  
  const { data: devProfileData } = useReadContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'getFullProfile',
    args: devAddress && devAddress.startsWith('0x') && devAddress.length === 42 && devAddress !== zeroAddress ? [devAddress as `0x${string}`] : undefined,
    query: { enabled: devAddress.startsWith('0x') && devAddress.length === 42 && devAddress !== zeroAddress }
  });

  const devScore = devProfileData ? (devProfileData as any).reputation?.coreIndex || 0 : 0;
  const maxUpfront = devScore > 80 ? 50 : devScore >= 50 ? 25 : 0;

  // Reactively adjust upfront if it exceeds allowed max
  useEffect(() => {
    if (upfront > maxUpfront) setUpfront(0);
  }, [maxUpfront, upfront]);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

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

  // Extract jobId from receipt for immediate flow
  useEffect(() => {
    if (isConfirmed && receipt) {
      onCreating(false);
      try {
        const logs = parseEventLogs({
          abi: JOB_ESCROW_ABI,
          eventName: 'JobCreated',
          logs: receipt.logs
        });
        if (logs.length > 0) {
          const jobId = (logs[0] as any).args.jobId;
          console.log("[EmployerPanel] Job created from receipt:", jobId);
          onJobCreated(jobId, { title, description, requirements, duration, amount, upfront });
          
          // Clear previous parameters for next escrow
          setTitle('');
          setDescription('');
          setRequirements('');
          setAmount('');
          setUpfront(0);
          setDevAddress(zeroAddress);
        }
      } catch (e) {
        console.error("Failed to parse logs from receipt", e);
      }
    }
  }, [isConfirmed, receipt, onJobCreated, onCreating, title, description, requirements, duration, amount, upfront]);

  const handleCreate = () => {
    if (!devAddress || !amount || !title || !description) return;
    
    const metadata = JSON.stringify({
      title,
      description,
      requirements,
      duration: Number(duration)
    });

    onCreationStart({ title, description, requirements, duration, amount, upfront });

    writeContract({
      address: JOB_ESCROW_ADDRESS,
      abi: JOB_ESCROW_ABI,
      functionName: 'createJob',
      args: [devAddress as `0x${string}`, parseUnits(amount, 6), BigInt(upfront), metadata],
    } as any);
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
            placeholder="e.gae UI Redesign for DeFi App" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-arc-paper border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Job Description</label>
          <textarea 
            placeholder="Detailed scope of work..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Duration (Days)</label>
            <input 
              type="number" 
              placeholder="14" 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-arc-paper border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all font-mono text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Total Budget (USDC)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-arc-paper border border-arc-line focus:outline-none focus:ring-1 focus:ring-arc-ink/20 transition-all font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-arc-ink/40 px-1">Upfront Percentage</label>
            <div className="flex gap-2">
              {[0, 25, 50].map(v => (
                <button 
                  key={v}
                  disabled={v > maxUpfront}
                  onClick={() => setUpfront(v)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                    upfront === v ? "bg-arc-ink text-white border-arc-ink" : "bg-white text-arc-ink/40 border-arc-line hover:border-arc-ink/20 disabled:opacity-20 disabled:cursor-not-allowed"
                  )}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleCreate} 
        loading={isPending || isConfirming}
        disabled={!amount || !title}
        className="w-full py-3 shadow-xl shadow-arc-ink/10"
      >
        Create a USDC Job Escrow
      </Button>
    </Card>
  );
}

function DeveloperProfile({ address, allJobs, onSelect }: { address: `0x${string}`, allJobs: bigint[], onSelect: (id: bigint) => void }) {
  const hasJobs = allJobs.length > 0;

  const { data: registryProfile } = useReadContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'getFullProfile',
    args: [address],
    query: { enabled: !!address }
  });

  const reputation = (registryProfile as any)?.reputation;
  const profile = (registryProfile as any)?.profile;

  return (
    <div className="space-y-10">
      {/* Detailed Signals Section */}
      {reputation && (
         <div className="space-y-6">
           <div className="flex items-center justify-between border-b border-arc-line pb-4">
             <div className="flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-arc-ink" />
               <h2 className="text-xl font-medium tracking-tight">Reputation Matrix</h2>
             </div>
             <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active Indexing</Badge>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <SignalBar 
               label="Reliability" 
               score={reputation.reliabilityScore} 
               colorClass="bg-blue-500" 
             />
             <SignalBar 
               label="Dispute Integrity" 
               score={reputation.disputeIntegrityScore} 
               colorClass="bg-purple-500" 
             />
             <SignalBar 
               label="Earned Value" 
               score={reputation.earnedValueScore} 
               colorClass="bg-emerald-500" 
             />
             <SignalBar 
               label="Activity Recency" 
               score={reputation.activityScore} 
               colorClass="bg-amber-500" 
             />
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
             <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
                <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Completed</div>
                <div className="text-xl font-mono">{profile?.completedJobs.toString() || "0"}</div>
             </div>
             <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
                <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Failed</div>
                <div className="text-xl font-mono">{profile?.failedJobs.toString() || "0"}</div>
             </div>
             <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
                <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Total Earned</div>
                <div className="text-xl font-mono">${profile ? Math.floor(Number(formatUnits(profile.totalEarnedUSDC, 6))).toLocaleString() : "0"}</div>
             </div>
             <div className="glass p-4 rounded-2xl border border-arc-line flex flex-col items-center justify-center text-center">
                <div className="text-[10px] uppercase font-bold text-arc-ink/30 mb-1">Disputes Won</div>
                <div className="text-xl font-mono text-emerald-600">+{profile?.disputesWon.toString() || "0"}</div>
             </div>
           </div>
         </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium tracking-tight">Your Work History</h2>
          <Badge className="bg-arc-ink text-white">Live Lifecycle</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-arc-ink/40" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-arc-ink/40">My Active Jobs</span>
            </div>
            <div className="space-y-4">
              {hasJobs ? allJobs.map(id => (
                <JobFilterWrapper key={id.toString()} jobId={id} viewerAddress={address} mode="active" onSelect={onSelect} />
              )) : (
                <div className="text-xs text-arc-ink/30 italic p-4 border border-dashed border-arc-line rounded-2xl">No active jobs found.</div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <CircleCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-arc-ink/40">My Completed Jobs</span>
            </div>
            <div className="space-y-4">
              {hasJobs ? allJobs.map(id => (
                <JobFilterWrapper key={id.toString()} jobId={id} viewerAddress={address} mode="completed" onSelect={onSelect} />
              )) : (
                <div className="text-xs text-arc-ink/30 italic p-4 border border-dashed border-arc-line rounded-2xl">No completed jobs found.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <X className="w-4 h-4 text-red-500" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-arc-ink/40">Rejected Jobs</span>
            </div>
            <div className="space-y-4">
              {hasJobs ? allJobs.map(id => (
                <JobFilterWrapper key={id.toString()} jobId={id} viewerAddress={address} mode="rejected" onSelect={onSelect} />
              )) : (
                <div className="text-xs text-arc-ink/30 italic p-4 border border-dashed border-arc-line rounded-2xl">No rejected jobs found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobFilterWrapper({ jobId, viewerAddress, mode, onSelect }: { key?: string, jobId: bigint, viewerAddress: `0x${string}`, mode: 'active' | 'completed' | 'rejected', onSelect: (id: bigint) => void }) {
  const { data: job } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'jobs',
    args: [jobId],
  });

  if (!job || job[0] === zeroAddress) return null;
  const [employer, developer, amount, upfrontAmount, metadataURL, status, upfrontPaid, upfrontPercent] = job as any;
  
  const isMine = developer === viewerAddress;
  const s = Number(status);
  const isActive = s === 2 || s === 3 || s === 5; // Assigned, WorkSubmitted, Disputed
  const isCompleted = s === 4;
  const isRejected = s === 7;

  if (mode === 'active' && (!isMine || !isActive)) return null;
  if (mode === 'completed' && (!isMine || !isCompleted)) return null;
  if (mode === 'rejected' && (!isMine || !isRejected)) return null;

  return <JobCard jobId={jobId} viewerAddress={viewerAddress} compact onSelect={onSelect} role="developer" />;
}

function JobExplorer({ address, role, allJobs, onSelect }: { address: `0x${string}`, role: 'developer' | 'employer', allJobs: bigint[], onSelect: (id: bigint) => void }) {
  if (role === 'employer') {
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium tracking-tight">Escrow Board</h2>
            <Badge className="bg-arc-ink/5 text-arc-ink/40">Employer Admin</Badge>
          </div>
        </div>

        <div className="space-y-12">
          <EmployerJobSection 
            title="Active Job" 
            allJobs={allJobs} 
            address={address} 
            statuses={[0, 1, 2, 3, 7]} 
            onSelect={onSelect} 
          />
          <EmployerJobSection 
            title="Cancelled Job" 
            allJobs={allJobs} 
            address={address} 
            statuses={[6]} 
            onSelect={onSelect} 
          />
          <EmployerJobSection 
            title="Completed Job" 
            allJobs={allJobs} 
            address={address} 
            statuses={[4]} 
            onSelect={onSelect} 
          />
          <EmployerJobSection 
            title="In Dispute" 
            allJobs={allJobs} 
            address={address} 
            statuses={[5]} 
            onSelect={onSelect} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-medium tracking-tight">Available Opportunities</h2>
          <Badge className="bg-arc-ink/5 text-arc-ink/40">Public Discovery</Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allJobs.map(id => (
            <JobDiscoveryFilter key={id.toString()} jobId={id} viewerAddress={address} role="developer" onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployerJobSection({ title, allJobs, address, statuses, onSelect }: { title: string, allJobs: bigint[], address: `0x${string}`, statuses: number[], onSelect: (id: bigint) => void }) {
  // We need to count matching jobs to show/hide empty sections or just show empty state
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-arc-ink/40 uppercase tracking-[0.2em] flex items-center gap-3">
        <div className="h-[1px] flex-1 bg-arc-line" />
        {title}
        <div className="h-[1px] flex-1 bg-arc-line" />
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allJobs.map(id => (
          <JobStatusFilter key={id.toString()} jobId={id} viewerAddress={address} targetStatuses={statuses} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function JobStatusFilter({ jobId, viewerAddress, targetStatuses, onSelect }: { key?: string, jobId: bigint, viewerAddress: `0x${string}`, targetStatuses: number[], onSelect: (id: bigint) => void }) {
  const { data: job } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'jobs',
    args: [jobId],
  });

  if (!job || job[0] === zeroAddress) return null;
  const [employer, , , , , status] = job as any;

  if (employer !== viewerAddress) return null;
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

function JobDiscoveryFilter({ jobId, viewerAddress, role, onSelect }: { key?: string, jobId: bigint, viewerAddress: `0x${string}`, role: 'developer' | 'employer', onSelect: (id: bigint) => void }) {
  const { data: job } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'jobs',
    args: [jobId],
  });

  if (!job || job[0] === zeroAddress) return null;
  const [employer, , , , , status] = job as any;

  // Requirement: Only show jobs in 'Funded' status (1) for developers in public explorer, and exclude self-posted jobs
  if (role === 'developer' && (status !== 1 || employer === viewerAddress)) return null;
  if (role === 'employer' && employer !== viewerAddress) return null;
  
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

function CountdownTimer({ jobId, durationDays }: { jobId: bigint, durationDays: number }) {
  const publicClient = usePublicClient();
  const [assignedAt, setAssignedAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    async function getAssignmentTime() {
      if (!publicClient) return;
      try {
        const toBlock = await publicClient.getBlockNumber();
        const fromBlock = toBlock > BigInt(5000) ? toBlock - BigInt(5000) : BigInt(0);
        
        const logs = await publicClient.getLogs({
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
          const block = await publicClient.getBlock({ blockHash: logs[0].blockHash! });
          setAssignedAt(Number(block.timestamp));
        }
      } catch (e) {
        console.error("Error fetching logs for JobAssigned", e);
      }
    }
    getAssignmentTime();
  }, [jobId, publicClient]);

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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-arc-ink/5 border border-arc-line">
      <Clock className="w-3.5 h-3.5 text-arc-ink/40" />
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-mono font-bold">{timeLeft.d}d</span>
        <span className="text-xs font-mono font-bold">{timeLeft.h}h</span>
        <span className="text-xs font-mono font-bold">{timeLeft.m}m</span>
        <span className="text-[10px] font-mono opacity-40">{timeLeft.s}s</span>
      </div>
      <span className="text-[10px] uppercase font-bold text-arc-ink/40 tracking-wider ml-1">Left</span>
    </div>
  );
}

function JobCard({ jobId, viewerAddress, compact, onSelect, role }: { jobId: bigint, viewerAddress: `0x${string}`, compact?: boolean, onSelect?: (id: bigint) => void, role?: 'developer' | 'employer' }) {
  const { data: job, refetch } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'jobs',
    args: [jobId],
  });

  const { data: activeJobsCount } = useReadContract({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    functionName: 'activeJobsCount',
    args: [viewerAddress],
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
    hash
  });

  useEffect(() => {
    if (writeError) {
      console.error("[Escrow Debug] Write Error:", writeError);
      const msg = writeError.message.toLowerCase();
      if (msg.includes("user rejected")) return;
      alert(`Transaction failed: ${writeError.message.slice(0, 100)}${writeError.message.length > 100 ? '...' : ''}`);
    }
  }, [writeError]);

  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess, refetch]);

  if (!job || job[0] === zeroAddress) return compact ? null : <Card>Job not found</Card>;

  const [employer, developer, amount, upfrontAmount, metadataURL, status, upfrontPaid, upfrontPercent] = job as any;
  const statusLabels = ["Created", "Funded", "Assigned", "WorkSubmitted", "Completed", "Disputed", "Cancelled", "Rejected"];
  
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
    console.log(`[Escrow Debug] Requesting USDC approval for ${formatUnits(amount as bigint, 6)} tokens to ${JOB_ESCROW_ADDRESS}`);
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
      alert("As the employer, you cannot accept your own job. Please connect a different wallet to act as a developer.");
      return;
    }
    if (activeJobsCount && (activeJobsCount as bigint) >= BigInt(100)) {
      alert("Job limit reached (100 active jobs max)");
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
      alert("Please provide a description of the work performed.");
      return;
    }
    
    if (Number(status) === 7) {
      setIsSubmittingWork(true);
      setShowResubmitConfirm(false);
    }
    
    // Security: Only send metadata to chain, binary remains in local vault for handover
    const { fileData, ...metadata } = submissionData;
    const submissionBody = JSON.stringify({
      ...metadata,
      submittedAt: Date.now()
    });

    console.log(`[Escrow Debug] Submitting work for Job #${jobId.toString()} with status ${status}`);
    
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
    console.log(`[Escrow Debug] Rejecting Job #${jobId.toString()} with reason: ${rejectionReason}`);
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
    console.log(`[Escrow Debug] Attempting to fund Job #${jobId.toString()}`);
    console.log(`[Escrow Debug] Employer: ${viewerAddress}`);
    console.log(`[Escrow Debug] Current Allowance: ${allowance ? formatUnits(allowance as bigint, 6) : "Unknown"} USDC`);
    console.log(`[Escrow Debug] Required Amount: ${formatUnits(amount as bigint, 6)} USDC`);
    
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
    // Only call if status is still rejected
    if (Number(status) === 7) {
      writeContract({
        address: JOB_ESCROW_ADDRESS,
        abi: JOB_ESCROW_ABI,
        functionName: 'syncState',
        args: [BigInt(jobId.toString())],
      } as any);
    }
  };

  const handleExpireDispute = () => {
    if (Number(status) === 5) {
      writeContract({
        address: JOB_ESCROW_ADDRESS,
        abi: JOB_ESCROW_ABI,
        functionName: 'syncState',
        args: [BigInt(jobId.toString())],
      } as any);
    }
  };

  const isEmployer = employer === viewerAddress;
  const isDeveloper = developer === viewerAddress;

  // Track submission info from events
  const [submissionInfo, setSubmissionInfo] = useState<any>(null);
  const [accessRequested, setAccessRequested] = useState(false);
  const [keysSubmitted, setKeysSubmitted] = useState<any>(null);
  const publicClient = usePublicClient();
  
  // Also fetch historical events for this job
  useEffect(() => {
    async function getPastEvents() {
      if (!publicClient || !jobId) return;
      try {
        const toBlock = await publicClient.getBlockNumber();
        const fromBlock = toBlock > BigInt(10000) ? toBlock - BigInt(10000) : BigInt(0);
        
        // 1. Fetch WorkSubmitted
        const submissionLogs = await publicClient.getLogs({
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
          fromBlock,
          toBlock
        });

        if (submissionLogs.length > 0) {
          const log = submissionLogs[submissionLogs.length - 1] as any;
          const rawHash = log.args.proofHash;
          if (rawHash && rawHash.trim().startsWith('{')) {
            try {
              setSubmissionInfo(JSON.parse(rawHash));
            } catch (e) {
              console.error("Failed to parse historical submission", e);
            }
          }
        }

        // 2. Fetch WorkRejected
        const rejectionLogs = await publicClient.getLogs({
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
          fromBlock,
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
  }, [jobId, status, publicClient]);

  // Handle Access Requests & Key Submissions (Simulation via LocalStorage)
  useEffect(() => {
    const handleStorage = () => {
      const accessKey = `arc_access_req_${jobId.toString()}`;
      const keysKey = `arc_keys_sub_${jobId.toString()}`;
      setAccessRequested(localStorage.getItem(accessKey) === 'true');
      const savedKeys = localStorage.getItem(keysKey);
      if (savedKeys) setKeysSubmitted(JSON.parse(savedKeys));
    };

    handleStorage();
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 2000); // Polling as fallback for same-window storage events

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [jobId]);

  const handleDemandAccess = () => {
    const accessKey = `arc_access_req_${jobId.toString()}`;
    localStorage.setItem(accessKey, 'true');
    setAccessRequested(true);
    // Custom trigger for same window
    window.dispatchEvent(new Event('storage'));
  };

  const [keySubmission, setKeySubmission] = useState({ backendKeys: '', repoAccess: '' });
  
  const downloadFile = (fileName: string) => {
    // Attempt to retrieve original file data from local vault (simulation of secure handover)
    const storedData = localStorage.getItem(`arc_asset_${jobId.toString()}`);
    
    if (storedData && (storedData.startsWith('data:') || storedData.length > 100)) {
      const link = document.createElement('a');
      link.href = storedData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`[Escrow] Downloaded ${fileName} from local vault.`);
      return;
    }

    // Detailed error file if original is missing
    const content = `ARC SECURE PROTOCOL - DECRYPTION ERROR\n\nJob ID: ${jobId}\nFile Name: ${fileName}\n\nREASON: Original binary fragments not found in local handover vault. This can happen if the browser cache was cleared or the session is different.\n\nWORK DESCRIPTION:\n${submissionInfo?.description || 'N/A'}`;
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
    const keysKey = `arc_keys_sub_${jobId.toString()}`;
    const payload = { ...keySubmission, submittedAt: Date.now() };
    localStorage.setItem(keysKey, JSON.stringify(payload));
    setKeysSubmitted(payload);
    window.dispatchEvent(new Event('storage'));
  };

  const [rejectionReasonText, setRejectionReasonText] = useState<string | null>(null);

  useWatchContractEvent({
    address: JOB_ESCROW_ADDRESS,
    abi: JOB_ESCROW_ABI,
    eventName: 'WorkRejected',
    onLogs(logs) {
      const relevantLog = logs.find((log: any) => BigInt(log.args.jobId) === BigInt(jobId));
      if (relevantLog) {
        setRejectionReasonText((relevantLog.args as any).reason);
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
      }
    },
  });

  if (compact) {
    return (
      <Card 
        onClick={() => onSelect?.(jobId)}
        className="p-4 space-y-3 cursor-pointer hover:border-arc-ink/40 transition-all group"
      >
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Badge className="bg-arc-ink/5 text-arc-ink/40">#{jobId.toString()}</Badge>
             {Number(status) === 7 ? (
               <RejectionTimer jobId={jobId} onExpire={handleExpireRejection} />
             ) : Number(status) === 5 ? (
               <DisputeTimer jobId={jobId} onExpire={handleExpireDispute} />
             ) : (Number(status) === 2 || Number(status) === 3) && (
               <CountdownTimer jobId={jobId} durationDays={parsedMetadata.duration} />
             )}
             {isEmployer && role !== 'developer' && (Number(status) === 0 || Number(status) === 1) && (
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); handleCancel(); }} 
                className="text-[10px] text-red-500 hover:text-red-700 h-5 px-1.5 flex items-center gap-1 active:scale-95"
               >
                 <X className="w-3 h-3" />
                 Cancel
               </Button>
             )}
           </div>
           <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{statusLabels[status]}</Badge>
        </div>
        <div className="font-semibold text-sm truncate group-hover:text-arc-ink transition-colors">{parsedMetadata.title}</div>
        {Number(status) === 7 && rejectionReasonText && (
          <div className="bg-red-50 p-2 rounded-lg border border-red-100 flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-red-900 line-clamp-1 italic font-medium">"{rejectionReasonText}"</p>
          </div>
        )}
        <div className="flex justify-between items-end">
           <div className="text-[10px] text-arc-ink/40 font-mono">By {employer.slice(0, 6)}...</div>
           <div className="text-sm font-mono font-bold text-arc-ink/80">{Math.floor(Number(formatUnits(amount, 6))).toLocaleString()} USDC</div>
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
            <div className="flex items-center gap-2 mb-2">
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
            <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {statusLabels[status as number]}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-arc-ink">{Math.floor(Number(formatUnits(amount as bigint, 6))).toLocaleString()} USDC</div>
          <div className="text-[10px] text-arc-ink/40 uppercase font-black">{upfrontPercent.toString()}% Upfront Settlement</div>
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
            <div className="text-xs font-mono">{employer as string}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-arc-ink/40 uppercase tracking-widest">Developer</div>
            <div className="text-xs font-mono">{developer === zeroAddress ? "NOT ASSIGNED" : (developer as string)}</div>
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
          Status: {statusLabels[status]}
        </div>
        <div className="h-4 w-px bg-arc-line" />
        <div>Upfront Paid: {upfrontPaid ? "YES" : "NO"}</div>
      </div>
    </Card>
  );
}

