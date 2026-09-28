import React, { useState } from 'react';
import { Caller } from '../types/game';
import { QrCode, Shield, CheckCircle2, RefreshCw, Landmark, ArrowRight, Zap, Copy, Check } from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface CryptoVaultAppProps {
  caller: Caller | null;
  onChargeSuccess: (amount: number, appName: string) => void;
}

export const CryptoVaultApp: React.FC<CryptoVaultAppProps> = ({ caller, onChargeSuccess }) => {
  const [selectedTier, setSelectedTier] = useState<number>(1800);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmations, setConfirmations] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [copied, setCopied] = useState(false);

  const walletAddress = 'bc1q981fedreservesafedeposit77xa99c82';

  const handleCopyWallet = () => {
    navigator.clipboard?.writeText?.(walletAddress);
    setCopied(true);
    soundManager.playKeyTone(3);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessDeposit = () => {
    if (!caller || isProcessing) return;

    setIsProcessing(true);
    setConfirmations(0);
    soundManager.playKeyTone(7);

    // Block confirmation 1
    setTimeout(() => {
      setConfirmations(1);
      soundManager.playKeyTone(4);
    }, 1000);

    // Block confirmation 2
    setTimeout(() => {
      setConfirmations(2);
      soundManager.playKeyTone(5);
    }, 2000);

    // Block confirmation 3 - Finalized
    setTimeout(() => {
      setConfirmations(3);
      setIsProcessing(false);
      setIsCompleted(true);
      soundManager.playBitcoinCash();
      soundManager.playChaChing();
      onChargeSuccess(selectedTier, 'Federal Reserve Crypto Safe Locker');

      try {
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}
    }, 3200);
  };

  const handleReset = () => {
    setIsCompleted(false);
    setConfirmations(0);
    soundManager.playKeyTone(2);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] text-neutral-200 select-none p-4 font-mono overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-950/60 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/80 flex items-center justify-center text-amber-400 shadow-md">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-amber-400 tracking-wider">FEDERAL CRYPTO SAFE VAULT</h2>
            <p className="text-[10px] text-neutral-400">Treasury Digital Asset Escrow Locker</p>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-600">
          CHAIN: BTC-LEDGER
        </span>
      </div>

      {isCompleted ? (
        <div className="flex-1 bg-neutral-950 border-2 border-emerald-500 rounded-xl p-4 flex flex-col justify-between items-center text-center shadow-2xl">
          <div className="space-y-2 my-auto">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-sm font-black text-emerald-400">BLOCKCHAIN DEPOSIT CONFIRMED!</h3>
            <p className="text-xs text-neutral-200 font-sans">
              Successfully extracted <span className="font-bold text-emerald-400">${selectedTier.toLocaleString()}</span> from {caller?.name || 'Target'}.
            </p>
            <div className="bg-black/60 p-2.5 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 text-left font-mono">
              <div>TXID: 0x981f4a8b...7739c</div>
              <div>CONFIRMATIONS: 3/3 [BLOCK #891,404]</div>
              <div>STATUS: FUNDS TRANSFERRED TO COLD STORAGE</div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl cursor-pointer"
          >
            Process Another Escrow Locker
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-3">
          {/* Target Box */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs flex justify-between items-center">
            <div>
              <span className="text-neutral-500 text-[10px] block">ESCROW BENEFICIARY:</span>
              <span className="font-bold text-neutral-200">{caller?.name || 'Standby for Target'}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 text-[10px] block">SECURITY CLEARANCE:</span>
              <span className="text-amber-400 font-bold">LEVEL-4 SAFE LOCKER</span>
            </div>
          </div>

          {/* Amount Tier Selectors */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-neutral-400 font-bold">SELECT CONVERSION ESCROW TIER:</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Safety Deposit', amt: 1200 },
                { label: 'IRS Indemnity', amt: 2400 },
                { label: 'Cold Storage', amt: 4800 },
              ].map((tier) => (
                <button
                  key={tier.amt}
                  onClick={() => {
                    setSelectedTier(tier.amt);
                    soundManager.playKeyTone(3);
                  }}
                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                    selectedTier === tier.amt
                      ? 'bg-amber-950 border-amber-400 text-amber-200 shadow-md scale-[1.02]'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-[10px] font-medium">{tier.label}</div>
                  <div className="text-xs font-black text-emerald-400">${tier.amt.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Address & QR Code */}
          <div className="bg-black/60 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center">
              <QrCode className="w-14 h-14 text-neutral-950" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-neutral-500 block mb-0.5">FEDERAL COLD WALLET ADDRESS:</span>
              <div className="text-[10px] font-mono text-cyan-300 truncate bg-neutral-900 px-2 py-1 rounded border border-neutral-800 mb-1.5">
                {walletAddress}
              </div>
              <button
                onClick={handleCopyWallet}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied Address!' : 'Copy Treasury Wallet ID'}</span>
              </button>
            </div>
          </div>

          {/* Confirmation Progress */}
          {isProcessing && (
            <div className="bg-neutral-950 border border-amber-500/60 rounded-xl p-2.5 text-center space-y-1 animate-pulse">
              <div className="text-[10px] text-amber-300 font-bold">
                AWAITING BLOCKCHAIN CONFIRMATIONS: {confirmations}/3
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${(confirmations / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Authorize Button */}
          <button
            onClick={handleProcessDeposit}
            disabled={!caller || isProcessing}
            className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/60 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>
              {isProcessing
                ? 'VERIFYING BLOCKCHAIN CONFIRMATIONS...'
                : `AUTHORIZE $${selectedTier.toLocaleString()} ESCROW DEPOSIT`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
