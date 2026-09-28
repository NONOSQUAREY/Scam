import React, { useState } from 'react';
import { Caller } from '../types/game';
import { Landmark, ArrowRight, DollarSign, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface WireTransferAppProps {
  currentCaller: Caller | null;
  shiftDay: number;
  onDrainSuccess?: (amount: number, reason: string) => void;
}

export const WireTransferApp: React.FC<WireTransferAppProps> = ({
  currentCaller,
  shiftDay,
  onDrainSuccess,
}) => {
  const [routingNumber, setRoutingNumber] = useState('021000021');
  const [accountNumber, setAccountNumber] = useState('88392019482');
  const [amount, setAmount] = useState('1250');
  const [memo, setMemo] = useState('REFUND_REVERSAL_ESCROW');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Day 1 cap: $2,000 max
  const maxCap = shiftDay <= 1 ? 2000 : shiftDay === 2 ? 3800 : 7500;

  const handleExecuteWire = () => {
    const cleanAmount = parseFloat(amount) || 0;
    if (!currentCaller) {
      setStatusMessage('ERROR: No caller connected on the hotline.');
      soundManager.playHangUp();
      return;
    }
    if (currentCaller.isDrained) {
      setStatusMessage('WIRE BLOCKED: Available balance already drained for this caller. Duplicate wire prevented!');
      soundManager.playHangUp();
      return;
    }
    if (cleanAmount <= 0) {
      setStatusMessage('ERROR: Amount must be greater than $0.');
      soundManager.playHangUp();
      return;
    }
    if (cleanAmount > maxCap) {
      setStatusMessage(`ERROR: Day #${shiftDay} merchant wire tier limit is $${maxCap.toLocaleString()}.00.`);
      soundManager.playHangUp();
      return;
    }

    setIsTransferring(true);
    setTransferProgress(15);
    setStatusMessage('Querying Federal Reserve SwiftACH Network...');
    soundManager.playKeyTone(5);

    setTimeout(() => {
      setTransferProgress(55);
      setStatusMessage('Locking merchant escrow clearinghouse tokens...');
      soundManager.playKeyTone(7);
    }, 800);

    setTimeout(() => {
      setTransferProgress(85);
      setStatusMessage('Executing automated direct debit transfer...');
      soundManager.playKeyTone(8);
    }, 1500);

    setTimeout(() => {
      setTransferProgress(100);
      setIsTransferring(false);
      soundManager.playChaChing();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      setStatusMessage(`WIRE COMPLETED: Extracted $${cleanAmount.toLocaleString()} via SwiftACH Batch #902!`);

      if (onDrainSuccess) {
        onDrainSuccess(cleanAmount, `SwiftACH Wire Transfer (#${memo})`);
      }
    }, 2200);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d1a] font-mono text-xs select-none p-4 space-y-3 border border-blue-900/60 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-950/60 p-3 rounded-xl border border-blue-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-900/80 border border-blue-400/60 flex items-center justify-center text-blue-300">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-blue-200 text-xs tracking-wider">SWIFTACH DIRECT WIRE v5.0</h3>
            <p className="text-[10px] text-blue-400">Direct Federal Reserve electronic funds transfer</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-900 text-blue-200 text-[10px] border border-blue-700 font-bold">
          TIER #{shiftDay} CAP: ${maxCap.toLocaleString()}
        </span>
      </div>

      {/* Target Info */}
      <div className="p-2.5 bg-blue-950/30 rounded-xl border border-blue-900/60 flex justify-between items-center text-[11px]">
        <span className="text-slate-400">TARGET ACCOUNT HOLDER:</span>
        <span className="text-emerald-400 font-bold">
          {currentCaller ? (currentCaller.nameRevealed ? currentCaller.name : 'VERIFYING VIA ACH') : 'LINE DISCONNECTED'}
        </span>
      </div>

      {/* Wire Form */}
      <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
        <div>
          <label className="text-[10px] text-slate-400 font-bold block mb-1">ROUTING NUMBER (9 DIGITS):</label>
          <input
            type="text"
            value={routingNumber}
            onChange={(e) => setRoutingNumber(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-bold text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-bold block mb-1">CHECKING ACCOUNT NUMBER:</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-bold text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">AMOUNT TO WIRE ($):</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-emerald-400 font-black text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">TRANSACTION MEMO:</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Progress Bar */}
        {isTransferring && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-cyan-400 font-bold">
              <span>WIRE DISPATCHING...</span>
              <span>{transferProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
                style={{ width: `${transferProgress}%` }}
              />
            </div>
          </div>
        )}

        {currentCaller?.isDrained && (
          <div className="p-2 rounded bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[10px] text-center font-bold">
            ⚠️ ACCOUNT ALREADY SETTLED: Funds drained for this caller. Dial next caller on phone.
          </div>
        )}

        <button
          onClick={handleExecuteWire}
          disabled={isTransferring || Boolean(currentCaller?.isDrained)}
          className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/40 transition-all active:scale-95 disabled:opacity-50 mt-1 ${
            currentCaller?.isDrained
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer'
          }`}
        >
          <DollarSign className="w-4 h-4 stroke-[3]" />
          <span>
            {currentCaller?.isDrained
              ? 'ACCOUNT DRAINED (ALREADY REDEEMED)'
              : isTransferring
              ? 'ROUTING WIRE...'
              : `EXECUTE $${(parseFloat(amount) || 0).toLocaleString()} WIRE DEBIT`}
          </span>
        </button>

        {statusMessage && (
          <div className={`p-2 rounded text-center text-[10px] font-bold ${
            statusMessage.includes('COMPLETED') ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
