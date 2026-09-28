import React, { useState } from 'react';
import { Caller } from '../types/game';
import { CreditCard, Gift, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface GiftCardsWindowProps {
  caller: Caller | null;
  onRedeemSuccess: (amount: number) => void;
}

export const GiftCardsWindow: React.FC<GiftCardsWindowProps> = ({
  caller,
  onRedeemSuccess,
}) => {
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState('');
  const [redeemedCards, setRedeemedCards] = useState<Array<{ code: string; amount: number }>>([]);

  const handleRedeem = (redeemCode?: string) => {
    const targetCode = redeemCode || code;
    if (!targetCode || targetCode.length < 5) {
      setMessage('Invalid gift card or voucher code');
      return;
    }

    if (redeemedCards.some((c) => c.code.trim().toUpperCase() === targetCode.trim().toUpperCase())) {
      setMessage('ERROR: This voucher code has already been redeemed! Duplicate voucher blocked.');
      soundManager.playHangUp();
      return;
    }

    if (caller?.isDrained) {
      setMessage('VOUCHER BLOCKED: Target caller has already been settled.');
      soundManager.playHangUp();
      return;
    }

    setIsRedeeming(true);
    setMessage('Validating code with retail gateway...');
    soundManager.playKeyTone(7);

    setTimeout(() => {
      setIsRedeeming(false);
      const amount = 500;
      soundManager.playChaChing();
      soundManager.playPrinterChirp();

      setRedeemedCards((prev) => [{ code: targetCode, amount }, ...prev]);
      setMessage(`Successfully redeemed $${amount} retail voucher!`);
      setCode('');

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      onRedeemSuccess(amount);
    }, 1200);
  };

  const handleQuickInsert = () => {
    if (!caller) return;
    const fakeVoucher = 'TGT-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
    setCode(fakeVoucher);
  };

  return (
    <div className="flex-1 bg-neutral-950 p-4 overflow-y-auto space-y-3 font-mono text-xs select-none h-full">
      {/* Target & Google Card Redeem Box */}
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-950 border border-red-700/50 flex items-center justify-center text-red-400">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-neutral-100">Retail Voucher Terminal</div>
              <div className="text-[10px] text-neutral-500">Target, Apple & Google Play Batch Redemption</div>
            </div>
          </div>
          <button
            onClick={handleQuickInsert}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] flex items-center gap-1 border border-neutral-700 cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Generate Voucher</span>
          </button>
        </div>

        <div>
          <label className="block text-[10px] text-neutral-400 uppercase mb-1">
            Gift Card / Voucher Code (16 Digits)
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. TGT-8492-1049-5921"
            className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-xs font-mono text-neutral-100 tracking-wider focus:outline-none focus:border-red-500"
          />
        </div>

        {message && (
          <div className={`p-2 rounded text-[11px] ${message.includes('Success') ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-300'}`}>
            {message}
          </div>
        )}

        <button
          onClick={() => handleRedeem()}
          disabled={isRedeeming}
          className="w-full py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
        >
          {isRedeeming ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>REDEEMING VOUCHER...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>REDEEM TO OPERATOR POOL ($500)</span>
            </>
          )}
        </button>
      </div>

      {/* Redeemed Cards History */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-neutral-500 font-bold uppercase">Redeemed Vouchers This Shift</div>
        {redeemedCards.length === 0 ? (
          <div className="p-3 bg-neutral-900/50 rounded border border-neutral-800 text-neutral-600 text-center text-[11px]">
            No gift cards redeemed yet.
          </div>
        ) : (
          redeemedCards.map((c, i) => (
            <div key={i} className="p-2 bg-neutral-900 border border-neutral-800 rounded flex justify-between items-center text-[11px]">
              <span className="text-neutral-300 font-mono">{c.code}</span>
              <span className="text-emerald-400 font-bold font-mono">+${c.amount}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
