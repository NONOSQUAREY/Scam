import React, { useState, useEffect } from 'react';
import { Power, CreditCard, Brain, Phone, Camera, ShoppingBag, Lock, Shield, Calculator, Landmark, ShieldAlert, PhoneCall, Monitor, Video, ShieldCheck, Mic, X } from 'lucide-react';
import { UnlockedApps } from './StoreApp';

export interface ActiveWindowsState {
  creditCard: boolean;
  phone: boolean;
  store: boolean;
  identity: boolean;
  assessment: boolean;
  anyViewer: boolean;
  refundCalc: boolean;
  wireTransfer: boolean;
  malwareScanner: boolean;
  giftCards: boolean;
  camera: boolean;
  sysKeyLock: boolean;
  voipSoundboard: boolean;
  cryptoVault: boolean;
}

interface DesktopTaskbarProps {
  personalMoney: number;
  teamMoney: number;
  quota: number;
  unlockedApps: UnlockedApps;
  activeWindows: ActiveWindowsState;
  onToggleWindow: (windowName: keyof ActiveWindowsState) => void;
  onOpenStore: () => void;
  reviewTimerSeconds: number;
  onOpenReview: () => void;
  shiftDay: number;
  isCallActive: boolean;
  onStartCall: () => void;
}

export const DesktopTaskbar: React.FC<DesktopTaskbarProps> = ({
  personalMoney,
  teamMoney,
  quota,
  unlockedApps,
  activeWindows,
  onToggleWindow,
  onOpenStore,
  reviewTimerSeconds,
  onOpenReview,
  shiftDay,
  isCallActive,
  onStartCall,
}) => {
  const [timeStr, setTimeStr] = useState('9:41 PM');
  const [dateStr, setDateStr] = useState('Tue, Sep 15, 2026');
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatReviewTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isQuotaMet = teamMoney >= quota;

  return (
    <footer className="fixed bottom-0 inset-x-0 h-12 bg-[#0c0f14]/95 border-t border-neutral-800/80 backdrop-blur-md z-40 px-3 flex items-center justify-between select-none text-neutral-200">
      {/* Left: Start / Power + Pinned & Running Apps */}
      <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto py-1">
        {/* Power / Store Menu */}
        <button
          onClick={onOpenStore}
          title="Cyber-Store & App Upgrades"
          className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-emerald-400 cursor-pointer transition-colors shrink-0"
        >
          <Power className="w-4 h-4" />
        </button>

        {/* DIAL CALL Action Button if line is on hook */}
        {!isCallActive && (
          <button
            onClick={onStartCall}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black font-mono text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/60 cursor-pointer animate-pulse shrink-0"
            title="Dial next lead in phone queue"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>DIAL CALL</span>
          </button>
        )}

        <div className="h-5 w-[1px] bg-neutral-800 mx-0.5 shrink-0" />

        {/* 1. Credit Card Terminal App */}
        <button
          onClick={() => onToggleWindow('creditCard')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
            activeWindows.creditCard ? 'bg-neutral-800/90 border-b-2 border-emerald-500' : 'hover:bg-neutral-800/60 text-neutral-400'
          }`}
          title="Credit Card Terminal"
        >
          <div className="w-5 h-5 bg-emerald-700 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
            <CreditCard className="w-3 h-3" />
          </div>
          <span className="hidden sm:inline text-xs font-medium text-emerald-300">Card Terminal</span>
        </button>

        {/* 2. Assessment App */}
        <button
          onClick={() => onToggleWindow('assessment')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
            activeWindows.assessment ? 'bg-neutral-800/90 border-b-2 border-purple-500' : 'hover:bg-neutral-800/60 text-neutral-400'
          }`}
          title="Target Psychological Assessment"
        >
          <div className="w-5 h-5 bg-purple-700 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
            <Brain className="w-3 h-3" />
          </div>
          <span className="hidden sm:inline text-xs font-medium text-purple-300">Assessment</span>
        </button>

        {/* AnyViewer Remote Desktop (Fake PC) */}
        {unlockedApps.anyViewer ? (
          <button
            onClick={() => onToggleWindow('anyViewer')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
              activeWindows.anyViewer ? 'bg-neutral-800/90 border-b-2 border-sky-400' : 'hover:bg-neutral-800/60 text-neutral-400'
            }`}
            title="AnyViewer Remote Desktop (Victim PC)"
          >
            <div className="w-5 h-5 bg-sky-600 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
              <Monitor className="w-3 h-3" />
            </div>
            <span className="hidden sm:inline text-xs font-medium text-sky-300">AnyViewer</span>
          </button>
        ) : (
          <button
            onClick={onOpenStore}
            className="px-2 py-1.5 rounded flex items-center gap-1 text-xs font-sans text-neutral-500 hover:text-neutral-300 cursor-pointer opacity-60 hover:opacity-100 shrink-0"
            title="AnyViewer Remote Desktop (Locked - Buy in Store for $200)"
          >
            <Lock className="w-3 h-3 text-neutral-500" />
            <span className="hidden lg:inline text-[11px]">AnyViewer 🔒</span>
          </button>
        )}

        {/* 3. Phone */}
        <button
          onClick={() => onToggleWindow('phone')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
            activeWindows.phone ? 'bg-neutral-800/90 border-b-2 border-blue-500' : 'hover:bg-neutral-800/60 text-neutral-400'
          }`}
          title="Phone Support Line"
        >
          <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
            <Phone className="w-3 h-3 fill-current" />
          </div>
          <span className="hidden sm:inline text-xs font-medium">Phone</span>
        </button>

        {/* 4. Overpayment Matrix */}
        {unlockedApps.refundCalc ? (
          <button
            onClick={() => onToggleWindow('refundCalc')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
              activeWindows.refundCalc ? 'bg-neutral-800/90 border-b-2 border-amber-500' : 'hover:bg-neutral-800/60 text-neutral-400'
            }`}
            title="Overpayment Matrix (Extra Zero Refund)"
          >
            <div className="w-5 h-5 bg-amber-600 rounded-md flex items-center justify-center text-slate-950 text-[10px] font-bold shadow-sm">
              <Calculator className="w-3 h-3" />
            </div>
            <span className="hidden md:inline text-xs font-medium text-amber-300">Overpay Matrix</span>
          </button>
        ) : (
          <button
            onClick={onOpenStore}
            className="px-2 py-1.5 rounded flex items-center gap-1 text-xs font-sans text-neutral-500 hover:text-neutral-300 cursor-pointer opacity-60 hover:opacity-100 shrink-0"
            title="Overpayment Matrix (Locked - Buy in Store)"
          >
            <Lock className="w-3 h-3 text-neutral-500" />
            <span className="hidden lg:inline text-[11px]">Overpayment 🔒</span>
          </button>
        )}

        {/* 5. SwiftACH Wire Transfer Gateway */}
        {unlockedApps.wireTransfer ? (
          <button
            onClick={() => onToggleWindow('wireTransfer')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
              activeWindows.wireTransfer ? 'bg-neutral-800/90 border-b-2 border-blue-500' : 'hover:bg-neutral-800/60 text-neutral-400'
            }`}
            title="SwiftACH Wire Transfer Gateway"
          >
            <div className="w-5 h-5 bg-blue-700 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
              <Landmark className="w-3 h-3" />
            </div>
            <span className="hidden md:inline text-xs font-medium text-blue-300">SwiftACH Wire</span>
          </button>
        ) : (
          <button
            onClick={onOpenStore}
            className="px-2 py-1.5 rounded flex items-center gap-1 text-xs font-sans text-neutral-500 hover:text-neutral-300 cursor-pointer opacity-60 hover:opacity-100 shrink-0"
            title="SwiftACH Wire (Locked - Buy in Store)"
          >
            <Lock className="w-3 h-3 text-neutral-500" />
            <span className="hidden lg:inline text-[11px]">Wire 🔒</span>
          </button>
        )}

        {/* 6. SysClean Anti-Malware Scanner */}
        {unlockedApps.malwareScanner ? (
          <button
            onClick={() => onToggleWindow('malwareScanner')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
              activeWindows.malwareScanner ? 'bg-neutral-800/90 border-b-2 border-rose-500' : 'hover:bg-neutral-800/60 text-neutral-400'
            }`}
            title="SysClean Anti-Malware Scanner"
          >
            <div className="w-5 h-5 bg-rose-700 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
              <ShieldAlert className="w-3 h-3" />
            </div>
            <span className="hidden md:inline text-xs font-medium text-rose-300">SysClean</span>
          </button>
        ) : (
          <button
            onClick={onOpenStore}
            className="px-2 py-1.5 rounded flex items-center gap-1 text-xs font-sans text-neutral-500 hover:text-neutral-300 cursor-pointer opacity-60 hover:opacity-100 shrink-0"
            title="SysClean (Locked - Buy in Store)"
          >
            <Lock className="w-3 h-3 text-neutral-500" />
            <span className="hidden lg:inline text-[11px]">SysClean 🔒</span>
          </button>
        )}

        {/* 7. Store App */}
        <button
          onClick={() => onToggleWindow('store')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
            activeWindows.store ? 'bg-neutral-800/90 border-b-2 border-cyan-500' : 'hover:bg-neutral-800/60 text-cyan-300'
          }`}
          title="Cyber-Store & Upgrades"
        >
          <div className="w-5 h-5 bg-cyan-700 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
            <ShoppingBag className="w-3 h-3" />
          </div>
          <span className="hidden sm:inline text-xs font-bold text-cyan-300">Store</span>
        </button>

        {/* 8. Identity SSN Stealer */}
        <button
          onClick={() => onToggleWindow('identity')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
            activeWindows.identity ? 'bg-neutral-800/90 border-b-2 border-red-600' : 'hover:bg-neutral-800/60 text-neutral-400'
          }`}
          title="Social Security Stealer"
        >
          <div className="w-5 h-5 bg-[#782328] rounded-md flex items-center justify-center text-amber-300 text-[10px] shadow-sm">
            <Shield className="w-3 h-3 fill-current" />
          </div>
          <span className="hidden md:inline text-xs font-medium text-red-300">Identity SSN</span>
        </button>

        {/* 9. SysKey Lockdown */}
        {unlockedApps.sysKeyLock && (
          <button
            onClick={() => onToggleWindow('sysKeyLock')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
              activeWindows.sysKeyLock ? 'bg-neutral-800/90 border-b-2 border-rose-500' : 'hover:bg-neutral-800/60 text-neutral-400'
            }`}
            title="SysKey Federal Screen Locker"
          >
            <div className="w-5 h-5 bg-rose-800 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
              <Lock className="w-3 h-3" />
            </div>
            <span className="hidden md:inline text-xs font-medium text-rose-300">SysKey</span>
          </button>
        )}

        {/* 10. VoIP Soundboard */}
        {unlockedApps.voipSoundboard && (
          <button
            onClick={() => onToggleWindow('voipSoundboard')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
              activeWindows.voipSoundboard ? 'bg-neutral-800/90 border-b-2 border-cyan-400' : 'hover:bg-neutral-800/60 text-neutral-400'
            }`}
            title="VoIP Tactical Soundboard Rack"
          >
            <div className="w-5 h-5 bg-cyan-800 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
              <Mic className="w-3 h-3" />
            </div>
            <span className="hidden md:inline text-xs font-medium text-cyan-300">Soundboard</span>
          </button>
        )}

        {/* 11. Crypto Safe Vault ATM */}
        {unlockedApps.cryptoVault && (
          <button
            onClick={() => onToggleWindow('cryptoVault')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-sans cursor-pointer transition-colors shrink-0 ${
              activeWindows.cryptoVault ? 'bg-neutral-800/90 border-b-2 border-amber-400' : 'hover:bg-neutral-800/60 text-neutral-400'
            }`}
            title="Federal Reserve Crypto Safe Locker ATM"
          >
            <div className="w-5 h-5 bg-amber-700 rounded-md flex items-center justify-center text-white text-[10px] shadow-sm">
              <Landmark className="w-3 h-3" />
            </div>
            <span className="hidden md:inline text-xs font-medium text-amber-300">Crypto Vault</span>
          </button>
        )}
      </div>

      {/* Right: Commission & Shift Status Pill + Permissions + Clock */}
      <div className="flex items-center gap-2 md:gap-2.5 shrink-0 pl-2 relative">
        {/* Hardware & Surveillance Permissions Button */}
        <button
          onClick={() => setShowPermissions(!showPermissions)}
          className={`px-2 py-1 rounded-lg border font-mono text-[10px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm ${
            showPermissions
              ? 'bg-neutral-800 border-red-500 text-neutral-100'
              : 'bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-neutral-300'
          }`}
          title="System Permissions: Camera, Microphone, Screen Record"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-bold text-red-400">REC</span>
          <span className="hidden sm:inline text-neutral-400">PERMS</span>
        </button>

        {/* Permissions Popover Window */}
        {showPermissions && (
          <div className="absolute bottom-14 right-2 sm:right-auto sm:left-auto w-72 bg-[#0c1017] border-2 border-neutral-700 rounded-xl shadow-2xl p-3 text-xs font-mono z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5 text-neutral-200 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>CYBER-OS PERMISSIONS</span>
              </div>
              <button
                onClick={() => setShowPermissions(false)}
                className="w-5 h-5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Camera */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 text-[11px]">
                <div className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-neutral-300">Camera</span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  GRANTED
                </span>
              </div>

              {/* Microphone */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 text-[11px]">
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-neutral-300">Microphone</span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  GRANTED
                </span>
              </div>

              {/* Screen Record */}
              <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/80 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-neutral-200 font-bold">Screen Record</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-600 font-bold text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    <span>ACTIVE</span>
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  Captures operator shift surveillance footage so Boss Vikram can review the recorded video tapes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shift Quota Status Button */}
        <button
          onClick={onOpenReview}
          className={`px-3 py-1 rounded-xl border font-mono text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
            isQuotaMet
              ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 hover:bg-emerald-900 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
          }`}
          title="Click to view Shift Performance Review (Boss Vikram Review)"
        >
          <div className="flex items-center gap-1">
            <span className="font-bold text-amber-400">DAY #{shiftDay}</span>
            <span className="text-neutral-500">|</span>
            <span className={isQuotaMet ? 'text-emerald-400 font-bold' : 'text-neutral-200'}>
              ${teamMoney.toLocaleString()} / ${quota.toLocaleString()}
            </span>
          </div>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              isQuotaMet
                ? 'bg-emerald-500 text-neutral-950'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {isQuotaMet ? 'PASS' : formatReviewTimer(reviewTimerSeconds)}
          </span>
        </button>

        {/* Clock & Date */}
        <div className="hidden lg:flex flex-col items-end text-right font-mono text-[10px] text-neutral-400 border-l border-neutral-800 pl-2.5">
          <span className="text-neutral-200 font-bold">{timeStr}</span>
          <span className="text-[9px] text-neutral-500">{dateStr}</span>
        </div>
      </div>
    </footer>
  );
};
