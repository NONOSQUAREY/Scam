import React, { useState } from 'react';
import { Minus, Sparkles, Bot } from 'lucide-react';
import { Caller } from '../types/game';

interface ScammyWidgetProps {
  caller: Caller | null;
}

export const ScammyWidget: React.FC<ScammyWidgetProps> = ({ caller }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Grounded operational tips for call center workflow
  const tips = [
    !caller?.connectionCodeRevealed
      ? "Ask the caller to open AnyViewer and read out their 6-digit partner connection code."
      : !caller?.card.cvvRevealed
      ? "Ask for the 3-digit CVV on the back of the card to authorize the cancellation in the Credit Card terminal."
      : "Open the Credit Card Terminal and process the authorization charge before the caller hangs up!",
  ];

  const currentTip = tips[0];

  return (
    <div className="fixed bottom-14 right-4 z-20 w-80 max-w-[90vw] select-none">
      <div className="bg-[#1e1915]/95 border border-amber-900/60 rounded-xl p-3 shadow-2xl backdrop-blur-sm text-neutral-100 relative transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-amber-400" />
            <span className="font-sans font-bold text-[11px] uppercase tracking-wider text-amber-300">
              SCAMMY HAS AN IDEA
            </span>
          </div>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-5 h-5 flex items-center justify-center hover:bg-neutral-800 text-neutral-400 rounded"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex items-start gap-3">
            <p className="text-xs text-neutral-300 font-sans leading-relaxed flex-1">
              "{currentTip}"
            </p>

            {/* Little cute robot avatar */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-amber-500/50 flex items-center justify-center relative shadow">
                {/* Yellow antennas */}
                <div className="absolute -top-2 left-2 w-1.5 h-2 bg-yellow-400 rounded-t" />
                <div className="absolute -top-2 right-2 w-1.5 h-2 bg-yellow-400 rounded-t" />
                {/* Robot face */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                </div>
              </div>
              <span className="text-[9px] font-mono text-amber-400 mt-1 font-bold">
                SCAMMY
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
