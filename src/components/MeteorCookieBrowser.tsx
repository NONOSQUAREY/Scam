import React, { useState } from 'react';
import { ShoppingCart, Server, Cpu, ShieldAlert, Zap, Globe, Check } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface MeteorCookieBrowserProps {
  personalMoney: number;
  onPurchaseUpgrade: (cost: number, upgradeId: string) => boolean;
}

export const MeteorCookieBrowser: React.FC<MeteorCookieBrowserProps> = ({
  personalMoney,
  onPurchaseUpgrade,
}) => {
  const [url, setUrl] = useState('darknet://bazaar.scamnet.corp/hardware');
  const [purchased, setPurchased] = useState<string[]>([]);

  const items = [
    {
      id: 'fast_autodialer',
      title: 'T-1 High-Speed VoIP Dial Trunk',
      desc: 'Reduces caller connect waiting times by 60% and increases incoming caller gullibility.',
      cost: 750,
      icon: <Server className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'avs_bypass',
      title: 'Apex POS Merchant Terminal Bypass Tool',
      desc: 'Simulates instant AVS zip code match on out-of-state caller credit cards.',
      cost: 1200,
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'voice_modulator',
      title: 'DSP Studio Voice Synthesizer Rack',
      desc: 'Enhances TTS realism and caller trust stability during CVV requests.',
      cost: 1800,
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'spoof_proxy',
      title: 'BGP Caller-ID Local Routing Proxy',
      desc: 'Displays local municipal area code on caller landline phones to cut suspicion by 30%.',
      cost: 2500,
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
    },
  ];

  const handleBuy = (item: typeof items[0]) => {
    if (purchased.includes(item.id)) return;
    const ok = onPurchaseUpgrade(item.cost, item.id);
    if (ok) {
      setPurchased((p) => [...p, item.id]);
      soundManager.playChaChing();
    } else {
      soundManager.playKeyTone(1);
    }
  };

  return (
    <div className="flex-1 bg-neutral-950 flex flex-col font-sans select-none h-full overflow-hidden">
      {/* Browser URL Bar */}
      <div className="bg-neutral-900 px-3 py-1.5 border-b border-neutral-800 flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 text-neutral-500">
          <Globe className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-[11px] font-mono text-neutral-300 focus:outline-none"
        />
        <div className="text-[11px] font-mono text-emerald-400 font-bold shrink-0">
          Balance: ${personalMoney.toLocaleString()}
        </div>
      </div>

      {/* Store Catalog */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        <div className="text-[11px] font-mono text-neutral-400 pb-1 border-b border-neutral-800 flex justify-between">
          <span>DARKNET OPERATOR HARDWARE CATALOG</span>
          <span className="text-amber-400">ENCRYPTED CLEARINGHOUSE</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {items.map((it) => {
            const isBought = purchased.includes(it.id);
            const canAfford = personalMoney >= it.cost;

            return (
              <div
                key={it.id}
                className="bg-neutral-900 border border-neutral-800 rounded p-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                    {it.icon}
                  </div>
                  <div>
                    <div className="font-bold text-neutral-200">{it.title}</div>
                    <div className="text-[10px] text-neutral-400 max-w-sm">{it.desc}</div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <div className="font-mono font-bold text-emerald-400 mb-1">
                    ${it.cost.toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleBuy(it)}
                    disabled={isBought || !canAfford}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      isBought
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {isBought ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>INSTALLED</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3 h-3" />
                        <span>BUY</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
