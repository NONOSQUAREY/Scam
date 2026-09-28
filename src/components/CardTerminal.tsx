import React, { useState, useEffect } from 'react';
import { FakeCard } from '../types/game';
import { CreditCard, ArrowRight, Zap, CheckCircle2, AlertCircle, Copy, Sparkles, RefreshCw } from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface CardTerminalProps {
  card: FakeCard | null;
  onDrainSuccess: (amount: number) => void;
  onDrainFail: (reason: string) => void;
}

export const CardTerminal: React.FC<CardTerminalProps> = ({
  card,
  onDrainSuccess,
  onDrainFail,
}) => {
  const [inputNumber, setInputNumber] = useState('');
  const [inputExpiry, setInputExpiry] = useState('');
  const [inputCvv, setInputCvv] = useState('');
  const [inputAmount, setInputAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalMessage, setTerminalMessage] = useState('INSERT OR SWIPE CARD');
  const [terminalStatus, setTerminalStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Reset or prefill when new caller arrives
  useEffect(() => {
    if (card) {
      setInputNumber(card.numberRevealed ? card.fullNumber : card.maskedNumber);
      setInputExpiry(card.expiryRevealed ? card.expiry : 'MM/YY');
      setInputCvv(card.cvvRevealed ? card.cvv : '•••');
      setInputAmount(card.balance);
      setTerminalMessage('AWAITING AUTHORIZATION');
      setTerminalStatus('idle');
    } else {
      setInputNumber('');
      setInputExpiry('');
      setInputCvv('');
      setInputAmount(0);
      setTerminalMessage('SYSTEM IDLE');
      setTerminalStatus('idle');
    }
  }, [card]);

  // Sync when card fields get revealed during conversation
  useEffect(() => {
    if (!card) return;
    if (card.numberRevealed) setInputNumber(card.fullNumber);
    if (card.expiryRevealed) setInputExpiry(card.expiry);
    if (card.cvvRevealed) setInputCvv(card.cvv);
  }, [card?.numberRevealed, card?.expiryRevealed, card?.cvvRevealed, card?.fullNumber, card?.expiry, card?.cvv]);

  // Handle Draining card
  const handleDrain = async () => {
    if (!card) {
      onDrainFail('No caller on line!');
      return;
    }

    // Check if card is fully coaxed
    if (!card.cvvRevealed) {
      soundManager.playHangUp();
      setTerminalStatus('error');
      setTerminalMessage('INCORRECT: CVV MISSING! COAX 3 DIGITS FROM CALLER!');
      onDrainFail('INCORRECT: Missing CVV! Ask caller for 3 security digits.');
      return;
    }

    if (!card.numberRevealed) {
      soundManager.playHangUp();
      setTerminalStatus('error');
      setTerminalMessage('INCORRECT: INCOMPLETE CARD NUMBER!');
      onDrainFail('INCORRECT: Card number incomplete! Ask caller for full card.');
      return;
    }

    // Processing sequence
    setIsProcessing(true);
    setTerminalMessage('CONNECTING TO GLOBAL BOGUS-PAY GATEWAY...');
    soundManager.playCardSwipe();

    setTimeout(() => {
      soundManager.playPrinterChirp();
      setTerminalMessage('TRANSACTION APPROVED! PRINTING RECEIPT...');

      setTimeout(() => {
        setIsProcessing(false);
        setTerminalStatus('success');
        setTerminalMessage(`SUCCESS: $${card.balance.toLocaleString()} EXTRACTED!`);
        soundManager.playChaChing();

        // Confetti explosion
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#10b981', '#fbbf24', '#38bdf8'],
          });
        } catch (e) {}

        onDrainSuccess(card.balance);
      }, 1200);
    }, 1200);
  };

  const handleKeypadPress = (digit: string) => {
    soundManager.playKeyTone(parseInt(digit) || 5);
  };

  const copyIntelToTerminal = () => {
    if (!card) return;
    soundManager.playKeyTone(7);
    if (card.numberRevealed) setInputNumber(card.fullNumber);
    if (card.expiryRevealed) setInputExpiry(card.expiry);
    if (card.cvvRevealed) setInputCvv(card.cvv);
    setTerminalMessage('INTEL AUTO-COPIED TO TERMINAL');
  };

  return (
    <div className="bg-neutral-900/95 border-2 border-neutral-700/80 rounded-xl p-4 shadow-2xl relative">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span className="font-pixel text-[11px] text-emerald-400 text-glow-green">
            SCAM-O-MATIC 3000
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded border border-neutral-700">
          TERMINAL #V-882
        </span>
      </div>

      {/* Realistic 2D Visual Credit Card Display */}
      {card ? (
        <div className="relative mb-4 p-4 rounded-xl bg-gradient-to-tr from-slate-900 via-neutral-800 to-indigo-950 border border-neutral-600/60 shadow-xl overflow-hidden group">
          {/* Hologram shine effect */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 pointer-events-none group-hover:translate-x-full transition-transform duration-1000" />

          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                CARD BRAND
              </div>
              <div className="font-display font-bold text-amber-300 text-sm tracking-wide">
                {card.brand}
              </div>
            </div>
            {/* Gold Chip */}
            <div className="w-9 h-7 rounded bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border border-yellow-200 shadow-inner flex items-center justify-center">
              <div className="w-6 h-4 border border-amber-900/40 rounded-sm" />
            </div>
          </div>

          {/* 16-digit card number */}
          <div className="my-2">
            <div className="text-[9px] font-mono text-neutral-400">CARD NUMBER</div>
            <div className="font-mono text-base md:text-lg tracking-widest text-neutral-100 font-bold flex items-center gap-2">
              <span>{inputNumber || card.maskedNumber}</span>
              {card.numberRevealed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
              ) : (
                <span className="text-[10px] text-amber-400 font-normal">[HIDDEN]</span>
              )}
            </div>
          </div>

          {/* Cardholder + Expiry + CVV */}
          <div className="flex items-center justify-between text-xs font-mono mt-3 pt-2 border-t border-neutral-700/60">
            <div>
              <div className="text-[8px] text-neutral-400">CARDHOLDER</div>
              <div className="font-bold text-neutral-200 uppercase truncate max-w-[130px]">
                {card.cardholder}
              </div>
            </div>

            <div>
              <div className="text-[8px] text-neutral-400">EXPIRES</div>
              <div className="font-bold text-neutral-200">
                {card.expiryRevealed ? card.expiry : '••/••'}
              </div>
            </div>

            <div>
              <div className="text-[8px] text-neutral-400">CVV / CVC</div>
              <div className="font-bold text-amber-300 flex items-center gap-1">
                {card.cvvRevealed ? (
                  <span>{card.cvv} ✓</span>
                ) : (
                  <span className="text-red-400 font-mono">••• (ASK)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-center text-xs font-mono text-neutral-500 mb-4">
          No card in reader. Awaiting victim connection...
        </div>
      )}

      {/* Terminal LCD Screen */}
      <div className="bg-emerald-950/80 border-2 border-emerald-500/50 rounded-lg p-2.5 mb-3 box-glow-green text-center">
        <div className="text-[9px] font-mono text-emerald-400/80 uppercase">GATEWAY STATUS</div>
        <div className={`font-mono text-xs md:text-sm font-bold tracking-wider ${terminalStatus === 'error' ? 'text-red-400 text-glow-red' : 'text-emerald-300 text-glow-green'}`}>
          {isProcessing ? '>>> PROCESSING ENCRYPTION <<<' : terminalMessage}
        </div>
      </div>

      {/* Quick Autofill & Drain Button */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={copyIntelToTerminal}
            disabled={!card || isProcessing}
            className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 border border-neutral-600 rounded-lg text-xs font-mono text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>SYNC REVEALED INTEL</span>
          </button>
        </div>

        {/* Big Action Button: DRAIN CARD */}
        <button
          onClick={handleDrain}
          disabled={!card || isProcessing}
          className={`w-full py-3 px-4 rounded-xl font-pixel text-xs md:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-lg ${
            !card
              ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
              : card.cvvRevealed && card.numberRevealed
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white border-2 border-emerald-400 box-glow-green animate-pulse-fast'
              : 'bg-amber-600 hover:bg-amber-500 text-neutral-950 border border-amber-400'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>DRAINING CARD...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>
                {card?.cvvRevealed && card?.numberRevealed
                  ? `DRAIN $${(card?.balance || 0).toLocaleString()} NOW!`
                  : `ATTEMPT CHARGE ($${(card?.balance || 0).toLocaleString()})`}
              </span>
            </>
          )}
        </button>

        {/* Missing Intel Guide */}
        {card && (!card.cvvRevealed || !card.numberRevealed) && (
          <div className="text-[11px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-500/30 rounded p-1.5 text-center flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {!card.numberRevealed
                ? 'Coax complete 16 digits from caller'
                : 'Need 3-digit CVV from back of card!'}
            </span>
          </div>
        )}
      </div>

      {/* Mini Keypad for Tactile Retro Touch */}
      <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-neutral-800">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'ENT'].map((btn) => (
          <button
            key={btn}
            onClick={() => handleKeypadPress(btn)}
            className="py-1.5 bg-neutral-950 hover:bg-neutral-800 active:bg-neutral-700 border border-neutral-700/80 rounded font-mono text-xs text-neutral-300 hover:text-neutral-100 transition-colors cursor-pointer"
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};
