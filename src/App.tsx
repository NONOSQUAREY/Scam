import React, { useState, useEffect, useRef } from 'react';
import { Caller } from './types/game';
import { DraggableWindow } from './components/DraggableWindow';
import { PhoneWindow } from './components/PhoneWindow';
import { CameraWindow } from './components/CameraWindow';
import { CreditCardApp } from './components/CreditCardApp';
import { AssessmentApp } from './components/AssessmentApp';
import { AnyViewerApp } from './components/AnyViewerApp';
import { RefundCalculatorApp } from './components/RefundCalculatorApp';
import { MalwareScannerApp } from './components/MalwareScannerApp';
import { WireTransferApp } from './components/WireTransferApp';
import { ScammyWidget } from './components/ScammyWidget';
import { DesktopTaskbar, ActiveWindowsState } from './components/DesktopTaskbar';
import { GiftCardsWindow } from './components/GiftCardsWindow';
import { StoreApp, UnlockedApps } from './components/StoreApp';
import { IdentityWindow } from './components/IdentityWindow';
import { PerformanceReviewModal } from './components/PerformanceReviewModal';
import { SysKeyLockApp } from './components/SysKeyLockApp';
import { VoIPSoundboardApp } from './components/VoIPSoundboardApp';
import { CryptoVaultApp } from './components/CryptoVaultApp';
import { soundManager } from './utils/audio';
import { gameplayRecorder } from './utils/gameplayRecorder';
import { callScreenRecorder } from './utils/callScreenRecorder';
import { generateFakePCData } from './utils/fakePCHelper';
import { CreditCard, Brain, Phone, Camera, ShoppingBag, Shield, Calculator, Landmark, ShieldAlert, Monitor, Lock, Mic, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';

// Shift duration doubling rule requested by user:
// Day 1: 4 mins (240s), Day 2: 8 mins (480s), Day 3: 16 mins (960s), Day 4: 32 mins (1920s)...
export const getShiftDurationSeconds = (day: number): number => {
  return 240 * Math.pow(2, Math.max(0, day - 1));
};

export default function App() {
  // Caller & Call State
  const [caller, setCaller] = useState<Caller | null>(null);
  const [isCallerTalking, setIsCallerTalking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Glitch fix: Track processed caller IDs to prevent multiple redemption abuse
  const [processedCallerIds, setProcessedCallerIds] = useState<Set<string>>(new Set());

  // Financial Stats & Shift Quota: Day 1 capped at $2,000
  const [personalMoney, setPersonalMoney] = useState(250); // Start with $250 so user can get AnyViewer ($200) easily
  const [teamMoney, setTeamMoney] = useState(0);
  const [quota, setQuota] = useState(2000); // 2 thousand dollar cap on the first day
  const [streak, setStreak] = useState(0);
  const [shiftDay, setShiftDay] = useState(1);

  // Review Countdown Timer: Day 1 = 4 minutes (240s), then doubles every new day
  const [dayBaseTimerSeconds, setDayBaseTimerSeconds] = useState(240);
  const [reviewTimerSeconds, setReviewTimerSeconds] = useState(240);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // In-flight chat request abort controller for instant stop on hang up
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // App Unlocks: Credit Card and Assessment unlocked from start. AnyViewer in store ($200)
  const [unlockedApps, setUnlockedApps] = useState<UnlockedApps>({
    creditCard: true,
    assessment: true,
    anyViewer: false,
    refundCalc: false,
    wireTransfer: false,
    malwareScanner: false,
    giftCards: false,
    camera: false,
    sysKeyLock: false,
    voipSoundboard: false,
    cryptoVault: false,
  });

  // Installed Hardware / Tech upgrades
  const [installedUpgrades, setInstalledUpgrades] = useState<string[]>([]);

  // Active Open Windows on Desktop
  const [activeWindows, setActiveWindows] = useState<ActiveWindowsState>({
    creditCard: true,
    assessment: true,
    phone: true,
    anyViewer: false,
    store: false,
    identity: false,
    refundCalc: false,
    wireTransfer: false,
    malwareScanner: false,
    giftCards: false,
    camera: false,
    sysKeyLock: false,
    voipSoundboard: false,
    cryptoVault: false,
  });

  // Layering (Z-Index) for Draggable Windows
  const [zIndices, setZIndices] = useState<Record<string, number>>({
    creditCard: 15,
    assessment: 14,
    phone: 18,
    anyViewer: 16,
    store: 17,
    identity: 12,
    refundCalc: 15,
    wireTransfer: 13,
    malwareScanner: 11,
    giftCards: 10,
    camera: 9,
    sysKeyLock: 14,
    voipSoundboard: 13,
    cryptoVault: 12,
  });
  const [topZ, setTopZ] = useState(30);

  const bringToFront = (windowId: string) => {
    setTopZ((current) => {
      const next = current + 1;
      setZIndices((prev) => ({ ...prev, [windowId]: next }));
      return next;
    });
  };

  // Performance review countdown tick
  useEffect(() => {
    if (isReviewModalOpen) return;

    const timer = setInterval(() => {
      setReviewTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsReviewModalOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isReviewModalOpen]);

  // Review actions: Continue to next day (doubles time & raises earnings cap)
  const handleContinueNextDay = () => {
    const nextDay = shiftDay + 1;
    setShiftDay(nextDay);
    setPersonalMoney((prev) => prev + 500); // $500 bonus
    setTeamMoney(0); // Reset shift total for the new day's quota

    // Raise earnings cap and quota each day
    // Day 2: $3,800, Day 3: $6,000, Day 4+: +$2,500
    const nextQuota = nextDay === 2 ? 3800 : nextDay === 3 ? 6000 : 6000 + (nextDay - 3) * 2500;
    setQuota(nextQuota);

    // "for the first day 4 mins is appropriate, and then double that for each new day"
    const nextTimer = getShiftDurationSeconds(nextDay);
    setDayBaseTimerSeconds(nextTimer);
    setReviewTimerSeconds(nextTimer);

    gameplayRecorder.resetForNewShift();
    setIsReviewModalOpen(false);
    soundManager.playChaChing();
    // Leave phone idle on hook so player can click DIAL CALL when ready!
  };

  // Review actions: Retry shift
  const handleRetryShift = () => {
    const duration = getShiftDurationSeconds(shiftDay);
    setDayBaseTimerSeconds(duration);
    setReviewTimerSeconds(duration);
    setTeamMoney(0);
    gameplayRecorder.resetForNewShift();
    setIsReviewModalOpen(false);
    soundManager.playKeyTone(3);
  };

  // Review actions: 2-minute extension
  const handleRequestExtension = () => {
    setReviewTimerSeconds((prev) => prev + 120);
    setIsReviewModalOpen(false);
    soundManager.playKeyTone(5);
  };

  // Toggle Window Open/Close
  const toggleWindow = (windowName: keyof ActiveWindowsState) => {
    if (windowName in unlockedApps && !unlockedApps[windowName as keyof UnlockedApps]) {
      soundManager.playKeyTone(1);
      setActiveWindows((prev) => ({ ...prev, store: true }));
      bringToFront('store');
      return;
    }

    setActiveWindows((prev) => {
      const willOpen = !prev[windowName];
      if (willOpen) {
        bringToFront(windowName);
      }
      return {
        ...prev,
        [windowName]: willOpen,
      };
    });
    soundManager.playKeyTone(3);
  };

  // Fetch New Caller (Procedural 100+ Personas / Gemini, capped by shiftDay)
  const fetchNextCaller = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    soundManager.playPhoneRing();

    try {
      const res = await fetch('/api/caller/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftDay }),
      });
      const newCaller: Caller = await res.json();
      const fullCaller: Caller = {
        ...newCaller,
        isDrained: false,
        pcData: newCaller.pcData || generateFakePCData(newCaller),
      };

      setCaller(fullCaller);

      // Start recording real screen / workstation view for this caller
      callScreenRecorder.startCallRecording(fullCaller.name, fullCaller.archetype);
      callScreenRecorder.scanSpokenDialogue(fullCaller.name, fullCaller.hook, 'Initial Hook');

      gameplayRecorder.recordEvent(
        'call_start',
        { notes: `Connected with ${fullCaller.name} (${fullCaller.archetype})` },
        fullCaller.name,
        fullCaller.archetype
      );
      soundManager.playPhonePickup();

      setTimeout(() => {
        soundManager.speakCaller(
          fullCaller.hook,
          fullCaller.voice,
          () => setIsCallerTalking(true),
          () => setIsCallerTalking(false),
          fullCaller.gender
        );
      }, 500);
    } catch (e) {
      console.error('Error fetching caller:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Initial call on startup
  useEffect(() => {
    fetchNextCaller();
  }, []);

  // Handle Player Sending Message to Caller
  const handleSendMessage = async (msg: string) => {
    if (!caller || isProcessing) return;

    // Abort any previous pending chat fetch
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
    }
    const abortCtrl = new AbortController();
    chatAbortControllerRef.current = abortCtrl;

    setIsProcessing(true);
    soundManager.playKeyTone(6);

    const updatedHistory = [...caller.dialogueHistory, { role: 'player' as const, text: msg }];
    const currentCaller = { ...caller, dialogueHistory: updatedHistory };
    setCaller(currentCaller);

    // Scan operator dialogue into real call tape
    callScreenRecorder.scanSpokenDialogue('Operator', msg, 'Operator Message');

    try {
      const res = await fetch('/api/caller/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          caller: currentCaller,
          playerMessage: msg,
        }),
      });

      if (abortCtrl.signal.aborted) return;

      const data = await res.json();

      if (abortCtrl.signal.aborted) return;

      const isAskingName = /(name|who are you|speaking with|who is this|identify yourself|what is your name|may i have your name)/i.test(msg);
      const isNameRevealedNow = Boolean(data.revealName || isAskingName || currentCaller.nameRevealed);
      if (isNameRevealedNow && !currentCaller.nameRevealed) {
        soundManager.playKeyTone(7);
      }

      let suspicionChange = data.suspicionDelta || 0;
      const newSuspicion = Math.min(100, Math.max(0, caller.suspicion + suspicionChange));
      const newCard = { ...caller.card };

      if (data.revealNumber) newCard.numberRevealed = true;
      if (data.revealExpiry) newCard.expiryRevealed = true;
      if (data.revealCvv) newCard.cvvRevealed = true;

      const isAskingCode = /(anyviewer|partner id|connection code|partner code|remote code|what is your code)/i.test(msg);
      const isCodeRevealedNow = Boolean(
        data.revealCode ||
        currentCaller.connectionCodeRevealed ||
        (isAskingCode && newSuspicion < 70)
      );

      const nextCallerState: Caller = {
        ...currentCaller,
        nameRevealed: isNameRevealedNow,
        connectionCodeRevealed: isCodeRevealedNow,
        suspicion: newSuspicion,
        card: newCard,
        dialogueHistory: [...updatedHistory, { role: 'caller', text: data.reply }],
      };

      setCaller(nextCallerState);

      // Scan caller reply into real call tape
      callScreenRecorder.scanSpokenDialogue(caller.name, data.reply, 'Target Voice');

      // Record dialogue in gameplay recorder
      gameplayRecorder.recordEvent(
        'dialogue',
        {
          message: msg,
          reply: data.reply,
          suspicion: newSuspicion,
          suspicionDelta: suspicionChange,
        },
        caller.name,
        caller.archetype
      );

      await soundManager.speakCaller(
        data.reply,
        caller.voice,
        () => setIsCallerTalking(true),
        () => setIsCallerTalking(false),
        caller.gender
      );

      // Only hang up if suspicion maxed out at 100%
      if (newSuspicion >= 100) {
        soundManager.stopAudio();
        soundManager.playHangUp();
        gameplayRecorder.recordEvent('blunder', { suspicion: 100, notes: 'Caller rage quit at 100% suspicion' }, caller.name, caller.archetype);
        await callScreenRecorder.stopCallRecording();
        setStreak(0);
        setCaller(null);
        setIsCallerTalking(false);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // Fetch was aborted cleanly by player hang up
        return;
      }
      console.error('Chat error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Hang Up (user controlled, does NOT auto-redial, stops all TTS and chatting)
  const handleHangUp = async () => {
    // 1. Immediately abort active chat request
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }

    // 2. Immediately stop all TTS and audio
    soundManager.stopAudio();
    setIsCallerTalking(false);
    setIsProcessing(false);

    // 3. Play hangup click
    soundManager.playHangUp();

    if (caller) {
      gameplayRecorder.recordEvent('hangup', { notes: 'Operator clicked Hang Up' }, caller.name, caller.archetype);
      await callScreenRecorder.stopCallRecording();
    }
    setCaller(null);
    setStreak(0);
  };

  // User controls for testing suspicion levels
  const handleMakeMoreSuspicious = () => {
    if (!caller) return;
    const newSusp = Math.min(95, caller.suspicion + 15);
    setCaller({
      ...caller,
      suspicion: newSusp,
    });
    soundManager.playKeyTone(2);
  };

  // Soothe caller
  const handleSootheCaller = () => {
    if (!caller) return;
    const soothePower = installedUpgrades.includes('super_soothe') ? 25 : 15;
    const newSusp = Math.max(5, caller.suspicion - soothePower);
    setCaller({
      ...caller,
      suspicion: newSusp,
    });
    gameplayRecorder.recordEvent('soothe', { suspicion: newSusp, suspicionDelta: -soothePower }, caller.name, caller.archetype);
    soundManager.playKeyTone(7);
  };

  // Drain Funds / Credit Card Success: DOES NOT AUTO HANG UP!
  const handleCreditCardSuccess = (amount: number, cardholder: string) => {
    if (!caller) return;

    // Glitch fix: Prevent multiple redemptions on same caller/transaction
    if (caller.isDrained || processedCallerIds.has(caller.id)) {
      console.warn('Duplicate transaction blocked for caller:', caller.id);
      soundManager.playKeyTone(1);
      return;
    }

    setProcessedCallerIds((prev) => new Set(prev).add(caller.id));
    const totalEarnings = Math.round(amount);

    setPersonalMoney((prev) => prev + totalEarnings);
    setTeamMoney((prev) => prev + totalEarnings);
    setStreak((prev) => prev + 1);

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

    // Caller is surprised but stays on the line until operator hangs up!
    const reactionText = "Wait, my bank app just buzzed with a debit alert! Is that normal for the cancellation confirmation?!";
    const updatedHistory = [...caller.dialogueHistory, { role: 'caller' as const, text: reactionText }];
    setCaller({
      ...caller,
      isDrained: true,
      drainedAmount: totalEarnings,
      dialogueHistory: updatedHistory,
    });

    soundManager.speakCaller(
      reactionText,
      caller.voice,
      () => setIsCallerTalking(true),
      () => setIsCallerTalking(false),
      caller.gender
    );
  };

  // Drain Funds from New Scam Apps (Wire, Overpayment Matrix, Malware Scanner)
  const handleDrainSuccess = (amount: number, reason: string) => {
    if (!caller) return;

    // Glitch fix: Prevent multiple redemptions on same caller/transaction
    if (caller.isDrained || processedCallerIds.has(caller.id)) {
      console.warn('Duplicate drain blocked for caller:', caller.id);
      soundManager.playKeyTone(1);
      return;
    }

    setProcessedCallerIds((prev) => new Set(prev).add(caller.id));
    const totalEarnings = Math.round(amount);

    setPersonalMoney((prev) => prev + totalEarnings);
    setTeamMoney((prev) => prev + totalEarnings);
    setStreak((prev) => prev + 1);

    gameplayRecorder.recordEvent(
      'charge_success',
      { amount: totalEarnings, appName: reason },
      caller.name,
      caller.archetype
    );

    // Caller reacts, call stays open!
    const reactionText = "Oh heavens! The ledger notification just flashed on my screen! Has the transaction cleared?";
    const updatedHistory = [...caller.dialogueHistory, { role: 'caller' as const, text: reactionText }];
    setCaller({
      ...caller,
      isDrained: true,
      drainedAmount: totalEarnings,
      dialogueHistory: updatedHistory,
    });

    soundManager.speakCaller(
      reactionText,
      caller.voice,
      () => setIsCallerTalking(true),
      () => setIsCallerTalking(false),
      caller.gender
    );
  };

  // Social Security Stealer verify success
  const handleVerifySSN = (amount: number) => {
    if (!caller || caller.isDrained || processedCallerIds.has(caller.id)) {
      soundManager.playKeyTone(1);
      return;
    }
    setProcessedCallerIds((prev) => new Set(prev).add(caller.id));
    setPersonalMoney((prev) => prev + amount);
    setTeamMoney((prev) => prev + amount);
    setStreak((prev) => prev + 1);
    setCaller({
      ...caller,
      isDrained: true,
      drainedAmount: amount,
    });
    gameplayRecorder.recordEvent('charge_success', { amount, appName: 'Identity SSN Stealer' }, caller?.name, caller?.archetype);
  };

  // Gift Card Redeem Success
  const handleRedeemGiftCardSuccess = (amount: number) => {
    if (!caller || caller.isDrained || processedCallerIds.has(caller.id)) {
      soundManager.playKeyTone(1);
      return;
    }
    setProcessedCallerIds((prev) => new Set(prev).add(caller.id));
    setPersonalMoney((prev) => prev + amount);
    setTeamMoney((prev) => prev + amount);
    setStreak((prev) => prev + 1);
    setCaller({
      ...caller,
      isDrained: true,
      drainedAmount: amount,
    });
    gameplayRecorder.recordEvent('charge_success', { amount, appName: 'Gift Card Terminal' }, caller?.name, caller?.archetype);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
  };

  // Store: Buy App License
  const handleUnlockApp = (appKey: keyof UnlockedApps, cost: number) => {
    if (personalMoney >= cost && !unlockedApps[appKey]) {
      setPersonalMoney((prev) => prev - cost);
      setUnlockedApps((prev) => ({ ...prev, [appKey]: true }));
      setActiveWindows((prev) => ({ ...prev, [appKey]: true }));
      bringToFront(appKey);
      confetti({ particleCount: 50, spread: 80, origin: { y: 0.7 } });
      return true;
    }
    return false;
  };

  // Store: Buy Hardware Upgrade
  const handleBuyHardwareUpgrade = (upgradeId: string, cost: number) => {
    if (personalMoney >= cost && !installedUpgrades.includes(upgradeId)) {
      setPersonalMoney((prev) => prev - cost);
      setInstalledUpgrades((prev) => [...prev, upgradeId]);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      return true;
    }
    return false;
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden select-none relative flex flex-col font-sans"
      style={{
        backgroundImage: 'url(/src/assets/images/desert_cactus_wallpaper_1790157812170.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Subtle Desktop overlay tint */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      {/* Top Right: Shift Status & Screen Recorder Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Real Screen Recorder Toggle */}
        <button
          onClick={async () => {
            if (callScreenRecorder.isScreenSharingActive()) {
              callScreenRecorder.stopScreenShare();
              setIsScreenSharing(false);
              soundManager.playKeyTone(1);
            } else {
              soundManager.playKeyTone(7);
              const ok = await callScreenRecorder.requestScreenShare();
              setIsScreenSharing(ok);
              if (ok) {
                soundManager.playChaChing();
              }
            }
          }}
          className={`px-3 py-1.5 rounded-xl border-2 font-mono text-xs shadow-xl flex items-center gap-1.5 cursor-pointer transition-all ${
            isScreenSharing
              ? 'bg-rose-950/95 border-rose-500 text-rose-300 ring-2 ring-rose-500/50'
              : 'bg-neutral-900/90 border-neutral-700 text-neutral-300 hover:border-cyan-500 hover:text-cyan-200'
          }`}
          title={
            isScreenSharing
              ? 'Real Screen Recording ACTIVE (Browser Display)! Click to stop.'
              : 'Click to share your screen/tab for 100% direct screen recording into tapes!'
          }
        >
          <span className={`w-2 h-2 rounded-full ${isScreenSharing ? 'bg-red-500 animate-ping' : 'bg-red-400'}`} />
          <span className="font-bold">
            {isScreenSharing ? 'REC: MY SCREEN (ON)' : '🔴 RECORD MY SCREEN'}
          </span>
        </button>

        <button
          onClick={() => {
            soundManager.playKeyTone(6);
            setIsReviewModalOpen(true);
          }}
          className={`px-3.5 py-1.5 rounded-xl border-2 font-mono text-xs shadow-xl flex items-center gap-2 cursor-pointer cartoon-btn ${
            teamMoney >= quota
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 hover:bg-emerald-900 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'bg-neutral-900/90 border-neutral-700 text-neutral-200 hover:bg-neutral-800'
          }`}
          title="Click to view Shift Performance Review (Boss Vikram Evaluation)"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-amber-400">DAY #{shiftDay}</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-300 font-sans">Quota:</span>
            <span className={teamMoney >= quota ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
              ${teamMoney.toLocaleString()} / ${quota.toLocaleString()}
            </span>
          </div>

          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              teamMoney >= quota
                ? 'bg-emerald-500 text-neutral-950 animate-pulse'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {teamMoney >= quota ? 'PASS' : `${Math.floor(reviewTimerSeconds / 60)}:${String(reviewTimerSeconds % 60).padStart(2, '0')}`}
          </span>
          <span className="text-[10px] text-cyan-400 underline font-sans hidden sm:inline">Boss Review</span>
        </button>
      </div>

      {/* Desktop Icons Grid */}
      <div className="absolute top-4 left-4 z-10 grid grid-cols-2 gap-x-3 gap-y-3.5 max-w-[220px]">
        {/* 1. Credit Card Terminal */}
        <button
          onClick={() => toggleWindow('creditCard')}
          className="flex flex-col items-center gap-1 w-24 text-center group cursor-pointer"
        >
          <div className="w-14 h-14 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border-2 border-white/30 shadow-lg flex items-center justify-center text-white transition-all group-hover:scale-105 group-hover:border-emerald-400">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[11px] font-sans font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-emerald-300 leading-tight">
            Credit Card
          </span>
        </button>

        {/* 2. Target Psychological Assessment (Replaces Customer Info) */}
        <button
          onClick={() => toggleWindow('assessment')}
          className="flex flex-col items-center gap-1 w-24 text-center group cursor-pointer"
        >
          <div className="w-14 h-14 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border-2 border-white/30 shadow-lg flex items-center justify-center text-white transition-all group-hover:scale-105 group-hover:border-purple-400">
            <div className="w-10 h-10 rounded-xl bg-purple-700 flex items-center justify-center text-white shadow">
              <Brain className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[11px] font-sans font-bold text-purple-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-purple-100 leading-tight">
            Assessment
          </span>
        </button>

        {/* 3. Phone */}
        <button
          onClick={() => toggleWindow('phone')}
          className="flex flex-col items-center gap-1 w-24 text-center group cursor-pointer"
        >
          <div className="w-14 h-14 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border-2 border-white/30 shadow-lg flex items-center justify-center text-white transition-all group-hover:scale-105 group-hover:border-emerald-400">
            <div className="w-10 h-10 rounded-xl bg-[#2e7d32] flex items-center justify-center text-white shadow">
              <Phone className="w-6 h-6 fill-current" />
            </div>
          </div>
          <span className="text-[11px] font-sans font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-emerald-300 leading-tight">
            Phone
          </span>
        </button>

        {/* 4. Overpayment Matrix */}
        <button
          onClick={() => toggleWindow('refundCalc')}
          className="flex flex-col items-center gap-1 w-24 text-center group cursor-pointer relative"
        >
          <div
            className={`w-14 h-14 rounded-2xl border-2 shadow-lg flex items-center justify-center transition-all group-hover:scale-105 ${
              unlockedApps.refundCalc
                ? 'bg-white/15 hover:bg-white/25 border-white/30 backdrop-blur-md'
                : 'bg-black/30 border-white/15 backdrop-blur-sm opacity-60'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-slate-950 shadow relative">
              <Calculator className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[11px] font-sans font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight">
            {unlockedApps.refundCalc ? 'Overpayment' : 'Overpay 🔒'}
          </span>
        </button>

        {/* 5. SwiftACH Wire Transfer Gateway */}
        <button
          onClick={() => toggleWindow('wireTransfer')}
          className="flex flex-col items-center gap-1 w-24 text-center group cursor-pointer relative"
        >
          <div
            className={`w-14 h-14 rounded-2xl border-2 shadow-lg flex items-center justify-center transition-all group-hover:scale-105 ${
              unlockedApps.wireTransfer
                ? 'bg-white/15 hover:bg-white/25 border-white/30 backdrop-blur-md'
                : 'bg-black/30 border-white/15 backdrop-blur-sm opacity-60'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow relative">
              <Landmark className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[11px] font-sans font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight">
            {unlockedApps.wireTransfer ? 'ACH Wire' : 'ACH Wire 🔒'}
          </span>
        </button>

        {/* 6. SysClean Anti-Malware */}
        <button
          onClick={() => toggleWindow('malwareScanner')}
          className="flex flex-col items-center gap-1 w-24 text-center group cursor-pointer relative"
        >
          <div
            className={`w-14 h-14 rounded-2xl border-2 shadow-lg flex items-center justify-center transition-all group-hover:scale-105 ${
              unlockedApps.malwareScanner
                ? 'bg-white/15 hover:bg-white/25 border-white/30 backdrop-blur-md'
                : 'bg-black/30 border-white/15 backdrop-blur-sm opacity-60'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-700 flex items-center justify-center text-white shadow relative">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[11px] font-sans font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight">
            {unlockedApps.malwareScanner ? 'SysClean' : 'SysClean 🔒'}
          </span>
        </button>

        {/* 7. Store App */}
        <button
          onClick={() => toggleWindow('store')}
          className="flex flex-col items-center gap-1 w-24 text-center group cursor-pointer"
        >
          <div className="w-14 h-14 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border-2 border-white/30 shadow-lg flex items-center justify-center text-white transition-all group-hover:scale-105 group-hover:border-cyan-400">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[11px] font-sans font-bold text-cyan-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-white leading-tight">
            Store App
          </span>
        </button>

        {/* 8. Identity SSN Stealer */}
        <button
          onClick={() => toggleWindow('identity')}
          className="flex flex-col items-center gap-1 w-24 text-center group cursor-pointer"
        >
          <div className="w-14 h-14 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border-2 border-white/30 shadow-lg flex items-center justify-center text-white transition-all group-hover:scale-105 group-hover:border-red-400">
            <div className="w-10 h-10 rounded-xl bg-[#782328] flex items-center justify-center text-amber-300 shadow">
              <Shield className="w-6 h-6 fill-current" />
            </div>
          </div>
          <span className="text-[11px] font-sans font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-red-300 leading-tight">
            Identity
          </span>
        </button>
      </div>

      {/* Main Draggable Desktop Windows */}

      {/* 1. Credit Card Terminal App */}
      <DraggableWindow
        id="creditCard"
        title="Credit Card Terminal — Apex POS Gateway v4.8"
        icon={
          <div className="w-5 h-5 bg-emerald-700 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        }
        initialPos={{ x: 260, y: 50 }}
        initialSize={{ width: 540, height: 530 }}
        isOpen={activeWindows.creditCard}
        zIndex={zIndices.creditCard}
        onClose={() => toggleWindow('creditCard')}
        onMinimize={() => toggleWindow('creditCard')}
        onFocus={() => bringToFront('creditCard')}
      >
        <CreditCardApp
          currentCaller={caller}
          shiftDay={shiftDay}
          onProcessSuccess={handleCreditCardSuccess}
        />
      </DraggableWindow>

      {/* 2. Target Psychological Assessment Window */}
      <DraggableWindow
        id="assessment"
        title="Target Psychological Assessment — Lead Telemetry"
        icon={
          <div className="w-5 h-5 bg-purple-700 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
            <Brain className="w-3.5 h-3.5" />
          </div>
        }
        initialPos={{ x: 280, y: 80 }}
        initialSize={{ width: 450, height: 440 }}
        isOpen={activeWindows.assessment}
        zIndex={zIndices.assessment}
        onClose={() => toggleWindow('assessment')}
        onMinimize={() => toggleWindow('assessment')}
        onFocus={() => bringToFront('assessment')}
      >
        <AssessmentApp caller={caller} />
      </DraggableWindow>

      {/* 3. Phone Window */}
      <DraggableWindow
        id="phone"
        title="Phone"
        icon={
          <div className="w-5 h-5 bg-[#2e7d32] rounded flex items-center justify-center text-white text-[11px] shadow-sm">
            <Phone className="w-3.5 h-3.5 fill-current" />
          </div>
        }
        initialPos={{ x: 820, y: 35 }}
        initialSize={{ width: 440, height: 520 }}
        isOpen={activeWindows.phone}
        zIndex={zIndices.phone}
        onClose={() => toggleWindow('phone')}
        onMinimize={() => toggleWindow('phone')}
        onFocus={() => bringToFront('phone')}
      >
        <PhoneWindow
          caller={caller}
          onSendMessage={handleSendMessage}
          onHangUp={handleHangUp}
          onStartCall={fetchNextCaller}
          isCallerTalking={isCallerTalking}
          isProcessing={isProcessing}
          onMakeMoreSuspicious={handleMakeMoreSuspicious}
          onSootheCaller={handleSootheCaller}
        />
      </DraggableWindow>

      {/* AnyViewer Remote Desktop Window (Fake PC with folders and cute dogs) */}
      {unlockedApps.anyViewer && (
        <DraggableWindow
          id="anyViewer"
          title={`AnyViewer Remote Desktop v4.8 — ${caller ? `${caller.name.toUpperCase()}'S WORKSTATION` : 'STANDBY'}`}
          icon={
            <div className="w-5 h-5 bg-sky-600 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
              <Monitor className="w-3.5 h-3.5" />
            </div>
          }
          initialPos={{ x: 250, y: 40 }}
          initialSize={{ width: 680, height: 530 }}
          isOpen={activeWindows.anyViewer}
          zIndex={zIndices.anyViewer || 16}
          onClose={() => toggleWindow('anyViewer')}
          onMinimize={() => toggleWindow('anyViewer')}
          onFocus={() => bringToFront('anyViewer')}
        >
          <AnyViewerApp
            caller={caller}
            onAutoFillCreditCard={(card) => {
              bringToFront('creditCard');
              setActiveWindows((prev) => ({ ...prev, creditCard: true }));
              soundManager.playChaChing();
            }}
            onAutoFillWireTransfer={(wire) => {
              if (unlockedApps.wireTransfer) {
                bringToFront('wireTransfer');
                setActiveWindows((prev) => ({ ...prev, wireTransfer: true }));
                soundManager.playChaChing();
              } else {
                toggleWindow('store');
              }
            }}
            onCopyText={(text) => {
              soundManager.playKeyTone(7);
            }}
          />
        </DraggableWindow>
      )}

      {/* 4. Overpayment Matrix App */}
      {unlockedApps.refundCalc && (
        <DraggableWindow
          id="refundCalc"
          title="Overpayment Matrix — Accidental Wire Multiplier"
          icon={
            <div className="w-5 h-5 bg-amber-600 rounded flex items-center justify-center text-slate-950 text-[11px] font-bold shadow-sm">
              <Calculator className="w-3.5 h-3.5" />
            </div>
          }
          initialPos={{ x: 300, y: 100 }}
          initialSize={{ width: 480, height: 490 }}
          isOpen={activeWindows.refundCalc}
          zIndex={zIndices.refundCalc}
          onClose={() => toggleWindow('refundCalc')}
          onMinimize={() => toggleWindow('refundCalc')}
          onFocus={() => bringToFront('refundCalc')}
        >
          <RefundCalculatorApp
            currentCaller={caller}
            shiftDay={shiftDay}
            onDrainSuccess={handleDrainSuccess}
            onSendScriptToPhone={(script) => {
              handleSendMessage(script);
            }}
          />
        </DraggableWindow>
      )}

      {/* 5. SwiftACH Wire Transfer Gateway */}
      {unlockedApps.wireTransfer && (
        <DraggableWindow
          id="wireTransfer"
          title="SwiftACH Direct Wire Gateway — Federal Routing Portal"
          icon={
            <div className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          }
          initialPos={{ x: 240, y: 90 }}
          initialSize={{ width: 480, height: 490 }}
          isOpen={activeWindows.wireTransfer}
          zIndex={zIndices.wireTransfer}
          onClose={() => toggleWindow('wireTransfer')}
          onMinimize={() => toggleWindow('wireTransfer')}
          onFocus={() => bringToFront('wireTransfer')}
        >
          <WireTransferApp
            currentCaller={caller}
            shiftDay={shiftDay}
            onDrainSuccess={handleDrainSuccess}
          />
        </DraggableWindow>
      )}

      {/* 6. SysClean Anti-Malware Scanner */}
      {unlockedApps.malwareScanner && (
        <DraggableWindow
          id="malwareScanner"
          title="SysClean Kernel Defender v9.1 — Remote Trojan Scanner"
          icon={
            <div className="w-5 h-5 bg-rose-700 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          }
          initialPos={{ x: 340, y: 110 }}
          initialSize={{ width: 480, height: 460 }}
          isOpen={activeWindows.malwareScanner}
          zIndex={zIndices.malwareScanner}
          onClose={() => toggleWindow('malwareScanner')}
          onMinimize={() => toggleWindow('malwareScanner')}
          onFocus={() => bringToFront('malwareScanner')}
        >
          <MalwareScannerApp
            currentCaller={caller}
            shiftDay={shiftDay}
            onDrainSuccess={handleDrainSuccess}
          />
        </DraggableWindow>
      )}

      {/* 7. Cyber-Store & App Upgrades Window */}
      <DraggableWindow
        id="store"
        title="Cyber-Store & Upgrades — App Licenses & Tech"
        icon={
          <div className="w-5 h-5 bg-cyan-700 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
        }
        initialPos={{ x: 280, y: 70 }}
        initialSize={{ width: 580, height: 520 }}
        isOpen={activeWindows.store}
        zIndex={zIndices.store}
        onClose={() => toggleWindow('store')}
        onMinimize={() => toggleWindow('store')}
        onFocus={() => bringToFront('store')}
      >
        <StoreApp
          personalMoney={personalMoney}
          unlockedApps={unlockedApps}
          installedUpgrades={installedUpgrades}
          onUnlockApp={handleUnlockApp}
          onBuyHardwareUpgrade={handleBuyHardwareUpgrade}
          onOpenApp={(key) => {
            setActiveWindows((prev) => ({ ...prev, [key]: true }));
            bringToFront(key);
          }}
        />
      </DraggableWindow>

      {/* 8. Identity Social Security Stealer */}
      <DraggableWindow
        id="identity"
        title="Identity"
        icon={
          <div className="w-5 h-5 bg-[#782328] rounded flex items-center justify-center text-amber-300 text-[11px] shadow-sm">
            <Shield className="w-3.5 h-3.5 fill-current" />
          </div>
        }
        initialPos={{ x: 310, y: 160 }}
        initialSize={{ width: 480, height: 380 }}
        isOpen={activeWindows.identity}
        zIndex={zIndices.identity}
        onClose={() => toggleWindow('identity')}
        onMinimize={() => toggleWindow('identity')}
        onFocus={() => bringToFront('identity')}
      >
        <IdentityWindow caller={caller} onVerifySSN={handleVerifySSN} />
      </DraggableWindow>

      {/* 9. Gift Cards Terminal (Unlocked via Store) */}
      {unlockedApps.giftCards && (
        <DraggableWindow
          id="giftCards"
          title="Retail Voucher & Gift Cards Terminal"
          icon={
            <div className="w-5 h-5 bg-amber-700 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          }
          initialPos={{ x: 340, y: 120 }}
          initialSize={{ width: 460, height: 460 }}
          isOpen={activeWindows.giftCards}
          zIndex={zIndices.giftCards}
          onClose={() => toggleWindow('giftCards')}
          onMinimize={() => toggleWindow('giftCards')}
          onFocus={() => bringToFront('giftCards')}
        >
          <GiftCardsWindow caller={caller} onRedeemSuccess={handleRedeemGiftCardSuccess} />
        </DraggableWindow>
      )}

      {/* 10. Operator Camera Window (Unlocked via Store) */}
      {unlockedApps.camera && (
        <DraggableWindow
          id="camera"
          title="Camera"
          icon={
            <div className="w-5 h-5 bg-neutral-900 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
              <Camera className="w-3.5 h-3.5" />
            </div>
          }
          initialPos={{ x: 680, y: 25 }}
          initialSize={{ width: 460, height: 350 }}
          isOpen={activeWindows.camera}
          zIndex={zIndices.camera}
          onClose={() => toggleWindow('camera')}
          onMinimize={() => toggleWindow('camera')}
          onFocus={() => bringToFront('camera')}
        >
          <CameraWindow
            isCallerTalking={isCallerTalking}
            callerName={caller?.name}
          />
        </DraggableWindow>
      )}

      {/* 11. SysKey Federal Lockdown App */}
      {unlockedApps.sysKeyLock && (
        <DraggableWindow
          id="sysKeyLock"
          title="SysKey v9.0 Enterprise Locker — Remote Screen Encryptor"
          icon={
            <div className="w-5 h-5 bg-rose-800 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
              <Lock className="w-3.5 h-3.5" />
            </div>
          }
          initialPos={{ x: 360, y: 110 }}
          initialSize={{ width: 480, height: 460 }}
          isOpen={activeWindows.sysKeyLock}
          zIndex={zIndices.sysKeyLock}
          onClose={() => toggleWindow('sysKeyLock')}
          onMinimize={() => toggleWindow('sysKeyLock')}
          onFocus={() => bringToFront('sysKeyLock')}
        >
          <SysKeyLockApp
            caller={caller}
            onChargeSuccess={handleDrainSuccess}
            onModifySuspicion={(delta) => {
              if (caller) {
                setCaller((prev) => prev ? { ...prev, suspicion: Math.min(100, Math.max(0, prev.suspicion + delta)) } : null);
              }
            }}
          />
        </DraggableWindow>
      )}

      {/* 12. VoIP Tactical Soundboard */}
      {unlockedApps.voipSoundboard && (
        <DraggableWindow
          id="voipSoundboard"
          title="VoIP Tactical Soundboard Rack — Acoustic Social Engineering"
          icon={
            <div className="w-5 h-5 bg-cyan-800 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
              <Mic className="w-3.5 h-3.5" />
            </div>
          }
          initialPos={{ x: 420, y: 130 }}
          initialSize={{ width: 480, height: 420 }}
          isOpen={activeWindows.voipSoundboard}
          zIndex={zIndices.voipSoundboard}
          onClose={() => toggleWindow('voipSoundboard')}
          onMinimize={() => toggleWindow('voipSoundboard')}
          onFocus={() => bringToFront('voipSoundboard')}
        >
          <VoIPSoundboardApp
            onModifySuspicion={(delta) => {
              if (caller) {
                setCaller((prev) => prev ? { ...prev, suspicion: Math.min(100, Math.max(0, prev.suspicion + delta)) } : null);
              }
            }}
          />
        </DraggableWindow>
      )}

      {/* 13. Federal Reserve Crypto Safe Vault */}
      {unlockedApps.cryptoVault && (
        <DraggableWindow
          id="cryptoVault"
          title="Federal Reserve Crypto Safe Vault ATM — Blockchain Escrow"
          icon={
            <div className="w-5 h-5 bg-amber-700 rounded flex items-center justify-center text-white text-[11px] shadow-sm">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          }
          initialPos={{ x: 380, y: 90 }}
          initialSize={{ width: 480, height: 480 }}
          isOpen={activeWindows.cryptoVault}
          zIndex={zIndices.cryptoVault}
          onClose={() => toggleWindow('cryptoVault')}
          onMinimize={() => toggleWindow('cryptoVault')}
          onFocus={() => bringToFront('cryptoVault')}
        >
          <CryptoVaultApp
            caller={caller}
            onChargeSuccess={handleDrainSuccess}
          />
        </DraggableWindow>
      )}

      {/* Upgraded AI Boss Performance Review Modal with Gameplay Clip Replays */}
      <PerformanceReviewModal
        isOpen={isReviewModalOpen}
        shiftDay={shiftDay}
        personalMoney={personalMoney}
        teamMoney={teamMoney}
        quota={quota}
        onContinueNextDay={handleContinueNextDay}
        onRetryShift={handleRetryShift}
        onRequestExtension={handleRequestExtension}
        onClose={() => setIsReviewModalOpen(false)}
      />

      {/* "SCAMMY HAS AN IDEA" Bottom-Right Assistant Widget */}
      <ScammyWidget caller={caller} />

      {/* Retro OS Bottom Taskbar */}
      <DesktopTaskbar
        personalMoney={personalMoney}
        teamMoney={teamMoney}
        quota={quota}
        unlockedApps={unlockedApps}
        activeWindows={activeWindows}
        onToggleWindow={toggleWindow}
        onOpenStore={() => toggleWindow('store')}
        reviewTimerSeconds={reviewTimerSeconds}
        onOpenReview={() => setIsReviewModalOpen(true)}
        shiftDay={shiftDay}
        isCallActive={Boolean(caller)}
        onStartCall={fetchNextCaller}
      />
    </div>
  );
}
