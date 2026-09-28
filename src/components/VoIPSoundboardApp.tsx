import React, { useState } from 'react';
import { Volume2, Siren, Bell, Radio, Disc, Sparkles, Building2, Landmark, Baby, Keyboard, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface VoIPSoundboardAppProps {
  onModifySuspicion?: (delta: number) => void;
}

export const VoIPSoundboardApp: React.FC<VoIPSoundboardAppProps> = ({ onModifySuspicion }) => {
  const [activeSound, setActiveSound] = useState<string | null>(null);

  const triggerSound = (id: string, sfxFn: () => void, suspicionDelta: number = 0) => {
    setActiveSound(id);
    sfxFn();

    if (suspicionDelta !== 0 && onModifySuspicion) {
      onModifySuspicion(suspicionDelta);
    }

    setTimeout(() => {
      setActiveSound((curr) => (curr === id ? null : curr));
    }, 1200);
  };

  const soundTracks = [
    {
      id: 'bank',
      title: '🏦 Bank Cash Counter',
      desc: 'Simulates official currency sorting. Lowers suspicion (-10%)',
      color: 'border-emerald-600/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60',
      action: () => triggerSound('bank', () => soundManager.playPrinterChirp(), -10),
    },
    {
      id: 'office',
      title: '🏢 Call Center Chatter',
      desc: 'Busy background office ambience. Lowers suspicion (-15%)',
      color: 'border-blue-600/60 bg-blue-950/40 text-blue-300 hover:bg-blue-900/60',
      action: () => triggerSound('office', () => soundManager.playKeyTone(5), -15),
    },
    {
      id: 'siren',
      title: '🚨 Police Siren Alert',
      desc: 'Intimidates caller with sirens. Spikes panic (+20%)',
      color: 'border-rose-600/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60',
      action: () => triggerSound('siren', () => soundManager.playPoliceSiren(), 20),
    },
    {
      id: 'keyboard',
      title: '⌨️ Hacker Fast Typing',
      desc: 'Rapid terminal keystrokes. Sounds like deep diagnostics.',
      color: 'border-cyan-600/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60',
      action: () => triggerSound('keyboard', () => {
        for (let i = 0; i < 8; i++) {
          setTimeout(() => soundManager.playTypewriterClick(), i * 60);
        }
      }, -5),
    },
    {
      id: 'modem',
      title: '📟 56k Dialup Screech',
      desc: 'Blame technical gateway lag on slow server handshake.',
      color: 'border-amber-600/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60',
      action: () => triggerSound('modem', () => soundManager.playModemDialup(), 0),
    },
    {
      id: 'slam',
      title: '💥 Boss Desk Slam',
      desc: 'Heavy wooden desk impact. Supervisor demands payment!',
      color: 'border-orange-600/60 bg-orange-950/40 text-orange-300 hover:bg-orange-900/60',
      action: () => triggerSound('slam', () => soundManager.playDeskSlam(), 10),
    },
    {
      id: 'airhorn',
      title: '📢 Tactical Airhorn',
      desc: 'Loud celebratory blast or pure sensory overload.',
      color: 'border-yellow-600/60 bg-yellow-950/40 text-yellow-300 hover:bg-yellow-900/60',
      action: () => triggerSound('airhorn', () => soundManager.playAirhorn(), 5),
    },
    {
      id: 'chaching',
      title: '🔔 Cash Register Bell',
      desc: 'Cha-ching! The sweetest sound on the call center floor.',
      color: 'border-teal-600/60 bg-teal-950/40 text-teal-300 hover:bg-teal-900/60',
      action: () => triggerSound('chaching', () => soundManager.playChaChing(), 0),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d1a] text-neutral-200 select-none p-4 font-mono overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-600 flex items-center justify-center text-cyan-400 shadow-md">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-cyan-400 tracking-wider">VOIP SOUNDBOARD RACK</h2>
            <p className="text-[10px] text-neutral-400">Tactical Acoustic FX & Social Engineering Tools</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-bold text-neutral-400">AUDIO OUT: LINE 1</span>
        </div>
      </div>

      {/* Visual Audio Waveform */}
      <div className="bg-black/60 border border-neutral-800 rounded-xl p-2.5 mb-3 flex items-center justify-center gap-1.5 h-12">
        {[20, 45, 80, 30, 95, 60, 40, 75, 100, 35, 70, 90, 50, 85, 40, 65, 30].map((h, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-150 ${
              activeSound ? 'bg-cyan-400 animate-pulse' : 'bg-neutral-800'
            }`}
            style={{ height: activeSound ? `${Math.max(6, Math.floor(h * Math.random()))}px` : '6px' }}
          />
        ))}
      </div>

      {/* Sound Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
        {soundTracks.map((track) => (
          <button
            key={track.id}
            onClick={track.action}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all shadow-md active:scale-95 ${
              track.color
            } ${activeSound === track.id ? 'ring-2 ring-white scale-[1.02]' : ''}`}
          >
            <div className="font-bold text-xs mb-0.5">{track.title}</div>
            <div className="text-[10px] opacity-80 font-sans leading-tight">{track.desc}</div>
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-3 text-[10px] text-neutral-500 text-center font-mono">
        Acoustic effects stream directly through the VoIP microphone channel.
      </div>
    </div>
  );
};
