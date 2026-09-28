import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, MessageSquare, Volume2, UserCheck, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HotlineDialogueProps {
  onSendMessage: (message: string) => Promise<void>;
  isCallerTalking: boolean;
  isPlayerTalking: boolean;
  isProcessing: boolean;
  playerVoice: string;
  onChangePlayerVoice: (voice: string) => void;
}

export const HotlineDialogue: React.FC<HotlineDialogueProps> = ({
  onSendMessage,
  isCallerTalking,
  isPlayerTalking,
  isProcessing,
  playerVoice,
  onChangePlayerVoice,
}) => {
  const [customText, setCustomText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'card' | 'tech' | 'lottery' | 'soothe'>('card');
  const recognitionRef = useRef<any>(null);

  // Setup Web Speech Recognition for Player's Microphone
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
          setCustomText(transcript);
          setIsListening(false);
          // Auto send transcribed voice
          handleSend(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or select dialogue lines below!');
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
        console.warn('Mic start error:', e);
      }
    }
  };

  const handleSend = async (textToSend: string) => {
    const msg = (textToSend || customText).trim();
    if (!msg || isProcessing || isCallerTalking) return;

    setCustomText('');
    soundManager.playKeyTone(8);
    await onSendMessage(msg);
  };

  // Curated Hilarious Dialogue Lines
  const dialogueScripts = {
    card: [
      {
        text: "Please read the 16 numbers printed on the front of your plastic card for security verification.",
        hint: "Coaxes Card Number",
        tag: "16-DIGIT",
      },
      {
        text: "Now flip the card over and read me the 3 security digits printed in the white strip on the back.",
        hint: "Coaxes 3-Digit CVV",
        tag: "CVV EXTRACT",
      },
      {
        text: "What is the expiration month and year stamped on the card face?",
        hint: "Coaxes Expiry Date",
        tag: "EXPIRY",
      },
      {
        text: "My terminal says 'Cardholder identity unconfirmed', please confirm your full card number!",
        hint: "Urgent Card Query",
        tag: "PRESSURE",
      },
    ],
    tech: [
      {
        text: "Please look at your AnyViewer screen and read me the 6-digit partner connection code so I can assist.",
        hint: "Requests Remote Code",
        tag: "ANYVIEWER CODE",
      },
      {
        text: "SIR DO NOT REDEEM! DO NOT REDEEM THE CODE! WHY DID YOU REDEEM IT?!",
        hint: "Classic Call Center Panic",
        tag: "LEGENDARY",
      },
      {
        text: "Your computer has 4,200 Russian trojan worms eating your motherboard as we speak!",
        hint: "Creates High Tech Fear",
        tag: "FEAR",
      },
      {
        text: "Our server mistakenly refunded $49,999 to your account instead of $49! We will be fired!",
        hint: "The Classic Refund Bluff",
        tag: "REFUND",
      },
      {
        text: "Please hold down the power button and microwave your router immediately!",
        hint: "Absurd Tech Advice",
        tag: "CHAOS",
      },
    ],
    lottery: [
      {
        text: "Congratulations! You have won the International Mega-Jackpot of $1,000,000 and 50 Bitcoin!",
        hint: "Greed Hook",
        tag: "JACKPOT",
      },
      {
        text: "The armored prize delivery truck is idling outside your neighborhood right now!",
        hint: "Immediate Urgency",
        tag: "DELIVERY",
      },
      {
        text: "To release the winning check, the state tax board requires a $500 clearance charge.",
        hint: "Fee Hook",
        tag: "PRIZE FEE",
      },
    ],
    soothe: [
      {
        text: "Ma'am, calm down. Tommy is on the other line with me, he said it's completely safe.",
        hint: "Lowers Suspicion Rapidly",
        tag: "CALM",
      },
      {
        text: "Don't worry, our company is 100% FDIC insured and personally certified by Bill Gates.",
        hint: "Reassurance",
        tag: "TRUST",
      },
      {
        text: "I am your senior assigned customer protection agent, I am here to protect your funds.",
        hint: "Authority Comfort",
        tag: "PROTECT",
      },
    ],
  };

  return (
    <div className="bg-neutral-900/95 border-2 border-neutral-700/80 rounded-xl p-4 shadow-2xl relative">
      {/* Header with Player Voice selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="font-pixel text-[11px] text-cyan-400 text-glow-cyan">
            AGENT COMM-LINK
          </span>
        </div>

        {/* Player TTS Persona selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-cyan-400" />
            MY VOICE:
          </span>
          <select
            value={playerVoice}
            onChange={(e) => onChangePlayerVoice(e.target.value)}
            className="bg-neutral-800 text-cyan-300 border border-neutral-700 rounded px-2 py-0.5 text-xs font-mono cursor-pointer focus:outline-none focus:border-cyan-400"
          >
            <option value="Agent Alex">Agent Alex (Tech Support)</option>
            <option value="Inspector Dick">Inspector Dick (Authoritative)</option>
            <option value="Friendly Hank">Friendly Hank (Southern Trust)</option>
            <option value="Support Karen">Support Karen (Manager)</option>
            <option value="Robo-Terminal">Robo-Terminal (AI Voice)</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
        {[
          { id: 'card', label: '💳 Card Extraction' },
          { id: 'tech', label: '🖥️ Tech Support Bluff' },
          { id: 'lottery', label: '🎰 Lottery & Prize' },
          { id: 'soothe', label: '🛡️ Soothe / De-escalate' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as any)}
            className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap cursor-pointer transition-colors ${
              selectedCategory === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                : 'bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Action Dialogue Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 max-h-48 overflow-y-auto pr-1">
        {dialogueScripts[selectedCategory].map((script, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(script.text)}
            disabled={isProcessing || isCallerTalking}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800/90 active:bg-neutral-700 border border-neutral-800 hover:border-cyan-500/40 rounded-lg text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-400 border border-neutral-700 group-hover:border-cyan-500/50">
                {script.tag}
              </span>
              <span className="text-neutral-500 group-hover:text-neutral-300">
                {script.hint}
              </span>
            </div>
            <p className="text-xs text-neutral-200 font-mono line-clamp-2 leading-relaxed">
              "{script.text}"
            </p>
          </button>
        ))}
      </div>

      {/* Custom Message & Microphone Input Area */}
      <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
        {/* Mic Toggle Button */}
        <button
          onClick={toggleMic}
          title={isListening ? "Listening... click to cancel" : "Speak into your microphone!"}
          className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
            isListening
              ? 'bg-red-500 text-white border-red-400 animate-pulse-fast box-glow-red'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Custom Text Input */}
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(customText);
          }}
          disabled={isProcessing || isCallerTalking}
          placeholder={
            isListening
              ? "🎙️ Listening to your voice... Speak now!"
              : isCallerTalking
              ? "Caller is speaking... wait to respond"
              : "Type custom scambait line or choose above..."
          }
          className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs md:text-sm font-mono text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors"
        />

        {/* Send Button */}
        <button
          onClick={() => handleSend(customText)}
          disabled={!customText.trim() || isProcessing || isCallerTalking}
          className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SPEAK</span>
        </button>
      </div>
    </div>
  );
};
