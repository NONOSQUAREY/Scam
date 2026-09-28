import React, { useState, useEffect } from 'react';
import { Caller, FakePCFolder, FakePCFile } from '../types/game';
import { generateFakePCData } from '../utils/fakePCHelper';
import { soundManager } from '../utils/audio';
import {
  Monitor,
  Folder,
  FileText,
  Image as ImageIcon,
  Key,
  Landmark,
  Trash2,
  Copy,
  Check,
  X,
  CreditCard,
  Maximize2,
  Minimize2,
  RefreshCw,
  Heart,
  Globe,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Wifi,
  Sparkles,
  LogOut,
  KeyRound,
  Terminal,
  ArrowRight,
  Lock,
  Unlock,
  Hash,
  ShieldAlert,
} from 'lucide-react';

interface AnyViewerAppProps {
  caller: Caller | null;
  onAutoFillCreditCard?: (card: { fullNumber: string; expiry: string; cvv: string; cardholder: string; balance: number }) => void;
  onAutoFillWireTransfer?: (wire: { routingNumber: string; accountNumber: string; amount: number }) => void;
  onCopyText?: (text: string) => void;
}

export const AnyViewerApp: React.FC<AnyViewerAppProps> = ({
  caller,
  onAutoFillCreditCard,
  onAutoFillWireTransfer,
  onCopyText,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<FakePCFolder | null>(null);
  const [selectedFile, setSelectedFile] = useState<FakePCFile | null>(null);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({});

  // Ensure caller has pcData generated
  const pcData = React.useMemo(() => {
    if (!caller) return null;
    return caller.pcData || generateFakePCData(caller);
  }, [caller]);

  // Per user request: With EVERY NEW CALL the anyviewer app resets to the code terminal where player needs to input code
  useEffect(() => {
    setIsConnected(false);
    setIsConnecting(false);
    setInputCode('');
    setCodeError(null);
    setOpenFolder(null);
    setSelectedFile(null);
    setIsBrowserOpen(false);
  }, [caller?.id]);

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setOpenFolder(null);
    setSelectedFile(null);
    setIsBrowserOpen(false);
    setCodeError(null);
    soundManager.playHangUp();
  };

  const handleConnectWithCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!caller) {
      setCodeError('No active phone caller connected. Dial a lead first.');
      soundManager.playKeyTone(1);
      return;
    }

    const cleanInput = inputCode.replace(/[\s\-_]/g, '').trim().toUpperCase();
    const cleanExpected = caller.connectionCode.replace(/[\s\-_]/g, '').trim().toUpperCase();

    if (!cleanInput) {
      setCodeError('Please enter the 6-digit Partner ID.');
      soundManager.playKeyTone(2);
      return;
    }

    if (cleanInput === cleanExpected) {
      setCodeError(null);
      setIsConnecting(true);
      soundManager.playKeyTone(7);
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
        soundManager.playChaChing();
      }, 700);
    } else {
      setCodeError(`CONNECTION REFUSED: Invalid Partner ID "${inputCode}". Ask caller on the phone for their AnyViewer code!`);
      soundManager.playHangUp();
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    soundManager.playKeyTone(7);
    if (onCopyText) onCopyText(text);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleToggleLike = (photoId: string) => {
    setLikedPhotos((prev) => ({ ...prev, [photoId]: !prev[photoId] }));
    soundManager.playChaChing();
  };

  // 1. STANDBY STATE: No Caller on Phone Line
  if (!caller || !pcData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0a0f1d] text-slate-300 p-6 font-mono text-xs select-none">
        <div className="w-16 h-16 rounded-2xl bg-sky-950/80 border border-sky-600/40 flex items-center justify-center text-sky-400 mb-4 shadow-lg shadow-sky-950/50">
          <Monitor className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-base font-bold text-sky-200 tracking-wider">ANYVIEWER QUICKCONNECT v4.8</h2>
        <p className="text-[11px] text-slate-400 mt-1 max-w-sm text-center">
          No active remote host on line. Pick up the telephone and dial a caller to access their remote workstation.
        </p>
        <div className="mt-5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Ready for Remote Connection</span>
          </div>
          <div>Dial line ➔ Ask for Partner ID ➔ Enter code below ➔ Explore target folders & bank info.</div>
        </div>
      </div>
    );
  }

  // 2. CONNECTING STATE: Establishing Encrypted Tunnel
  if (isConnecting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#070b14] text-slate-300 p-6 font-mono text-xs select-none">
        <RefreshCw className="w-10 h-10 text-sky-400 animate-spin mb-4" />
        <h3 className="text-sm font-bold text-sky-300">ESTABLISHING ENCRYPTED TUNNEL (TLS 1.3)...</h3>
        <p className="text-[11px] text-slate-400 mt-1">Connecting to {pcData.computerName} ({pcData.ipAddress})</p>
        <div className="w-56 h-2 bg-slate-800 rounded-full mt-4 overflow-hidden border border-slate-700">
          <div className="w-full h-full bg-gradient-to-r from-sky-500 to-emerald-400 animate-pulse" />
        </div>
        <span className="text-[10px] text-slate-500 mt-2 font-mono">Bypassing Windows Defender Firewall... OK</span>
      </div>
    );
  }

  // 3. CODE TERMINAL STATE: With every new call or after disconnect, player must input their code!
  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#090d19] text-slate-200 font-mono text-xs select-none overflow-y-auto p-4 sm:p-6">
        {/* Terminal Header */}
        <div className="max-w-md mx-auto w-full space-y-4 my-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-600/50 flex items-center justify-center text-sky-400 shadow">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-sky-300 tracking-wider">ANYVIEWER QUICKCONNECT</h2>
                <p className="text-[10px] text-slate-400">ENTER TARGET PARTNER CODE TO REMOTE-IN</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-bold">
              v4.8 SECURE
            </span>
          </div>

          {/* Target Host Information Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">TARGET WORKSTATION:</span>
              <span className="font-bold text-sky-300">{pcData.computerName}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">CALLER ON LINE:</span>
              <span className="font-bold text-amber-300">{caller.name || 'Caller'} ({caller.archetype})</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">TARGET OS & IP:</span>
              <span className="text-slate-300 font-mono">{pcData.osName} • {pcData.ipAddress}</span>
            </div>
          </div>

          {/* Caller Code Hint / Revelation Status */}
          {caller.connectionCodeRevealed ? (
            <div className="bg-emerald-950/50 border border-emerald-600/60 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-emerald-300 font-bold block">PARTNER ID PROVIDED BY CALLER:</span>
                  <span className="text-sm font-black tracking-widest text-emerald-200">{caller.connectionCode}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputCode(caller.connectionCode);
                  soundManager.playKeyTone(4);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] cursor-pointer shadow transition-all hover:scale-105"
              >
                AUTO-FILL CODE
              </button>
            </div>
          ) : (
            <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px]">
                <KeyRound className="w-4 h-4" />
                <span>CODE NOT YET REVEALED BY CALLER</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Ask the caller for their 6-digit AnyViewer code over the telephone (e.g. "What is your connection code?"). Or use the hint below if you know it!
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] text-slate-400">Target Code Hash: {caller.connectionCode.slice(0, 3)}-•••</span>
                <button
                  type="button"
                  onClick={() => {
                    setInputCode(caller.connectionCode);
                    soundManager.playKeyTone(5);
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
                  title="Peek and fill the caller's code"
                >
                  [Peek & Fill: {caller.connectionCode}]
                </button>
              </div>
            </div>
          )}

          {/* Code Input Form */}
          <form onSubmit={handleConnectWithCode} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                ENTER PARTNER ID (6-DIGIT CODE):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. 842-194"
                  className="w-full px-4 py-2.5 bg-slate-950 border-2 border-sky-600/60 rounded-xl text-center font-mono text-base tracking-widest text-sky-200 placeholder-slate-600 focus:outline-none focus:border-sky-400 transition-colors uppercase shadow-inner"
                  autoFocus
                />
                <Hash className="w-4 h-4 text-sky-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Error Message */}
            {codeError && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-600/80 text-rose-300 text-[10px] flex items-center gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{codeError}</span>
              </div>
            )}

            {/* Virtual Quick Keypad */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    soundManager.playKeyTone(k === '⌫' ? 1 : Number(k) || 4);
                    if (k === '⌫') {
                      setInputCode((prev) => prev.slice(0, -1));
                    } else {
                      setInputCode((prev) => (prev.length < 10 ? prev + k : prev));
                    }
                  }}
                  className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 active:bg-sky-900 border border-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors shadow-sm"
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Connect Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-sky-500 via-blue-600 to-sky-500 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-xl text-xs font-mono tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50 hover:scale-[1.01] active:scale-95 cursor-pointer transition-all border border-sky-300/40"
            >
              <Unlock className="w-4 h-4" />
              <span>CONNECT TO REMOTE WORKSTATION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. CONNECTED STATE: Victim's Desktop Screen with Interactive Folders & Disconnect Button
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 font-sans text-xs select-none overflow-hidden relative">
      {/* Top Remote Control Header with Disconnect Button */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950 border border-sky-800/80 text-sky-300 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">LIVE SESSION:</span>
            <span>{caller.name.toUpperCase()}'S PC</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            {pcData.osName} | IP: {pcData.ipAddress}
          </span>
        </div>

        {/* Action Controls & DISCONNECT Button */}
        <div className="flex items-center gap-1.5">
          {onAutoFillCreditCard && (
            <button
              onClick={() => {
                onAutoFillCreditCard({
                  fullNumber: caller.card.fullNumber,
                  expiry: caller.card.expiry,
                  cvv: caller.card.cvv,
                  cardholder: caller.card.cardholder,
                  balance: caller.card.balance,
                });
                soundManager.playKeyTone(8);
              }}
              className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Push victim's credit card details into Credit Card Terminal"
            >
              <CreditCard className="w-3 h-3" />
              <span className="hidden sm:inline">Copy Card</span>
            </button>
          )}

          {onAutoFillWireTransfer && (
            <button
              onClick={() => {
                onAutoFillWireTransfer({
                  routingNumber: pcData.bankAccount.routingNumber,
                  accountNumber: pcData.bankAccount.accountNumber,
                  amount: pcData.bankAccount.checkingBalance,
                });
                soundManager.playKeyTone(8);
              }}
              className="px-2 py-1 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/60 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Push victim's routing & checking account into SwiftACH Wire"
            >
              <Landmark className="w-3 h-3" />
              <span className="hidden sm:inline">Copy ACH</span>
            </button>
          )}

          {/* PER USER REQUEST: Disconnect Session Button */}
          <button
            onClick={handleDisconnect}
            className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/80 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
            title="Disconnect remote session and return to code terminal"
          >
            <LogOut className="w-3 h-3 text-rose-400" />
            <span>DISCONNECT</span>
          </button>

          <div className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono hidden md:inline">
            1080p 60FPS
          </div>
        </div>
      </div>

      {/* Main Remote Desktop Canvas */}
      <div
        className="flex-1 relative overflow-hidden bg-cover bg-center flex flex-col justify-between p-4"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.6)), url('${pcData.wallpaperUrl}')`,
        }}
      >
        {/* Desktop Theme Title watermark */}
        <div className="absolute top-2 right-4 text-right pointer-events-none opacity-40">
          <span className="text-[11px] text-white font-mono uppercase tracking-wider block">
            {pcData.themeTitle}
          </span>
          <span className="text-[9px] text-slate-200 font-mono">
            {pcData.computerName}
          </span>
        </div>

        {/* Desktop Icons Grid (Left column) */}
        <div className="grid grid-flow-col grid-rows-4 gap-3 w-fit z-10">
          {pcData.folders.map((folder) => {
            const isDog = folder.iconType === 'folder-dog';
            const isBank = folder.iconType === 'folder-bank';
            const isPass = folder.iconType === 'folder-passwords';

            return (
              <button
                key={folder.id}
                onClick={() => {
                  setOpenFolder(folder);
                  setSelectedFile(null);
                  soundManager.playKeyTone(3);
                }}
                className="w-24 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/20 active:bg-white/30 text-white cursor-pointer transition-all group backdrop-blur-[2px] border border-transparent hover:border-white/20 shadow-sm"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${
                    isDog
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950'
                      : isBank
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                      : isPass
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-500'
                      : 'bg-gradient-to-tr from-sky-600 to-blue-500'
                  }`}
                >
                  {isDog ? (
                    <span className="text-xl">🐶</span>
                  ) : isBank ? (
                    <Landmark className="w-5 h-5 text-white" />
                  ) : isPass ? (
                    <Key className="w-5 h-5 text-white" />
                  ) : folder.iconType === 'folder-trash' ? (
                    <Trash2 className="w-5 h-5 text-slate-200" />
                  ) : (
                    <Folder className="w-5 h-5 text-white fill-current" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-center leading-tight drop-shadow-md text-white line-clamp-2 px-1">
                  {folder.name}
                </span>
                {folder.badgeCount && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-900/80 text-amber-300 font-mono font-bold border border-white/20">
                    {folder.badgeCount} files
                  </span>
                )}
              </button>
            );
          })}

          {/* Simulated Browser Icon */}
          <button
            onClick={() => {
              setIsBrowserOpen(true);
              soundManager.playKeyTone(4);
            }}
            className="w-24 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/20 active:bg-white/30 text-white cursor-pointer transition-all group backdrop-blur-[2px] border border-transparent hover:border-white/20"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-center drop-shadow-md text-white px-1">
              Bank Online
            </span>
          </button>
        </div>

        {/* Desktop Sticky Note (Right side) */}
        {pcData.stickyNote && (
          <div className="absolute top-12 right-6 w-60 p-3 rounded-lg bg-amber-100/95 border-2 border-amber-300 shadow-xl text-amber-950 rotate-1 backdrop-blur-sm z-10 transition-transform hover:rotate-0">
            <div className="flex items-center justify-between pb-1 border-b border-amber-300/80 mb-2">
              <span className="font-bold text-[11px]">{pcData.stickyNote.title}</span>
              <span className="text-[9px] font-mono text-amber-800">PINNED</span>
            </div>
            <p className="text-[11px] whitespace-pre-line leading-relaxed font-sans font-medium">
              {pcData.stickyNote.text}
            </p>
          </div>
        )}

        {/* Windows / Mac Simulated Taskbar */}
        <div className="mt-auto -mx-4 -mb-4 bg-slate-950/90 border-t border-white/10 px-3 py-1.5 flex items-center justify-between text-white backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow">
              <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                <div className="bg-white rounded-[1px]" />
                <div className="bg-white rounded-[1px]" />
                <div className="bg-white rounded-[1px]" />
                <div className="bg-white rounded-[1px]" />
              </div>
              <span>Start</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Search programs and dog photos...
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-300">
            <button
              onClick={handleDisconnect}
              className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Disconnect AnyViewer Session"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>Disconnect Session</span>
            </button>
            <div className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connected</span>
            </div>
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* --- MODAL WINDOW 1: FOLDER EXPLORER --- */}
        {openFolder && (
          <div className="absolute inset-4 sm:inset-8 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md z-30 animate-in fade-in zoom-in-95 duration-150">
            {/* Folder Header */}
            <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-amber-400">
                  {openFolder.iconType === 'folder-dog' ? '🐶' : <Folder className="w-4 h-4 fill-current" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">{openFolder.name}</h4>
                  <p className="text-[10px] text-slate-400">{openFolder.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOpenFolder(null);
                    setSelectedFile(null);
                    soundManager.playKeyTone(2);
                  }}
                  className="w-6 h-6 rounded hover:bg-rose-600/80 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Folder Sub-header: Path bar */}
            <div className="bg-slate-950 px-3 py-1 border-b border-slate-800 flex items-center gap-1 text-[10px] font-mono text-slate-400">
              <span>This PC</span>
              <span>&gt;</span>
              <span>C:\Users\{caller.name.split(' ')[0]}\Documents</span>
              <span>&gt;</span>
              <span className="text-sky-300 font-bold">{openFolder.name}</span>
            </div>

            {/* Folder File Grid */}
            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-900/60">
              {openFolder.files.map((file) => {
                const isImg = file.type === 'image';
                const isBank = file.type === 'bank' || file.type === 'credentials';

                return (
                  <button
                    key={file.id}
                    onClick={() => {
                      setSelectedFile(file);
                      soundManager.playKeyTone(4);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center gap-1.5 cursor-pointer transition-all ${
                      selectedFile?.id === file.id
                        ? 'bg-sky-950/80 border-sky-500 shadow-md shadow-sky-950/50'
                        : 'bg-slate-850/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {isImg ? (
                      <div className="w-full h-20 rounded-lg overflow-hidden relative bg-slate-950 border border-slate-800">
                        <img
                          src={file.imageUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/70 rounded text-[9px] text-amber-300 font-bold">
                          JPG
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isBank
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                            : 'bg-slate-800 text-sky-400 border border-slate-700'
                        }`}
                      >
                        {isBank ? <Landmark className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                    )}

                    <div className="w-full">
                      <span className="text-[11px] font-bold text-slate-200 block truncate" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        {file.size} | {file.dateModified}
                      </span>
                    </div>

                    {file.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                          file.badge.includes('PUPPY') || file.badge.includes('CUTE')
                            ? 'bg-amber-950/90 text-amber-300 border border-amber-700/80'
                            : 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/80'
                        }`}
                      >
                        {file.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions if file selected */}
            {selectedFile && (
              <div className="bg-slate-950 border-t border-slate-800 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 text-xs">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-400">({selectedFile.size})</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedFile.content && (
                    <button
                      onClick={() => handleCopy(selectedFile.content || '', selectedFile.id)}
                      className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      {copiedKey === selectedFile.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === selectedFile.id ? 'COPIED TO CLIPBOARD!' : 'COPY FILE CONTENTS'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- MODAL WINDOW 2: FILE PREVIEWER (TEXT / PHOTO) --- */}
        {selectedFile && (
          <div className="absolute inset-6 sm:inset-10 bg-slate-900 border-2 border-sky-600/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-150">
            {/* Previewer Header */}
            <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedFile.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                ) : (
                  <FileText className="w-4 h-4 text-sky-400" />
                )}
                <span className="font-bold text-slate-100 text-xs">{selectedFile.name}</span>
                {selectedFile.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 text-[9px] font-mono border border-sky-800">
                    {selectedFile.badge}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedFile.content && (
                  <button
                    onClick={() => handleCopy(selectedFile.content || '', 'preview')}
                    className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'preview' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'preview' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    soundManager.playKeyTone(2);
                  }}
                  className="w-6 h-6 rounded hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Previewer Body */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-950">
              {selectedFile.type === 'image' && selectedFile.imageUrl ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="max-w-md w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-black">
                    <img
                      src={selectedFile.imageUrl}
                      alt={selectedFile.name}
                      className="w-full max-h-80 object-cover"
                    />
                  </div>
                  {selectedFile.caption && (
                    <div className="max-w-md text-center bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <p className="text-slate-300 text-xs italic">"{selectedFile.caption}"</p>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleLike(selectedFile.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            likedPhotos[selectedFile.id]
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedPhotos[selectedFile.id] ? 'fill-current' : ''}`} />
                          <span>{likedPhotos[selectedFile.id] ? 'Beloved Puppy! ❤️' : 'React with Love'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="font-mono text-xs text-slate-200 whitespace-pre-wrap bg-slate-900/80 p-4 rounded-xl border border-slate-800 leading-relaxed">
                  {selectedFile.content}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODAL WINDOW 3: SIMULATED BANKING BROWSER --- */}
        {isBrowserOpen && (
          <div className="absolute inset-4 sm:inset-8 bg-slate-900 border-2 border-emerald-600/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-150">
            {/* Browser Navigation Bar */}
            <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1 bg-slate-950 rounded-lg px-2.5 py-1 text-[11px] font-mono text-emerald-400 border border-slate-700 flex items-center justify-between">
                  <span>https://secure.banking.{pcData.bankAccount.bankName.toLowerCase().replace(/\s+/g, '')}.com/portal</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
              <button
                onClick={() => setIsBrowserOpen(false)}
                className="w-6 h-6 rounded hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bank Portal UI */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-950 font-sans space-y-4">
              <div className="flex items-center justify-between bg-emerald-950/60 p-4 rounded-xl border border-emerald-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-400/60 flex items-center justify-center text-emerald-300">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{pcData.bankAccount.bankName.toUpperCase()}</h3>
                    <p className="text-[11px] text-emerald-400">Welcome, {caller.name} (Member ID #{pcData.bankAccount.accountNumber.slice(-4)})</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">TOTAL ASSETS:</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    ${(pcData.bankAccount.checkingBalance + pcData.bankAccount.savingsBalance).toLocaleString()}.00
                  </span>
                </div>
              </div>

              {/* Account Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-200">PREMIER CHECKING</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xl font-black text-slate-100 font-mono">
                    ${pcData.bankAccount.checkingBalance.toLocaleString()}.00
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-0.5 font-mono pt-1 border-t border-slate-800">
                    <div>Routing: {pcData.bankAccount.routingNumber}</div>
                    <div>Account: {pcData.bankAccount.accountNumber}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-200">GROWTH SAVINGS</span>
                    <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px] font-bold">
                      4.2% APY
                    </span>
                  </div>
                  <div className="text-xl font-black text-slate-100 font-mono">
                    ${pcData.bankAccount.savingsBalance.toLocaleString()}.00
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-0.5 font-mono pt-1 border-t border-slate-800">
                    <div>Account: 90{pcData.bankAccount.accountNumber.slice(2)}</div>
                    <div>Status: FDIC Insured</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
