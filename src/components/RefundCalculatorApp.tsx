import React, { useState } from 'react';
import { Caller } from '../types/game';
import { Calculator, AlertTriangle, ArrowRight, DollarSign, Sparkles, Copy, Check } from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface RefundCalculatorAppProps {
  currentCaller: Caller | null;
  shiftDay: number;
  onDrainSuccess?: (amount: number, reason: string) => void;
  onSendScriptToPhone?: (text: string) => void;
}

export const RefundCalculatorApp: React.FC<RefundCalculatorAppProps> = ({
  currentCaller,
  shiftDay,
  onDrainSuccess,
  onSendScriptToPhone,
}) => {
  const [intendedRefund, setIntendedRefund] = useState('250');
  const [hasExtraZero, setHasExtraZero] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const baseAmount = parseFloat(intendedRefund) || 0;
  const sentAmount = hasExtraZero ? baseAmount * 10 : baseAmount;
  const deficit = Math.max(0, sentAmount - baseAmount);

  // Day 1 cap: $2,000 max
  const maxDrain = shiftDay <= 1 ? 1950 : shiftDay === 2 ? 3500 : 7000;
  const drainableAmount = Math.min(deficit > 0 ? deficit : baseAmount, maxDrain);

  const scriptText = `Oh heavens! Look at the terminal ledger! I intended to send $${baseAmount.toLocaleString()}, but the central merchant computer deposited $${sentAmount.toLocaleString()}! You have to reverse the $${deficit.toLocaleString()} difference immediately or the bank will freeze both our accounts!`;

  const handleCopyScript = () => {
    if (onSendScriptToPhone) {
      onSendScriptToPhone(scriptText);
    }
    soundManager.playKeyTone(7);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAuthorizeRecovery = () => {
    if (!currentCaller) {
      setStatusMessage('NO CALLER CONNECTED: Must have active line.');
      soundManager.playHangUp();
      return;
    }
    if (currentCaller.isDrained) {
      setStatusMessage('RECOVERY BLOCKED: Caller account has already been settled. Duplicate recovery prevented!');
      soundManager.playHangUp();
      return;
    }
    if (drainableAmount <= 0) {
      setStatusMessage('ERROR: Deficit amount must be greater than $0.');
      soundManager.playHangUp();
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Connecting to Central ACH Clearinghouse...');
    soundManager.playKeyTone(4);

    setTimeout(() => {
      setIsProcessing(false);
      soundManager.playChaChing();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      setStatusMessage(`RECOVERY APPROVED: Extracted $${drainableAmount.toLocaleString()} refund reversal!`);

      if (onDrainSuccess) {
        onDrainSuccess(drainableAmount, `Refund Overpayment Error (${hasExtraZero ? 'Extra Zero' : 'Standard'})`);
      }
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] font-sans text-xs select-none p-4 overflow-y-auto space-y-3 border border-slate-800">
      {/* Title Header */}
      <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/60 flex items-center justify-center text-amber-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-slate-100 text-sm">OVERPAYMENT MATRIX v3.2</h3>
            <p className="text-[10px] text-slate-400">Accidental wire multiplier & refund panic generator</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] border border-amber-800 font-bold">
          TIER #{shiftDay} GATEWAY
        </span>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-3 font-mono">
        <div>
          <label className="text-[10px] text-slate-400 font-bold block mb-1">INTENDED REFUND AMOUNT ($):</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-500">$</span>
            <input
              type="number"
              value={intendedRefund}
              onChange={(e) => setIntendedRefund(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-slate-100 text-xs font-bold focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* The Legendary "Accidental Extra Zero" Toggle */}
        <div className="flex items-center justify-between p-2.5 bg-amber-950/30 border border-amber-800/60 rounded-lg">
          <div>
            <span className="font-bold text-amber-300 text-xs block">"Accidental" Extra Zero Bug</span>
            <span className="text-[10px] text-amber-400/80">Simulates typo: wires 10x the amount ($ {baseAmount} ➔ $ {sentAmount})</span>
          </div>
          <button
            onClick={() => {
              setHasExtraZero(!hasExtraZero);
              soundManager.playKeyTone(6);
            }}
            className={`px-3 py-1 rounded font-bold text-xs cursor-pointer transition-all ${
              hasExtraZero
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {hasExtraZero ? 'ACTIVE (10X)' : 'OFF (1X)'}
          </button>
        </div>

        {/* Ledger Breakdown Display */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>INTENDED REFUND:</span>
            <span className="text-slate-200">${baseAmount.toLocaleString()}.00</span>
          </div>
          <div className="flex justify-between text-amber-400 font-bold">
            <span>DISBURSED TO TARGET ACCOUNT:</span>
            <span>${sentAmount.toLocaleString()}.00</span>
          </div>
          <div className="flex justify-between text-rose-400 font-black border-t border-slate-800 pt-1 text-xs">
            <span>CALLER OVERPAYMENT DEBT:</span>
            <span>${deficit.toLocaleString()}.00</span>
          </div>
        </div>

        {/* Script Feed Button */}
        <button
          onClick={handleCopyScript}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'SCRIPT SENT TO PHONE!' : 'INJECT OVERPAYMENT SCRIPT TO PHONE'}</span>
        </button>

        {currentCaller?.isDrained && (
          <div className="p-2 rounded bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[10px] text-center font-bold">
            ⚠️ OVERPAYMENT ALREADY REVERSED: Funds extracted from this caller. Dial next caller on phone.
          </div>
        )}

        {/* Instant Reversal Claim */}
        <button
          onClick={handleAuthorizeRecovery}
          disabled={isProcessing || Boolean(currentCaller?.isDrained)}
          className={`w-full py-2.5 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all active:scale-95 disabled:opacity-50 ${
            currentCaller?.isDrained
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 cursor-pointer'
          }`}
        >
          <DollarSign className="w-4 h-4 stroke-[3]" />
          <span>
            {currentCaller?.isDrained
              ? 'OVERPAYMENT ALREADY EXTRACTED'
              : isProcessing
              ? 'CLEARING OVERPAYMENT...'
              : `REVERSE & EXTRACT $${drainableAmount.toLocaleString()}`}
          </span>
        </button>

        {statusMessage && (
          <div className={`p-2 rounded text-center text-[10px] font-bold ${
            statusMessage.includes('APPROVED') ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
