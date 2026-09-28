import React, { useState, useEffect, useRef } from 'react';
import { Caller } from '../types/game';
import { Send, Mic, MicOff, PhoneOff, Phone, Volume2, Languages, Lock, Unlock, AlertTriangle, Heart, Flame, Brain, Radio, Activity, Zap, Play } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface PhoneWindowProps {
  caller: Caller | null;
  onSendMessage: (message: string) => Promise<void>;
  onHangUp: () => void;
  onStartCall?: () => void;
  isCallerTalking: boolean;
  isProcessing: boolean;
  onMakeMoreSuspicious?: () => void;
  onSootheCaller?: () => void;
}

export const PhoneWindow: React.FC<PhoneWindowProps> = ({
  caller,
  onSendMessage,
  onHangUp,
  onStartCall,
  isCallerTalking,
  isProcessing,
  onMakeMoreSuspicious,
  onSootheCaller,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showScriptsMenu, setShowScriptsMenu] = useState(false);
  const [volume, setVolume] = useState(80);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Typewriter effect state for the latest incoming caller message
  const [typewriterLength, setTypewriterLength] = useState<number>(0);
  const [skipTypewriter, setSkipTypewriter] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Call duration timer
  useEffect(() => {
    setCallDurationSeconds(0);
    const timer = setInterval(() => {
      setCallDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [caller?.id]);

  const formatCallDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Typewriter stream controller for the latest caller message
  const latestMessage = caller?.dialogueHistory[caller.dialogueHistory.length - 1];
  const isLatestCaller = latestMessage?.role === 'caller';

  useEffect(() => {
    if (!latestMessage || !isLatestCaller) {
      setTypewriterLength(latestMessage ? latestMessage.text.length : 0);
      return;
    }

    setSkipTypewriter(false);
    setTypewriterLength(0);

    const fullLength = latestMessage.text.length;
    // Calculate typing speed synced directly to talking speed:
    // Natural human speech cadence: ~14-16 chars/sec (~55-65ms/char)
    const intervalMs = isCallerTalking
      ? Math.max(48, Math.min(68, Math.floor(4800 / Math.max(fullLength, 25))))
      : 28;

    let tickCounter = 0;
    const timer = setInterval(() => {
      setTypewriterLength((prev) => {
        if (prev >= fullLength) {
          clearInterval(timer);
          return fullLength;
        }
        tickCounter++;
        // Play soft subtle typewriter click on every 3 characters
        if (tickCounter % 3 === 0) {
          soundManager.playTypewriterClick();
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [caller?.dialogueHistory.length, isLatestCaller]);

  // When caller finishes speaking, smoothly complete any remaining characters immediately
  useEffect(() => {
    if (!isCallerTalking && latestMessage && isLatestCaller && !skipTypewriter) {
      setTypewriterLength(latestMessage.text.length);
    }
  }, [isCallerTalking]);

  // If user clicks or wants instant text, reveal full message
  const handleSkipTypewriter = () => {
    if (latestMessage) {
      setSkipTypewriter(true);
      setTypewriterLength(latestMessage.text.length);
      soundManager.playKeyTone(8);
    }
  };

  // Setup Web Speech Recognition for Player mic
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setIsListening(false);
          onSendMessage(transcript);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [onSendMessage]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Microphone speech recognition is supported in Chrome/Edge browsers. You can also type or use the scripts menu!');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        soundManager.playKeyTone(3);
      } catch (e) {
        console.warn('Mic error:', e);
      }
    }
  };

  const handleSend = () => {
    const msg = inputText.trim();
    if (!msg || isProcessing || isCallerTalking) return;
    setInputText('');
    onSendMessage(msg);
  };

  const handleQuickScript = (text: string) => {
    setShowScriptsMenu(false);
    onSendMessage(text);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [caller?.dialogueHistory, isCallerTalking, typewriterLength]);

  // Caller trust calculation
  const trustValue = caller ? Math.max(5, 100 - caller.suspicion) : 50;
  const trustLabel =
    trustValue >= 70 ? 'HIGH' : trustValue >= 40 ? 'NEUTRAL' : 'SUSPICIOUS';

  const isHighSuspicion = (caller?.suspicion || 0) >= 65;
  const isSmartCaller = caller?.personality?.includes('Tech') || caller?.personality?.includes('Sharp') || caller?.personality?.includes('Analytical') || caller?.personality?.includes('Smart');

  const quickScripts = [
    { label: '📛 Ask for Caller\'s Full Name', text: 'Could you please state your full name for our customer verification file?' },
    { label: '📡 Ask for AnyViewer Code', text: 'Could you please open AnyViewer on your screen and read me your 6-digit partner ID?' },
    { label: '🧠 Smart Tech Explanation (For Smart Callers)', text: 'Our merchant server flagged an SSL session token mismatch in your local cache that must be cleared to reverse the debit.' },
    { label: '📊 Accounting Clearinghouse Protocol', text: 'I have transaction batch reference #981-Delta queued for reversal in our central merchant clearinghouse.' },
    { label: '🔍 Verify Unauthorized Charge', text: 'I am looking into that pending authorization on your account right now. Let me connect to resolve it.' },
    { label: '💳 Ask for 16-Digit Card Number', text: 'To authenticate your account for the cancellation refund, please read the 16 digits on your card.' },
    { label: '📅 Ask for Expiration Date', text: 'What is the expiration month and year printed on the front of that card?' },
    { label: '🔒 Request 3-Digit CVV Security Code', text: 'For secure 256-bit bank merchant authentication, I also need the 3-digit security code on the back.' },
    { label: '🤝 Soothe Cautious Caller', text: 'I completely understand your caution. Please rest assured this transaction is 100% bank verified and FDIC insured.' },
    { label: '⚡ Stand By For Authorization', text: 'Please remain on the line for a moment while I submit this reversal through the merchant terminal.' },
  ];

  // Dynamic Audio waveform heights generator
  const waveformHeights = [
    12, 28, 45, 20, 60, 85, 40, 75, 95, 55, 30, 70, 90, 48, 80, 100, 65, 35, 75, 50, 85, 30, 60, 40, 20
  ];

  if (!caller) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#080d1a] select-none relative overflow-hidden font-sans border border-slate-800 p-6 items-center justify-center text-center">
        {/* Glowing Dial Interface */}
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-4 border-emerald-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.25)] mb-4 relative">
          <Phone className="w-12 h-12 text-emerald-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#080d1a] animate-ping" />
        </div>

        <h3 className="text-lg font-mono font-black text-slate-100 tracking-wider mb-1">
          HOTLINE LINE 1: IDLE / ON HOOK
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mb-6">
          Call queue is standing by. When you're ready to engage the next target, press the Dial button below.
        </p>

        <button
          onClick={() => {
            soundManager.playPhonePickup();
            if (onStartCall) onStartCall();
          }}
          disabled={isProcessing}
          className="w-full max-w-xs py-3.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-neutral-950 font-black font-mono rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 hover:scale-[1.02] active:scale-95 cursor-pointer transition-all border-2 border-emerald-400"
        >
          <Phone className="w-5 h-5 fill-current" />
          <span>{isProcessing ? 'DIALING LEAD...' : 'DIAL NEXT CALL'}</span>
        </button>

        <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-xs text-[10px] font-mono text-slate-400">
          <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-left">
            <span className="text-slate-500 block">QUEUE STATUS</span>
            <span className="text-emerald-400 font-bold">14 LEADS WAITING</span>
          </div>
          <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-left">
            <span className="text-slate-500 block">AUDIO LINE</span>
            <span className="text-cyan-400 font-bold">24kHz HD READY</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] select-none relative overflow-hidden font-sans border border-slate-800">
      {/* Caller Trust Header */}
      <div className="bg-[#080c14] px-4 py-2 border-b border-slate-800/80 shrink-0">
        <div className="flex justify-between items-center text-xs font-mono mb-1">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold tracking-wider text-slate-300 text-[11px]">
              CALLER TRUST
            </span>
            {isSmartCaller && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[9px] font-bold flex items-center gap-1">
                <Brain className="w-2.5 h-2.5" /> SMART CALLER
              </span>
            )}
            {caller?.gender && (
              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[9px] font-bold uppercase">
                {caller.gender} voice
              </span>
            )}
            <span className="px-1.5 py-0.2 rounded bg-red-950/80 border border-red-800 text-red-400 text-[9px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>REC SCREEN</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold ${
                trustValue >= 70
                  ? 'text-emerald-400'
                  : trustValue >= 40
                  ? 'text-cyan-300'
                  : 'text-rose-400'
              }`}
            >
              {trustLabel}
            </span>
            <span className="text-[11px] font-bold text-cyan-400">{trustValue}%</span>
          </div>
        </div>

        {/* Cyan Trust Bar */}
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/60">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            style={{ width: `${trustValue}%` }}
          />
        </div>
      </div>

      {/* THE NAME BAR (Hidden initially per user request so the player has to ask for it) */}
      <div
        className={`px-3 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-mono transition-all duration-300 ${
          caller?.nameRevealed
            ? 'bg-blue-950/40 border-blue-800/70 text-blue-300'
            : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {caller?.nameRevealed ? (
            <Unlock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          )}

          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
            NAME BAR:
          </span>

          {caller?.nameRevealed ? (
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="bg-[#0b192c] text-[#38bdf8] font-bold px-2 py-0.5 rounded border border-[#0284c7]/60 text-[11px] tracking-wide truncate">
                ✓ {caller.name.toUpperCase()}
              </span>
              <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                {caller.personality || 'Standard'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="bg-slate-900 text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-800 text-[11px] tracking-widest">
                🔒 [HIDDEN — ASK CALLER]
              </span>
              <span className="text-[10px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                {caller?.personality || 'Neutral'}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls for Name Bar & Suspicion Adjustments */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!caller?.nameRevealed && (
            <button
              onClick={() => onSendMessage("Could you please state your full name for our customer verification file?")}
              className="px-2 py-0.5 bg-blue-950 hover:bg-blue-900 text-cyan-300 rounded text-[10px] font-mono border border-blue-800 hover:border-cyan-500 cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
              title="Ask caller for full name"
            >
              <span>💬 Ask Name</span>
            </button>
          )}

          {/* Soothe caller button */}
          {onSootheCaller && (
            <button
              onClick={onSootheCaller}
              className="px-2 py-0.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 rounded text-[10px] font-mono border border-emerald-800 hover:border-emerald-600 cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
              title="Soothe caller & reduce suspicion"
            >
              <Heart className="w-2.5 h-2.5 text-emerald-400" />
              <span>Soothe</span>
            </button>
          )}

          {/* Suspicion toggle button */}
          {onMakeMoreSuspicious && (
            <button
              onClick={onMakeMoreSuspicious}
              className="px-2 py-0.5 bg-amber-950/70 hover:bg-amber-900 text-amber-300 rounded text-[10px] font-mono border border-amber-800 hover:border-amber-600 cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
              title="Increase caller suspicion (for challenge)"
            >
              <Flame className="w-2.5 h-2.5 text-amber-400" />
              <span>Sus +15%</span>
            </button>
          )}
        </div>
      </div>

      {/* High Suspicion Warning Banner */}
      {isHighSuspicion && (
        <div className="bg-red-950/90 border-b border-red-700 px-3 py-1 flex items-center justify-between text-[11px] font-mono text-red-200 animate-pulse shrink-0">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>⚠️ HIGH RISK: Caller suspicion high ({caller?.suspicion}%)!</span>
          </span>
          <span className="text-[10px] text-red-300">Soothe or they may terminate call</span>
        </div>
      )}

      {/* Typewriter Speed / Instant Skip Bar if active typing */}
      {isLatestCaller && !skipTypewriter && typewriterLength < (latestMessage?.text.length || 0) && (
        <div className="bg-[#0b121e] px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono shrink-0 select-none">
          <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Caller Speaking...</span>
          </span>
          <button
            onClick={handleSkipTypewriter}
            className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 text-amber-300 flex items-center gap-1 text-[10px] font-mono cursor-pointer transition-all active:scale-95"
            title="Reveal the entire message immediately"
          >
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span>Instant Text</span>
          </button>
        </div>
      )}

      {/* Chat Messages Area with Refined Typewriter stream and selectable text */}
      <div className="flex-1 bg-[#090d16] p-3 overflow-y-auto space-y-3 phone-chat-scroll select-text">
        {caller?.dialogueHistory.map((item, idx) => {
          const isCaller = item.role === 'caller';
          const isLatest = idx === caller.dialogueHistory.length - 1;
          const isCurrentlyTyping = isCaller && isLatest && !skipTypewriter && typewriterLength < item.text.length;

          // Display text: either full text or typewriter slice for the active message
          const displayText = isCurrentlyTyping
            ? item.text.substring(0, typewriterLength)
            : item.text;

          return (
            <div
              key={idx}
              className={`flex flex-col ${isCaller ? 'items-start' : 'items-end'} text-xs font-sans group`}
            >
              {/* Name Tag above message */}
              <div className="flex items-center gap-2 mb-1 px-1 select-none">
                {isCaller ? (
                  /* Caller Bright Blue Tag */
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md font-bold tracking-wide flex items-center gap-1 bg-[#0b192c] text-[#38bdf8] border border-[#0284c7]/50 shadow-sm">
                    {caller.nameRevealed ? `✓ ${caller.name.toUpperCase()}` : 'CALLER [NAME HIDDEN]'}
                  </span>
                ) : (
                  /* User/Operator Coral Tag */
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md font-bold tracking-wide flex items-center gap-1 bg-[#240d0d] text-[#fb7185] border border-[#e11d48]/50 shadow-sm">
                    YOU (OPERATOR)
                  </span>
                )}

                {/* Speaking indicator */}
                {isCaller && isCallerTalking && isLatest && (
                  <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Speaking...</span>
                  </span>
                )}
              </div>

              {/* Message Bubble:
                  - Caller: dark blue bubble (#10243d) with crisp pale blue/white text
                  - User: dark reddish-brown bubble (#381414) with coral/rose text
                  - Fully selectable text without copy buttons
              */}
              <div
                onClick={isCurrentlyTyping ? handleSkipTypewriter : undefined}
                className={`max-w-[88%] rounded-2xl p-3 text-xs shadow-md leading-relaxed select-text cursor-text relative transition-all selection:bg-cyan-500/40 selection:text-white ${
                  isCaller
                    ? 'bg-[#10243d] text-[#e2e8f0] border border-[#1e3f66] rounded-tl-sm hover:border-[#2a5991]'
                    : 'bg-[#381414] text-[#fecdd3] border border-[#5c1d1d] rounded-tr-sm'
                }`}
              >
                <span className="select-text cursor-text">{displayText}</span>
                {isCurrentlyTyping && (
                  <span className="text-cyan-400 font-bold ml-0.5 animate-pulse inline-block select-none">
                    ▌
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono italic p-2 bg-[#0d1726]/60 rounded-xl border border-cyan-900/40 w-fit">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Caller is answering...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* DYNAMIC AUDIO WAVEFORM VISUALIZER (Per User Request) */}
      <div className="bg-[#070a12] border-t border-slate-800/80 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className={`w-3.5 h-3.5 ${isCallerTalking ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">
            {isCallerTalking ? '🎙️ VOICE STREAM: TRANSMITTING' : '● CALL ACTIVE'}
          </span>
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
            {formatCallDuration(callDurationSeconds)}
          </span>
        </div>

        {/* Dancing Waveform Frequency Bars */}
        <div className="flex items-center gap-0.5 h-5 px-2 bg-slate-950/80 rounded border border-slate-800/60 overflow-hidden">
          {waveformHeights.map((h, i) => {
            const isSpeaking = isCallerTalking || isProcessing;
            const currentHeight = isSpeaking
              ? Math.max(15, (h * ((i % 3) + 1) * 1.5) % 100)
              : Math.max(10, h * 0.25);

            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? i % 2 === 0
                      ? 'bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.8)]'
                      : 'bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.8)]'
                    : 'bg-slate-700/60'
                }`}
                style={{
                  height: `${currentHeight}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Quick Scripts Floating Menu */}
      {showScriptsMenu && (
        <div className="absolute bottom-24 left-3 right-3 bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-2xl z-30 space-y-1.5 max-h-56 overflow-y-auto phone-chat-scroll">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 border-b border-slate-800 pb-1">
            <span>OPERATOR PROTOCOL SCRIPTS</span>
            <button
              onClick={() => setShowScriptsMenu(false)}
              className="text-slate-500 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          {quickScripts.map((script, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickScript(script.text)}
              className="w-full text-left p-1.5 hover:bg-slate-800 rounded-lg text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between group cursor-pointer"
            >
              <span className="font-medium truncate pr-2">{script.label}</span>
              <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 shrink-0 font-mono">
                SEND ↵
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="p-3 bg-[#080c14] border-t border-slate-800 space-y-2 shrink-0">
        {/* Input field + Send button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={
              isListening
                ? '🎙️ Listening to your microphone...'
                : caller?.nameRevealed
                ? `Type message to ${caller.name}...`
                : 'Type message (Ask for their name)...'
            }
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isProcessing}
            className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-medium disabled:opacity-40 cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons Row: [文A Scripts] [BOLD RED HANG UP] [Volume] [Mic] */}
        <div className="flex items-center justify-between gap-2 relative">
          {/* Quick Script Button: 文A */}
          <button
            type="button"
            onClick={() => setShowScriptsMenu(!showScriptsMenu)}
            title="Operator Protocol Scripts"
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold">文A Scripts</span>
          </button>

          {/* BOLD RED HANG UP BUTTON */}
          <button
            type="button"
            onClick={() => {
              if (recognitionRef.current && isListening) {
                try {
                  recognitionRef.current.stop();
                } catch (e) {}
                setIsListening(false);
              }
              soundManager.stopAudio();
              onHangUp();
            }}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-[#991b1b] to-[#b91c1c] hover:from-[#b91c1c] hover:to-[#dc2626] active:from-[#7f1d1d] active:to-[#991b1b] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/40 transition-all active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="tracking-wide">Hang Up</span>
          </button>

          {/* Speaker / Volume Button with Slider */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/80 cursor-pointer shadow-sm transition-colors"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Volume popup slider */}
            {showVolumeSlider && (
              <div className="absolute bottom-11 right-0 bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-2xl flex items-center gap-2 z-20">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    soundManager.setVolume(v / 100);
                  }}
                  className="w-20 accent-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-400">{volume}%</span>
              </div>
            )}
          </div>

          {/* Player Microphone Input Button */}
          <button
            type="button"
            onClick={toggleMic}
            title={isListening ? 'Stop listening' : 'Speak with your microphone (Direct to chat)'}
            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
              isListening
                ? 'bg-red-600 border-red-500 text-white animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
