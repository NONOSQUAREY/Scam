import React from 'react';
import { Caller } from '../types/game';
import { User, Lock, Brain, ShieldAlert, Sparkles, Target, Zap, Activity } from 'lucide-react';

interface AssessmentAppProps {
  caller: Caller | null;
}

export const AssessmentApp: React.FC<AssessmentAppProps> = ({ caller }) => {
  if (!caller) {
    return (
      <div className="flex-1 bg-neutral-950 p-6 flex flex-col items-center justify-center text-center font-mono text-xs select-none h-full text-neutral-500">
        <Target className="w-10 h-10 text-neutral-700 mb-2 animate-pulse" />
        <div className="font-bold text-neutral-400">NO ACTIVE TARGET CONNECTED</div>
        <div className="text-[11px] text-neutral-600 mt-1">Dial or answer an incoming call to initialize psychological telemetry.</div>
      </div>
    );
  }

  const isSmart = caller.personality?.match(/Tech|Sharp|Analytical|Smart|Intellectual/);
  const isSweet = caller.personality?.match(/Sweet|Gullible|Friendly|Breezy|Warm/);
  const isCautious = caller.personality?.match(/Cautious|Suspicious|Paranoid|Skeptical/);

  return (
    <div className="flex-1 bg-neutral-950 p-4 overflow-y-auto space-y-3 font-mono text-xs select-none h-full border border-neutral-900">
      {/* Target Identity & Psychological Header */}
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3 shadow-md">
        <div className={`w-12 h-12 rounded-xl ${caller.nameRevealed ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400'} border-2 flex items-center justify-center text-xl font-bold shrink-0`}>
          {caller.nameRevealed ? <User className="w-6 h-6" /> : <Lock className="w-6 h-6 text-amber-400 animate-pulse" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-neutral-100 truncate">
              {caller.nameRevealed ? (
                <span className="text-emerald-300 flex items-center gap-1">
                  <span>✓ {caller.name}</span>
                </span>
              ) : (
                <span className="text-amber-400 tracking-wider flex items-center gap-1.5">
                  <span>🔒 [NAME HIDDEN — ASK IN CALL]</span>
                </span>
              )}
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
              caller.nameRevealed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              {caller.nameRevealed ? 'VERIFIED LEAD' : 'UNVERIFIED'}
            </span>
          </div>

          <div className="text-[11px] text-indigo-400 mt-0.5 flex items-center gap-1.5">
            <span>{caller.archetype}</span>
            <span className="text-neutral-600">•</span>
            <span>Age {caller.age}</span>
            <span className="text-neutral-600">•</span>
            <span className="uppercase text-[10px] text-neutral-400">{caller.gender} Voice</span>
          </div>
        </div>
      </div>

      {/* Psychological Assessment Card */}
      <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-neutral-400 text-[11px]">
          <span className="flex items-center gap-1.5 font-bold text-neutral-200">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>PSYCHOLOGICAL ASSESSMENT</span>
          </span>
          <span className="px-2 py-0.5 bg-neutral-950 rounded text-amber-300 border border-neutral-800 text-[10px]">
            {caller.personality}
          </span>
        </div>

        {caller.personalityDescription && (
          <div className="p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-lg text-[11px] italic text-neutral-300 leading-relaxed">
            "{caller.personalityDescription}"
          </div>
        )}

        {/* Live Gauges */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800">
            <div className="flex justify-between items-center text-[10px] mb-1">
              <span className="text-neutral-500">CURRENT SUSPICION:</span>
              <span className={`font-bold ${caller.suspicion >= 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                {caller.suspicion}%
              </span>
            </div>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${caller.suspicion >= 60 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${caller.suspicion}%` }}
              />
            </div>
          </div>

          <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800">
            <div className="flex justify-between items-center text-[10px] mb-1">
              <span className="text-neutral-500">GULLIBILITY:</span>
              <span className="font-bold text-cyan-400">{caller.gullibility}%</span>
            </div>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${caller.gullibility}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Persuasion & Vulnerability Tactics */}
      <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-2">
        <div className="text-[11px] font-bold text-neutral-200 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>TACTICAL DIALOGUE STRATEGY</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          {isSmart ? (
            <div className="p-2 bg-indigo-950/40 border border-indigo-900/60 rounded-lg text-indigo-300">
              <span className="font-bold text-indigo-200 block mb-0.5">🧠 High Intellect Target:</span>
              Target will resist generic pressure. Use technical jargon (SSL cache token mismatch, ACH clearinghouse batch, merchant escrow) to disarm suspicion!
            </div>
          ) : isSweet ? (
            <div className="p-2 bg-emerald-950/40 border border-emerald-900/60 rounded-lg text-emerald-300">
              <span className="font-bold text-emerald-200 block mb-0.5">🕊️ Highly Trusting Senior:</span>
              Be warm, respectful, and reassuring. Mention FDIC insurance or standard bank cancellation protocol.
            </div>
          ) : isCautious ? (
            <div className="p-2 bg-amber-950/40 border border-amber-900/60 rounded-lg text-amber-300">
              <span className="font-bold text-amber-200 block mb-0.5">⚠️ Guarded Skeptic:</span>
              Do not push for CVV immediately! Ask for name verification first, establish rapport, then soothe.
            </div>
          ) : (
            <div className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300">
              <span className="font-bold text-neutral-200 block mb-0.5">Standard Caller:</span>
              Follow standard phone protocol: verify name, diagnose alert, request card authentication.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
