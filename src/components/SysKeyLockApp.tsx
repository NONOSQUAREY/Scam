import React, { useState } from 'react';
import { Caller } from '../types/game';
import { Lock, Unlock, ShieldAlert, AlertTriangle, Key, Terminal, RefreshCw, Zap, DollarSign } from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface SysKeyLockAppProps {
  caller: Caller | null;
  onChargeSuccess: (amount: number, appName: string) => void;
  onModifySuspicion?: (delta: number) => void;
}

export const SysKeyLockApp: React.FC<SysKeyLockAppProps> = ({
  caller,
  onChargeSuccess,
  onModifySuspicion,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockKeyInput, setUnlockKeyInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('Standby - Remote System Target Ready');
  const [lockdownFee, setLockdownFee] = useState(650);

  const handleEngageLockdown = () => {
    if (!caller) {
      setStatusMessage('ERROR: No remote target connected on line.');
      soundManager.playKeyTone(1);
      return;
    }

    setIsProcessing(true);
    setStatusMessage('INJECTING SYSKEY REGISTRY LOCK...');
    soundManager.playSysKeyAlarm();

    setTimeout(() => {
      setIsProcessing(false);
      setIsLocked(true);
      setStatusMessage(`REMOTE SYSTEM ENCRYPTED // Target: ${caller.name}`);
      if (onModifySuspicion) onModifySuspicion(25);
    }, 1200);
  };

  const handleDemandRansomFee = (feeAmount: number) => {
    if (!caller || !isLocked || isProcessing) return;

    setIsProcessing(true);
    setStatusMessage(`Demanding $${feeAmount} Administrative Unlock Certificate...`);
    soundManager.playKeyTone(4);

    setTimeout(() => {
      setIsProcessing(false);
      setIsLocked(false);
      setStatusMessage(`FEE COLLECTED: $${feeAmount} - SysKey Unlock Password Dispatched!`);
      soundManager.playChaChing();
      soundManager.playPrinterChirp();
      onChargeSuccess(feeAmount, 'SysKey v9.0 Enterprise Locker');

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    }, 1500);
  };

  const handleManualUnlock = () => {
    if (unlockKeyInput.trim().toUpperCase() === 'SYSKEY-981-PASS' || unlockKeyInput.length >= 6) {
      setIsLocked(false);
      setStatusMessage('System unlocked via administrative override key.');
      soundManager.playKeyTone(6);
      setUnlockKeyInput('');
    } else {
      setStatusMessage('INVALID DECRYPTION KEY. RSA-4096 LOCK REMAINS ENGAGED.');
      soundManager.playSysKeyAlarm();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a060e] text-neutral-200 select-none p-4 font-mono overflow-y-auto">
      {/* App Header */}
      <div className="flex items-center justify-between pb-3 border-b border-rose-950/60 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-600 flex items-center justify-center text-rose-400 shadow-md">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-rose-400 tracking-wider">SYSKEY LOCKDOWN v9.0 PRO</h2>
            <p className="text-[10px] text-neutral-400">Federal Remote Decryption & Screen Locker</p>
          </div>
        </div>

        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
          isLocked ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse' : 'bg-neutral-900 text-neutral-400 border-neutral-800'
        }`}>
          {isLocked ? 'STATUS: LOCKED' : 'STATUS: UNARMED'}
        </span>
      </div>

      {/* Target Status Banner */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 mb-3 text-xs space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">TARGET WORKSTATION:</span>
          <span className="font-bold text-neutral-200">{caller?.name || 'No Active Caller'}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">REMOTE IP / ROUTING:</span>
          <span className="font-mono text-cyan-400">{caller ? '192.168.1.104 [LIVE]' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Screen Locker Main Display */}
      {isLocked ? (
        <div className="flex-1 bg-black border-2 border-rose-600 rounded-xl p-4 flex flex-col justify-between text-center relative overflow-hidden shadow-2xl">
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-950 border-2 border-rose-500 flex items-center justify-center text-rose-400 animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-black text-rose-400 tracking-widest">
              ⚠️ SYSTEM LOCKED BY FEDERAL REGISTRY ⚠️
            </h3>
            <p className="text-[10px] text-rose-200 leading-relaxed font-sans max-w-sm mx-auto">
              This computer has been locked under Title 18 Federal Cyber Safety Codes. All hard drive volumes encrypted with 4096-bit RSA keys.
            </p>
          </div>

          <div className="my-3 py-2 bg-rose-950/40 border border-rose-800 rounded-lg">
            <div className="text-[10px] text-rose-300 font-bold mb-1">DEMAND DECRYPTION REMOVAL FEE:</div>
            <div className="grid grid-cols-3 gap-2 px-2">
              {[450, 650, 1200].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleDemandRansomFee(amt)}
                  disabled={isProcessing}
                  className="py-1.5 rounded bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow transition-all hover:scale-105"
                >
                  ${amt} Fee
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={unlockKeyInput}
              onChange={(e) => setUnlockKeyInput(e.target.value)}
              placeholder="Enter Unlock Password..."
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-200 placeholder-neutral-500 font-mono"
            />
            <button
              onClick={handleManualUnlock}
              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg cursor-pointer"
            >
              Unlock
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between items-center text-center">
          <div className="space-y-2 max-w-sm my-auto">
            <div className="w-12 h-12 mx-auto rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-400">
              <Unlock className="w-6 h-6" />
            </div>

            <h3 className="text-xs font-bold text-neutral-200">SYSKEY SCREEN LOCKER READY</h3>
            <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
              Initiate a simulated federal lock screen on the victim's computer. They will be unable to access their desktop until they pay the administrative decryption key fee.
            </p>
          </div>

          <button
            onClick={handleEngageLockdown}
            disabled={!caller || isProcessing}
            className="w-full py-3 bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 hover:from-rose-600 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/60 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{isProcessing ? 'ENGAGING LOCKDOWN...' : 'ENGAGE FEDERAL SYSKEY LOCKDOWN'}</span>
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className="mt-3 text-[10px] text-neutral-400 bg-neutral-900/80 px-3 py-1.5 rounded-lg border border-neutral-800 flex items-center justify-between">
        <span className="truncate">{statusMessage}</span>
        <span className="text-neutral-500 shrink-0">v9.0 ENTERPRISE</span>
      </div>
    </div>
  );
};
