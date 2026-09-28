import React, { useEffect, useState } from 'react';
import { Caller } from '../types/game';
import { ShieldAlert, HeartHandshake, Clock, Volume2, Sparkles, User, AlertTriangle } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface CallerScreenProps {
  caller: Caller | null;
  isCallerTalking: boolean;
  isPlayerTalking: boolean;
  latestMessage: string;
  onReplayTTS: () => void;
  onSoundboardAirhorn: () => void;
}

export const CallerScreen: React.FC<CallerScreenProps> = ({
  caller,
  isCallerTalking,
  isPlayerTalking,
  latestMessage,
  onReplayTTS,
}) => {
  const [mouthFrame, setMouthFrame] = useState(0);
  const [eyesBlink, setEyesBlink] = useState(false);

  // Mouth animation when caller is speaking
  useEffect(() => {
    if (!isCallerTalking) {
      setMouthFrame(0);
      return;
    }
    const interval = setInterval(() => {
      setMouthFrame((f) => (f + 1) % 4);
    }, 120);
    return () => clearInterval(interval);
  }, [isCallerTalking]);

  // Periodic random eye blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyesBlink(true);
      setTimeout(() => setEyesBlink(false), 180);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  if (!caller) {
    return (
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-700 flex items-center justify-center text-neutral-600 mb-3 animate-pulse">
          <Clock className="w-8 h-8" />
        </div>
        <div className="font-mono text-sm text-neutral-400">WAITING FOR NEXT INCOMING CALL...</div>
        <div className="text-xs text-neutral-600 mt-1 font-mono">Dialer routing endless victim queue</div>
      </div>
    );
  }

  // Determine avatar color and features from seed
  const avatarColors = [
    'from-amber-600 to-amber-800',
    'from-blue-600 to-indigo-800',
    'from-rose-600 to-red-800',
    'from-emerald-600 to-teal-800',
    'from-purple-600 to-indigo-900',
    'from-sky-500 to-cyan-800',
  ];
  const colorGrad = avatarColors[caller.avatarSeed % avatarColors.length];

  // Suspicion styling
  const isHighSuspicion = caller.suspicion >= 70;
  const isMedSuspicion = caller.suspicion >= 40 && caller.suspicion < 70;

  return (
    <div className={`relative bg-neutral-900/95 border-2 ${isHighSuspicion ? 'border-red-500/70 box-glow-red animate-pulse-fast' : 'border-neutral-700/80'} rounded-xl p-4 shadow-2xl transition-all duration-300`}>
      {/* CRT Scanline overlay */}
      <div className="absolute inset-0 scanlines rounded-xl z-20 pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold">
            CALL IN PROGRESS // LINE #404
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-[11px] text-amber-300">
            VOICE: {caller.voice}
          </span>
          <span className="bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-[11px]">
            AGE: {caller.age}
          </span>
        </div>
      </div>

      {/* Main Caller Avatar + Info Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* 2D Animated Face Canvas / SVG */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-2xl bg-gradient-to-b from-neutral-950 to-neutral-900 border-2 border-neutral-700 p-2 shadow-inner flex items-center justify-center overflow-hidden">
            {/* Audio wave glow */}
            {isCallerTalking && (
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse rounded-2xl" />
            )}

            {/* Custom 2D Vector Avatar */}
            <svg viewBox="0 0 120 120" className="w-full h-full">
              {/* Background silhouette */}
              <circle cx="60" cy="60" r="50" fill="#171717" stroke="#333" strokeWidth="2" />

              {/* Head */}
              <rect
                x="35"
                y="30"
                width="50"
                height="56"
                rx="20"
                className={`fill-amber-200 stroke-amber-900`}
                strokeWidth="2.5"
              />

              {/* Hair styles based on seed */}
              {caller.avatarSeed % 3 === 0 ? (
                // Curly / afro / grandma bun
                <circle cx="60" cy="28" r="16" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
              ) : caller.avatarSeed % 3 === 1 ? (
                // Cap / hair swoop
                <path d="M 30 35 Q 60 16 90 35 L 85 45 Z" fill="#3b82f6" />
              ) : (
                // Bald with side hair
                <path d="M 32 38 Q 30 55 32 60" stroke="#71717a" strokeWidth="5" />
              )}

              {/* Glasses for some */}
              {caller.avatarSeed % 2 === 0 && (
                <g stroke="#111" strokeWidth="2" fill="rgba(255,255,255,0.2)">
                  <rect x="40" y="44" width="16" height="12" rx="3" />
                  <rect x="64" y="44" width="16" height="12" rx="3" />
                  <line x1="56" y1="50" x2="64" y2="50" />
                </g>
              )}

              {/* Eyes */}
              {eyesBlink ? (
                // Closed eyes (blink)
                <g stroke="#18181b" strokeWidth="3" strokeLinecap="round">
                  <line x1="44" y1="50" x2="52" y2="50" />
                  <line x1="68" y1="50" x2="76" y2="50" />
                </g>
              ) : (
                // Open eyes with emotion
                <g fill="#18181b">
                  <ellipse cx="48" cy={isHighSuspicion ? 48 : 50} rx="3.5" ry={isHighSuspicion ? 4.5 : 3.5} />
                  <ellipse cx="72" cy={isHighSuspicion ? 48 : 50} rx="3.5" ry={isHighSuspicion ? 4.5 : 3.5} />
                  {/* Eyebrows */}
                  {isHighSuspicion ? (
                    // V-shaped angry/suspicious eyebrows
                    <g stroke="#18181b" strokeWidth="2">
                      <line x1="42" y1="42" x2="52" y2="45" />
                      <line x1="78" y1="42" x2="68" y2="45" />
                    </g>
                  ) : (
                    // Normal neutral eyebrows
                    <g stroke="#71717a" strokeWidth="1.5">
                      <line x1="43" y1="44" x2="53" y2="44" />
                      <line x1="67" y1="44" x2="77" y2="44" />
                    </g>
                  )}
                </g>
              )}

              {/* Nose */}
              <path d="M 60 52 L 58 60 L 63 60" fill="none" stroke="#ca8a04" strokeWidth="2" />

              {/* Mouth with 4-frame talking animation */}
              {isCallerTalking ? (
                mouthFrame === 0 ? (
                  <ellipse cx="60" cy="72" rx="7" ry="5" fill="#881337" stroke="#1c1917" strokeWidth="2" />
                ) : mouthFrame === 1 ? (
                  <ellipse cx="60" cy="72" rx="9" ry="8" fill="#881337" stroke="#1c1917" strokeWidth="2" />
                ) : mouthFrame === 2 ? (
                  <ellipse cx="60" cy="72" rx="6" ry="3" fill="#881337" stroke="#1c1917" strokeWidth="2" />
                ) : (
                  <ellipse cx="60" cy="73" rx="8" ry="6" fill="#881337" stroke="#1c1917" strokeWidth="2" />
                )
              ) : isHighSuspicion ? (
                // Wavy frown
                <path d="M 52 74 Q 60 68 68 74" fill="none" stroke="#881337" strokeWidth="2.5" />
              ) : (
                // Neutral or gentle smile
                <path d="M 52 72 Q 60 76 68 72" fill="none" stroke="#881337" strokeWidth="2.5" />
              )}

              {/* Telephone headset on head */}
              <path
                d="M 30 50 A 30 30 0 0 1 90 50"
                fill="none"
                stroke="#475569"
                strokeWidth="4"
              />
              <rect x="25" y="45" width="8" height="14" rx="2" fill="#0f172a" />
              <rect x="87" y="45" width="8" height="14" rx="2" fill="#0f172a" />
              {/* Mic boom */}
              <path d="M 30 55 Q 35 75 50 75" fill="none" stroke="#334155" strokeWidth="2" />
              <circle cx="50" cy="75" r="3" fill="#10b981" />
            </svg>

            {/* Speaking Status Tag */}
            <div className="absolute bottom-1 bg-neutral-950/90 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border border-neutral-800">
              {isCallerTalking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400 font-bold">SPEAKING...</span>
                </>
              ) : isPlayerTalking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-cyan-400">LISTENING</span>
                </>
              ) : (
                <span className="text-neutral-400">ON THE LINE</span>
              )}
            </div>
          </div>
        </div>

        {/* Caller Profile & Psychological Meters */}
        <div className="md:col-span-8 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-display font-bold text-neutral-100 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                {caller.nameRevealed ? (
                  <span className="text-emerald-300">✓ {caller.name}</span>
                ) : (
                  <span className="text-amber-400 font-mono text-sm">🔒 [NAME HIDDEN — ASK CALLER]</span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {caller.personality && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-800 text-amber-300 border border-neutral-700">
                    {caller.personality}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {caller.archetype}
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Available Card Balance: <strong className="text-emerald-400 font-pixel text-xs">${caller.card.balance.toLocaleString()}</strong>
            </p>
          </div>

          {/* Suspicion Meter */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="flex items-center gap-1 text-neutral-300">
                <ShieldAlert className={`w-3.5 h-3.5 ${isHighSuspicion ? 'text-red-500 animate-bounce' : 'text-amber-400'}`} />
                Caller Suspicion
              </span>
              <span className={`font-bold ${isHighSuspicion ? 'text-red-400 text-glow-red' : isMedSuspicion ? 'text-amber-400' : 'text-emerald-400'}`}>
                {caller.suspicion}% {isHighSuspicion && '⚠️ HIGH RISK OF HANGUP!'}
              </span>
            </div>
            <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-700/60 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isHighSuspicion
                    ? 'bg-gradient-to-r from-amber-500 to-red-600'
                    : isMedSuspicion
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${caller.suspicion}%` }}
              />
            </div>
          </div>

          {/* Gullibility Meter */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="flex items-center gap-1 text-neutral-300">
                <HeartHandshake className="w-3.5 h-3.5 text-cyan-400" />
                Gullibility (Trust)
              </span>
              <span className="text-cyan-400 font-bold font-mono">
                {caller.gullibility}%
              </span>
            </div>
            <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-700/60 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${caller.gullibility}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Voice Waveform Visualizer */}
      <div className="mt-3 bg-neutral-950/80 border border-neutral-800 rounded-lg p-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>AUDIO STREAM:</span>
        </div>

        {/* 18 Animated Equalizer Bars */}
        <div className="flex items-center gap-1 h-5 flex-1 max-w-xs mx-auto">
          {Array.from({ length: 20 }).map((_, idx) => {
            const height = isCallerTalking
              ? Math.max(15, Math.floor(Math.sin((idx + Date.now() / 150) * 0.8) * 45 + 50))
              : isPlayerTalking
              ? Math.max(15, Math.floor(Math.cos((idx + Date.now() / 120) * 0.9) * 40 + 45))
              : 8;

            return (
              <div
                key={idx}
                className={`w-1 rounded-sm transition-all duration-75 ${
                  isCallerTalking
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                    : isPlayerTalking
                    ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]'
                    : 'bg-neutral-800'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        <button
          onClick={onReplayTTS}
          title="Replay Voice TTS"
          className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono rounded border border-neutral-700 cursor-pointer transition-colors"
        >
          <Volume2 className="w-3 h-3 text-emerald-400" />
          <span>REPLAY VOICE</span>
        </button>
      </div>

      {/* Subtitles / Speech Bubble */}
      <div className="mt-3 bg-neutral-950 border border-emerald-500/30 rounded-lg p-3 text-neutral-200 font-mono text-sm leading-relaxed relative">
        <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{caller.name}:</span>
        </div>
        <p className="text-emerald-300/90 italic font-mono text-xs md:text-sm">
          "{latestMessage || caller.hook}"
        </p>
      </div>
    </div>
  );
};
