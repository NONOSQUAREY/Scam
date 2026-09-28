import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Camera, Mic, Video, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface CameraWindowProps {
  isCallerTalking: boolean;
  callerName?: string;
}

export const CameraWindow: React.FC<CameraWindowProps> = ({
  isCallerTalking,
  callerName,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isScreenRecordActive, setIsScreenRecordActive] = useState(true);

  return (
    <div className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col justify-between select-none h-full w-full">
      {/* Call Center Operator Office Camera image */}
      <div className="relative flex-1 w-full overflow-hidden">
        <img
          src="/src/assets/images/call_center_operator_camera_1790157829437.jpg"
          alt="Call Center Operator Webcam"
          className="w-full h-full object-cover object-center"
        />

        {/* Subtle live audio pulsing light on headset microphone */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className={`absolute top-[48%] left-[49%] w-2 h-2 rounded-full ${
              isCallerTalking ? 'bg-emerald-400 animate-ping' : 'bg-emerald-600'
            } opacity-80`}
          />
        </div>

        {/* Live Call Center Status Tag */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-sm border border-neutral-700/60 rounded px-2 py-0.5 text-[10px] font-mono text-neutral-300 flex items-center gap-1.5 shadow">
          <span
            className={`w-2 h-2 rounded-full ${
              isCallerTalking ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
            }`}
          />
          <span>OPERATOR CUBICLE #09 // LIVE VOIP FEED</span>
        </div>

        {/* Active Screen Record Pill */}
        <div className="absolute top-2.5 right-2.5 bg-red-950/85 backdrop-blur-sm border border-red-700/70 rounded px-2 py-0.5 text-[10px] font-mono text-red-300 flex items-center gap-1.5 shadow">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-bold">SCREEN RECORD: ACTIVE</span>
        </div>
      </div>

      {/* Expandable Permissions & Settings Drawer */}
      {showControls && (
        <div className="bg-neutral-950/95 border-t border-neutral-800 p-2.5 space-y-2 font-mono text-[10px] z-10 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-800 pb-1">
            <span className="font-bold text-neutral-200">OS SYSTEM PERMISSIONS</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>FRAME COMPLIANT</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {/* 1. Camera */}
            <div className="flex items-center justify-between bg-neutral-900/80 px-2 py-1 rounded border border-neutral-800">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Camera className="w-3 h-3 text-cyan-400" />
                <span>Camera (Webcam)</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                GRANTED
              </span>
            </div>

            {/* 2. Microphone */}
            <div className="flex items-center justify-between bg-neutral-900/80 px-2 py-1 rounded border border-neutral-800">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Mic className="w-3 h-3 text-amber-400" />
                <span>Microphone (Audio)</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                GRANTED
              </span>
            </div>

            {/* 3. Screen Record */}
            <div className="flex items-center justify-between bg-neutral-900/80 px-2 py-1 rounded border border-neutral-800">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Video className="w-3 h-3 text-rose-400" />
                <span>Screen Record (Surveillance)</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                <span>GRANTED & RECORDING</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom "^ Show / Hide" control toggle */}
      <div className="bg-neutral-950/90 hover:bg-neutral-900 border-t border-neutral-800 py-1 flex items-center justify-center cursor-pointer text-xs font-mono text-neutral-300 transition-colors shrink-0">
        <button
          onClick={() => {
            setShowControls(!showControls);
            soundManager.playKeyTone(2);
          }}
          className="flex items-center gap-1 text-[11px] hover:text-white cursor-pointer"
        >
          {showControls ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          <span>{showControls ? 'Hide Permissions' : 'Permissions & Hardware'}</span>
        </button>
      </div>
    </div>
  );
};

