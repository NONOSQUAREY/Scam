import React from 'react';
import { Volume2, Siren, Bell, Radio, Disc, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SoundboardProps {
  onSoundTriggered?: (sound: string) => void;
}

export const Soundboard: React.FC<SoundboardProps> = ({ onSoundTriggered }) => {
  const playSound = (type: string) => {
    switch (type) {
      case 'airhorn':
        soundManager.playAirhorn();
        break;
      case 'siren':
        soundManager.playPoliceSiren();
        break;
      case 'cash':
        soundManager.playChaChing();
        break;
      case 'ring':
        soundManager.playPhoneRing();
        break;
      case 'pickup':
        soundManager.playPhonePickup();
        break;
      case 'printer':
        soundManager.playPrinterChirp();
        break;
      default:
        soundManager.playKeyTone(4);
    }
    if (onSoundTriggered) onSoundTriggered(type);
  };

  const sounds = [
    { id: 'airhorn', label: 'AIR HORN', icon: Volume2, color: 'text-amber-400' },
    { id: 'siren', label: 'POLICE SIREN', icon: Siren, color: 'text-red-400' },
    { id: 'cash', label: 'CHA-CHING', icon: Sparkles, color: 'text-emerald-400' },
    { id: 'ring', label: 'PHONE RING', icon: Bell, color: 'text-cyan-400' },
    { id: 'printer', label: 'RECEIPT PRINTER', icon: Disc, color: 'text-purple-400' },
    { id: 'pickup', label: 'HANGUP CLICK', icon: Radio, color: 'text-neutral-400' },
  ];

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-pixel text-[10px] text-neutral-400 flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-amber-400" />
          DESK SOUNDBOARD
        </span>
        <span className="text-[9px] font-mono text-neutral-500">TACTILE FX</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {sounds.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => playSound(s.id)}
              className="px-2 py-1.5 bg-neutral-950 hover:bg-neutral-800 active:bg-neutral-700 border border-neutral-800 hover:border-neutral-600 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center group"
            >
              <Icon className={`w-3.5 h-3.5 ${s.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[9px] font-mono text-neutral-300 truncate w-full">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
