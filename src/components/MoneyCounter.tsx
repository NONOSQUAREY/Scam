import React, { useEffect, useState } from 'react';
import { DollarSign, Flame, Award, TrendingUp } from 'lucide-react';

interface MoneyCounterProps {
  money: number;
  streak: number;
  totalScammed: number;
  shiftDay: number;
  lastGained: number;
}

export const MoneyCounter: React.FC<MoneyCounterProps> = ({
  money,
  streak,
  shiftDay,
  lastGained,
}) => {
  const [displayMoney, setDisplayMoney] = useState(money);
  const [showFloater, setShowFloater] = useState(false);

  // Smooth rolling number animation
  useEffect(() => {
    if (displayMoney === money) return;
    const diff = money - displayMoney;
    const step = Math.ceil(diff / 8);
    const timer = setTimeout(() => {
      setDisplayMoney((prev) => Math.min(money, prev + step));
    }, 30);
    return () => clearTimeout(timer);
  }, [money, displayMoney]);

  useEffect(() => {
    if (lastGained > 0) {
      setShowFloater(true);
      const timer = setTimeout(() => setShowFloater(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastGained]);

  const multiplier = Math.min(3.5, 1.0 + (streak * 0.25)).toFixed(2);
  const quota = 10000 * shiftDay;
  const progressPercent = Math.min(100, Math.round((money / quota) * 100));

  return (
    <div className="relative bg-neutral-900 border-2 border-emerald-500/40 rounded-xl p-3 md:p-4 shadow-xl box-glow-green overflow-hidden">
      {/* Background digital grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966910_1px,transparent_1px),linear-gradient(to_bottom,#05966910_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        {/* Main Ticker */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400/80 uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Hotline Funds Extracted</span>
            <span className="px-1.5 py-0.5 bg-emerald-950/80 border border-emerald-600/40 text-[10px] text-emerald-300 rounded">
              DAY {shiftDay}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1 relative">
            <span className="font-pixel text-2xl md:text-3xl lg:text-4xl text-emerald-400 text-glow-green font-bold tracking-tight">
              ${displayMoney.toLocaleString()}
            </span>

            {/* Floater for recent score */}
            {showFloater && (
              <span className="absolute -top-6 left-28 md:left-44 font-pixel text-sm md:text-base text-yellow-300 animate-bounce drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]">
                +${lastGained.toLocaleString()}!
              </span>
            )}
          </div>
        </div>

        {/* Multiplier & Daily Quota */}
        <div className="flex items-center gap-3">
          {/* Combo Streak */}
          <div className="bg-neutral-950/80 border border-amber-500/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Flame className={`w-4 h-4 ${streak > 1 ? 'text-amber-400 animate-bounce' : 'text-neutral-500'}`} />
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase">Combo Streak</div>
              <div className="font-pixel text-xs md:text-sm text-amber-400 text-glow-amber">
                {streak}x <span className="text-[10px] text-amber-300/80">({multiplier}x $)</span>
              </div>
            </div>
          </div>

          {/* Daily Shift Target */}
          <div className="hidden sm:block bg-neutral-950/80 border border-cyan-500/30 rounded-lg px-3 py-1.5 min-w-[130px]">
            <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-cyan-400" /> Daily Target
              </span>
              <span className="text-cyan-300">{progressPercent}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
