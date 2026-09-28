import React, { useState } from 'react';
import { Caller } from '../types/game';
import { Shield, CheckCircle, AlertTriangle, Zap, Copy, Check } from 'lucide-react';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface IdentityWindowProps {
  caller: Caller | null;
  onVerifySSN: (amount: number) => void;
}

export const IdentityWindow: React.FC<IdentityWindowProps> = ({ caller, onVerifySSN }) => {
  const [ssnInput, setSsnInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format SSN input as XXX-XX-XXXX
  const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 9);
    if (val.length > 5) {
      val = `${val.substring(0, 3)}-${val.substring(3, 5)}-${val.substring(5, 9)}`;
    } else if (val.length > 3) {
      val = `${val.substring(0, 3)}-${val.substring(3, 5)}`;
    }
    setSsnInput(val);
  };

  const handleVerify = () => {
    const raw = ssnInput.replace(/\D/g, '');
    if (raw.length !== 9) {
      setStatus('INCORRECT FORMAT: Social Security Number must be exactly 9 digits (XXX-XX-XXXX).');
      soundManager.playHangUp();
      return;
    }

    if (!caller) {
      setStatus('ERROR: No active caller line connected.');
      soundManager.playHangUp();
      return;
    }

    setIsVerifying(true);
    setStatus('Querying Federal Taxpayer Clearinghouse database...');
    soundManager.playKeyTone(6);

    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      setStatus(`✓ TAX RECORD CONFIRMED: ${caller.name.toUpperCase()} (SSN: ${ssnInput}) - Identity compromised!`);
      soundManager.playChaChing();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}
      onVerifySSN(1500);
    }, 1200);
  };

  // Quick generate/extract SSN for caller
  const handleAutoFillSSN = () => {
    if (!caller) return;
    const p1 = Math.floor(100 + Math.random() * 800);
    const p2 = Math.floor(10 + Math.random() * 89);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const generated = `${p1}-${p2}-${p3}`;
    setSsnInput(generated);
    soundManager.playKeyTone(5);
  };

  const copyToClipboard = () => {
    if (!ssnInput) return;
    navigator.clipboard.writeText(ssnInput);
    setCopied(true);
    soundManager.playKeyTone(7);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f1f3f5] text-neutral-900 font-sans select-none overflow-hidden">
      {/* Red Maroon Banner Header matching the screenshot EXACTLY */}
      <div className="bg-[#782328] px-4 py-3 border-b-2 border-[#54171b] flex items-center justify-between text-white shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          {/* Round Seal Icon with eagle/stars */}
          <div className="w-10 h-10 rounded-full bg-[#521619] border-2 border-amber-400/80 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
            <Shield className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide flex items-center gap-2">
              <span>Social Security Stealer</span>
              <span className="text-[9px] bg-red-950 px-1.5 py-0.2 rounded border border-red-800 text-amber-300 font-mono">
                SSA v3.2
              </span>
            </div>
            <div className="text-[10px] text-red-200/90 font-sans leading-tight">
              Validate a caller's taxpayer record and Social Security identifier
            </div>
          </div>
        </div>

        {caller && (
          <button
            onClick={handleAutoFillSSN}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded text-[10px] font-bold font-mono flex items-center gap-1 cursor-pointer transition-all shadow"
          >
            <Zap className="w-3 h-3" />
            <span>Generate Lead SSN</span>
          </button>
        )}
      </div>

      {/* Main Form Body */}
      <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4 max-w-lg mx-auto w-full">
          {/* Input Box matching the screenshot */}
          <div className="bg-white border-2 border-neutral-300 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-neutral-700 font-sans tracking-wide">
                Social Security Number (XXX-XX-XXXX)
              </label>
              {ssnInput && (
                <button
                  onClick={copyToClipboard}
                  className="text-[10px] font-mono text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={ssnInput}
                onChange={handleSsnChange}
                placeholder="XXX-XX-XXXX"
                className="flex-1 bg-[#e9ecef] border border-neutral-300 rounded-lg px-3.5 py-2.5 text-base font-mono tracking-widest text-neutral-900 focus:outline-none focus:border-red-700 focus:bg-white transition-all"
              />

              <button
                onClick={handleVerify}
                disabled={isVerifying || !ssnInput}
                className="px-6 py-2.5 bg-[#6c757d] hover:bg-[#5a6268] active:bg-[#494f54] text-white font-bold rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Status Alert */}
          {status && (
            <div
              className={`p-3 rounded-xl text-xs font-mono border leading-relaxed ${
                status.includes('CONFIRMED')
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              {status}
            </div>
          )}

          {/* Caller Reference details */}
          {caller && (
            <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3 text-xs font-mono space-y-1 text-neutral-600">
              <div className="flex justify-between">
                <span>TAXPAYER NAME:</span>
                <span className="font-bold text-neutral-900">
                  {caller.nameRevealed ? caller.name.toUpperCase() : '🔒 [NAME HIDDEN]'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ESTIMATED TAX BRACKET:</span>
                <span className="font-bold text-neutral-900">24% Federal (Tier B)</span>
              </div>
              <div className="flex justify-between">
                <span>IDENTITY REWARD:</span>
                <span className="font-bold text-emerald-700">+$1,500 Extracted</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="text-center text-[10px] text-neutral-500 font-mono pt-3 border-t border-neutral-200">
          Scam With Your Friends • Social Security Stealer Terminal Module
        </div>
      </div>
    </div>
  );
};
