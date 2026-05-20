import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Github, Zap, Trophy, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, cn } from '../App';

export function Home() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div 
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center"
    >
      <div className={cn("flex flex-col items-center justify-center text-center space-y-8 py-12 md:py-20", showHowItWorks ? "min-h-screen" : "h-[70vh]")}>
        <div className="flex flex-col items-center w-full">
          <img
            src="/arcproof-logo.png"
            alt="ArcProof Logo"
            className="h-16 w-16 mb-4 object-contain"
          />
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Deterministic Work Settlement Infrastructure</h1>
            <p className="text-arc-ink/50 max-w-2xl mx-auto text-lg text-center">
              Escrow work, verify execution, and settle USDC through programmable onchain state transitions with sub second deterministic finality on Arc
            </p>
            <p className="text-arc-ink/50 max-w-2xl mx-auto text-lg text-center">
              Each settlement produces structured behavioral signals that form the foundation for trust and credit systems
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full md:w-auto max-w-sm md:max-w-none mx-auto">
          <Button onClick={() => navigate('/dashboard')} className="w-full md:w-auto px-8 md:px-16 py-4 rounded-2xl shadow-2xl shadow-arc-ink/20 text-base md:text-lg">
            Launch Dashboard
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full md:w-auto px-8 md:px-12 py-4 rounded-2xl border-arc-line bg-transparent text-arc-ink/60 hover:bg-arc-ink/5 hover:text-arc-ink text-base md:text-lg"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* STEP 01 */}
              <div className="glass p-6 md:p-8 rounded-[2rem] border border-arc-line space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                     <Github className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-bold text-arc-ink/20 uppercase tracking-[0.2em]">Step 01</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg md:text-xl font-semibold tracking-tight">Connect Identity</h3>
                  <p className="text-xs md:text-sm text-arc-ink/60 leading-relaxed">
                    Connect GitHub once during onboarding for identity
                  </p>
                  <div className="p-3 rounded-xl bg-arc-ink/5 border border-arc-line text-[10px] md:text-[11px] text-arc-ink/50 italic">
                    ArcProof does NOT use GitHub activity for reputation scoring. Repos, commits, and history never affect protocol reputation
                  </div>
                </div>
              </div>

              {/* STEP 02 */}
              <div className="glass p-6 md:p-8 rounded-[2rem] border border-arc-line space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                     <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-bold text-arc-ink/20 uppercase tracking-[0.2em]">Step 02</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg md:text-xl font-semibold tracking-tight">Fund Escrow</h3>
                  <p className="text-xs md:text-sm text-arc-ink/60 leading-relaxed">
                    Employers create jobs and lock USDC into onchain escrow before execution begins
                  </p>
                  <div className="p-3 rounded-xl bg-arc-ink/5 border border-arc-line text-[10px] md:text-[11px] text-arc-ink/50 italic">
                    Every funded job becomes an immutable lifecycle record tied to protocol settlement events
                  </div>
                </div>
              </div>

              {/* STEP 03 */}
              <div className="glass p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-arc-line space-y-8 text-center md:col-span-2 flex flex-col items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />
                <div className="flex flex-col items-center gap-2 md:gap-4 relative z-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-3xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-sm shadow-purple-500/5">
                     <Zap className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                  </div>
                  <span className="text-[10px] font-bold text-arc-ink/20 uppercase tracking-[0.4em]">Step 03</span>
                </div>
                <div className="space-y-6 max-w-2xl relative z-10 mx-auto">
                  <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-arc-ink">Execute & Settle</h3>
                  <div className="space-y-3">
                    <p className="text-sm md:text-base text-arc-ink/60 leading-relaxed">
                      Jobs move through a deterministic lifecycle:
                    </p>
                    <div className="inline-block px-3 md:px-4 py-2 bg-arc-ink/5 rounded-xl border border-arc-line/50">
                      <code className="text-[10px] sm:text-sm font-mono tracking-tighter text-arc-ink/80 block w-full whitespace-normal">
                        REQUESTED &rarr; ACCEPTED &rarr; COMPLETED &rarr; DISPUTED &rarr; RESOLVED
                      </code>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm lg:text-base text-arc-ink/70 max-w-xl mx-auto px-4 md:px-0">
                    Settlement outcomes are finalized directly from blockchain events with no manual intervention and no protocol bias.
                  </p>
                  <div className="text-left bg-white/50 backdrop-blur-sm p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-arc-line shadow-sm space-y-4 mt-6 md:mt-8">
                    <p className="font-medium text-arc-ink text-sm md:text-base">Each lifecycle outcome produces structured signals:</p>
                    <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-arc-ink/60 marker:text-arc-ink/30">
                      <li>verified execution history under escrow conditions</li>
                      <li>settlement reliability across counterparties</li>
                      <li>dispute behavior and resolution outcomes</li>
                      <li>interaction graph of economic trust between participants</li>
                    </ul>
                    <div className="pt-4 border-t border-arc-line">
                      <p className="text-xs md:text-sm font-medium italic text-arc-ink/40">These signals are recorded as part of protocol state and persist across work relationships.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 04 */}
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-arc-line space-y-6 md:space-y-8 text-left relative overflow-hidden group col-span-1 md:col-span-2">
                <div className="absolute -right-24 -bottom-24 w-40 h-40 md:w-64 md:h-64 bg-emerald-500/5 rounded-full blur-[80px] md:blur-[100px] group-hover:bg-emerald-500/10 transition-all duration-700" />
                <div className="absolute -left-24 -top-24 w-40 h-40 md:w-64 md:h-64 bg-amber-500/5 rounded-full blur-[80px] md:blur-[100px] group-hover:bg-amber-500/10 transition-all duration-700" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-[1rem] md:rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                     <Trophy className="w-5 h-5 md:w-7 md:h-7 text-emerald-500" />
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
  );
}
