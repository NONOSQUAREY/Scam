import React, { useState } from 'react';
import { ShoppingBag, Calculator, ShieldAlert, Landmark, CreditCard, Camera, Server, Cpu, Zap, Check, Lock, Sparkles, HeartHandshake, Monitor } from 'lucide-react';
import { soundManager } from '../utils/audio';

export interface UnlockedApps {
  creditCard: boolean; // Always true from start
  assessment: boolean; // Assessment app (always unlocked)
  anyViewer: boolean; // AnyViewer Remote Desktop (Simulated Victim PC)
  refundCalc: boolean; // Overpayment Matrix
  malwareScanner: boolean; // SysClean Scanner
  wireTransfer: boolean; // SwiftACH Gateway
  giftCards: boolean; // Gift Card Terminal
  camera: boolean; // Cubicle Cam
  sysKeyLock: boolean; // SysKey Federal Screen Locker
  voipSoundboard: boolean; // Tactical Soundboard Rack
  cryptoVault: boolean; // Crypto Safe Locker ATM
}

interface StoreAppProps {
  personalMoney: number;
  unlockedApps: UnlockedApps;
  installedUpgrades: string[];
  onUnlockApp: (appKey: keyof UnlockedApps, cost: number) => boolean;
  onBuyHardwareUpgrade: (upgradeId: string, cost: number) => boolean;
  onOpenApp?: (appKey: keyof UnlockedApps) => void;
}

export const StoreApp: React.FC<StoreAppProps> = ({
  personalMoney,
  unlockedApps,
  installedUpgrades,
  onUnlockApp,
  onBuyHardwareUpgrade,
  onOpenApp,
}) => {
  const [activeTab, setActiveTab] = useState<'apps' | 'hardware'>('apps');

  // Apps to buy and unlock
  const appItems: {
    key: keyof UnlockedApps;
    name: string;
    description: string;
    cost: number;
    icon: React.ReactNode;
    color: string;
    bgGlow: string;
  }[] = [
    {
      key: 'anyViewer',
      name: 'AnyViewer Remote Desktop v4.8',
      description: 'Gain direct live access to the victim’s simulated PC! Explore their folders, banking logins, routing numbers, and cute dog photos.',
      cost: 200,
      icon: <Monitor className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/40 text-sky-400',
      bgGlow: 'bg-sky-950/30',
    },
    {
      key: 'refundCalc',
      name: 'Overpayment Matrix v3.2',
      description: 'The legendary "accidental extra zero" refund multiplier. Creates instant caller panic & generates $2,000+ debt recovery fees.',
      cost: 450,
      icon: <Calculator className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 text-amber-400',
      bgGlow: 'bg-amber-950/30',
    },
    {
      key: 'wireTransfer',
      name: 'SwiftACH Wire Transfer Gateway',
      description: 'Direct Federal Reserve electronic routing portal. Siphon checking balances directly with official banking escrow certificates.',
      cost: 650,
      icon: <Landmark className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/40 text-blue-400',
      bgGlow: 'bg-blue-950/30',
    },
    {
      key: 'malwareScanner',
      name: 'SysClean Remote Defender v9.1',
      description: 'Simulates alarming kernel scans on victim PCs, detects 40+ fake trojans in System32, and bills mandatory commercial security fees.',
      cost: 500,
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/40 text-rose-400',
      bgGlow: 'bg-rose-950/30',
    },
    {
      key: 'giftCards',
      name: 'Retail Voucher & Gift Cards Terminal',
      description: 'Unlock secondary revenue stream with Target, Apple, Best Buy, and Steam gift card code entry and instant redemption.',
      cost: 750,
      icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 text-emerald-400',
      bgGlow: 'bg-emerald-950/30',
    },
    {
      key: 'camera',
      name: 'Operator Cubicle CCTV Cam',
      description: 'Stream live surveillance feedback from Cubicle #09, monitor supervisor inspection routes, and stay alert.',
      cost: 250,
      icon: <Camera className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/40 text-purple-400',
      bgGlow: 'bg-purple-950/30',
    },
    {
      key: 'sysKeyLock',
      name: 'SysKey Lockdown v9.0 Enterprise Locker',
      description: 'Classic scammer federal screen locker. Enforce RSA-4096 registry lockouts & collect $450-$1,200 administrative decryption fees.',
      cost: 350,
      icon: <Lock className="w-5 h-5 text-rose-500" />,
      color: 'border-rose-500/40 text-rose-400',
      bgGlow: 'bg-rose-950/30',
    },
    {
      key: 'voipSoundboard',
      name: 'VoIP Tactical Soundboard Rack',
      description: 'Acoustic social engineering rack: bank currency counters, office murmurs, and police sirens to manipulate caller trust.',
      cost: 200,
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/40 text-cyan-400',
      bgGlow: 'bg-cyan-950/30',
    },
    {
      key: 'cryptoVault',
      name: 'Federal Reserve Crypto Safe Locker ATM',
      description: 'Digital asset escrow converter. Direct callers to deposit their checking savings into government-backed BTC cold storage.',
      cost: 550,
      icon: <Landmark className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 text-amber-400',
      bgGlow: 'bg-amber-950/30',
    },
  ];

  // Hardware / System upgrades
  const hardwareItems = [
    {
      id: 'fast_autodialer',
      title: 'T-1 High-Speed VoIP Dial Trunk',
      desc: 'Reduces caller connect waiting times and boosts starting gullibility of callers by +15%.',
      cost: 600,
      icon: <Server className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'avs_bypass',
      title: 'Apex POS Merchant AVS Bypass Tool',
      desc: 'Simulates automatic postal code verification on out-of-state cards to prevent card decline errors.',
      cost: 950,
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'voice_modulator',
      title: 'DSP Studio Voice Synthesizer Rack',
      desc: 'Adds studio-grade voice clarity and acoustic dampening, stabilizing trust when asking for CVVs.',
      cost: 1200,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'super_soothe',
      title: 'Psychological Soothe Script v2.4',
      desc: 'Calms callers with clinical reassurance; increases the Soothe button power to -25% suspicion!',
      cost: 350,
      icon: <HeartHandshake className="w-5 h-5 text-pink-400" />,
    },
  ];

  const handleBuyApp = (appKey: keyof UnlockedApps, cost: number) => {
    if (unlockedApps[appKey]) {
      if (onOpenApp) onOpenApp(appKey);
      return;
    }
    const success = onUnlockApp(appKey, cost);
    if (success) {
      soundManager.playChaChing();
    } else {
      soundManager.playKeyTone(1);
    }
  };

  const handleBuyHardware = (id: string, cost: number) => {
    if (installedUpgrades.includes(id)) return;
    const success = onBuyHardwareUpgrade(id, cost);
    if (success) {
      soundManager.playChaChing();
    } else {
      soundManager.playKeyTone(1);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0c10] text-neutral-200 font-sans select-none overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-mono tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>CYBER-STORE & APP UPGRADES</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                v3.0
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 font-sans">
              Purchase new specialized apps to help extract funds & upgrade your cubicle.
            </div>
          </div>
        </div>

        {/* Operator Cash Badge */}
        <div className="bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 flex items-center gap-2">
          <span className="text-[10px] font-mono text-neutral-400">YOUR WALLET:</span>
          <span className="text-sm font-mono font-bold text-emerald-400">
            ${personalMoney.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 bg-neutral-950/80 px-3 pt-2 shrink-0 gap-2">
        <button
          onClick={() => setActiveTab('apps')}
          className={`px-4 py-1.5 rounded-t-lg font-mono text-xs font-bold transition-colors cursor-pointer border-t border-x ${
            activeTab === 'apps'
              ? 'bg-neutral-900 text-cyan-300 border-neutral-700'
              : 'text-neutral-500 hover:text-neutral-300 border-transparent'
          }`}
        >
          APP LICENSES ({appItems.filter((a) => unlockedApps[a.key]).length}/{appItems.length})
        </button>
        <button
          onClick={() => setActiveTab('hardware')}
          className={`px-4 py-1.5 rounded-t-lg font-mono text-xs font-bold transition-colors cursor-pointer border-t border-x ${
            activeTab === 'hardware'
              ? 'bg-neutral-900 text-amber-300 border-neutral-700'
              : 'text-neutral-500 hover:text-neutral-300 border-transparent'
          }`}
        >
          TECH UPGRADES ({installedUpgrades.length}/{hardwareItems.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'apps' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {appItems.map((item) => {
              const isUnlocked = unlockedApps[item.key];
              const canAfford = personalMoney >= item.cost;

              return (
                <div
                  key={item.key}
                  className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-neutral-900/60 border-emerald-600/40 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg border ${item.color} ${item.bgGlow}`}>
                          {item.icon}
                        </div>
                        <span className="font-bold text-xs text-neutral-100">{item.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isUnlocked
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {isUnlocked ? 'INSTALLED' : `$${item.cost.toLocaleString()}`}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-neutral-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500">
                      {isUnlocked ? 'License Active' : canAfford ? 'Ready to install' : 'Insufficient funds'}
                    </span>

                    <button
                      onClick={() => handleBuyApp(item.key, item.cost)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isUnlocked
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-emerald-600/40'
                          : canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black shadow-md'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                      }`}
                    >
                      {isUnlocked ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>LAUNCH APP</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>BUY (${item.cost})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hardwareItems.map((item) => {
              const isInstalled = installedUpgrades.includes(item.id);
              const canAfford = personalMoney >= item.cost;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                    isInstalled
                      ? 'bg-neutral-900/60 border-amber-600/40'
                      : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                          {item.icon}
                        </div>
                        <span className="font-bold text-xs text-neutral-100">{item.title}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isInstalled
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {isInstalled ? 'ACTIVE' : `$${item.cost.toLocaleString()}`}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-neutral-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500">
                      {isInstalled ? 'Hardware active' : canAfford ? 'Compatible' : 'Need more commission'}
                    </span>

                    <button
                      onClick={() => handleBuyHardware(item.id, item.cost)}
                      disabled={isInstalled || !canAfford}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                        isInstalled
                          ? 'bg-neutral-800 text-amber-300 border border-amber-600/40 cursor-default'
                          : canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black shadow-md cursor-pointer'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                      }`}
                    >
                      {isInstalled ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> INSTALLED
                        </span>
                      ) : (
                        `INSTALL ($${item.cost})`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
