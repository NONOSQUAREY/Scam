import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Video,
  FastForward,
  Sparkles,
  CheckCircle2,
  FileText,
  ScanText,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { gameplayRecorder, GameplayClip } from '../utils/gameplayRecorder';
import { videoClipGenerator } from '../utils/videoRecorder';
import confetti from 'canvas-confetti';

interface PerformanceReviewModalProps {
  isOpen: boolean;
  shiftDay: number;
  personalMoney: number;
  teamMoney: number;
  quota: number;
  onContinueNextDay: () => void;
  onRetryShift: () => void;
  onRequestExtension: () => void;
  onClose: () => void;
}

interface BossReviewData {
  bossMood: 'laughing_ecstatic' | 'furious_screaming' | 'smug_proud' | 'disappointed_facepalm';
  headline: string;
  quote: string;
  overallReview: string;
  strengths: string[];
  roasts: string[];
  clipCritiques: { clipId: string; reaction: 'laugh' | 'mad' | 'proud'; comment: string }[];
}

export const PerformanceReviewModal: React.FC<PerformanceReviewModalProps> = ({
  isOpen,
  shiftDay,
  personalMoney,
  teamMoney,
  quota,
  onContinueNextDay,
  onRetryShift,
  onRequestExtension,
  onClose,
}) => {
  const [clips, setClips] = useState<GameplayClip[]>([]);
  const [selectedClipIndex, setSelectedClipIndex] = useState(0);
  const [bossReview, setBossReview] = useState<BossReviewData | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(true);

  // Video Replay Playback State
  // Requirement: Play the video FIRST, then Boss Vikram explains afterwards!
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0); // 0 to 100
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [hasBossReactedForClip, setHasBossReactedForClip] = useState<Record<string, boolean>>({});
  const [isBossTalking, setIsBossTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const videoIntervalRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isPass = teamMoney >= quota;
  const difference = teamMoney - quota;

  // On modal open: generate clips & fetch AI Boss review
  // Strict rule: Only generate clips for people actually called in this shift
  useEffect(() => {
    if (!isOpen) {
      soundManager.stopAudio();
      return;
    }

    const generatedClips = gameplayRecorder.generateShiftClips(shiftDay);
    setClips(generatedClips);
    setSelectedClipIndex(0);
    setVideoProgress(0);
    setVideoSeconds(0);
    setIsPlayingVideo(true);
    setHasBossReactedForClip({});
    setIsLoadingReview(true);

    if (isPass) {
      soundManager.playChaChing();
      try {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
    } else {
      soundManager.playHangUp();
    }

    // Call Gemini Boss Review API
    fetch('/api/boss/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shiftDay,
        totalMoneyEarned: teamMoney,
        quota,
        quotaMet: isPass,
        clips: generatedClips,
        stats: { personalMoney },
      }),
    })
      .then((res) => res.json())
      .then((data: BossReviewData) => {
        setBossReview(data);
        setIsLoadingReview(false);
      })
      .catch((err) => {
        console.warn('Boss review fetch error, using fallback:', err);
        setIsLoadingReview(false);
      });
  }, [isOpen, shiftDay, teamMoney, quota]);

  const currentClip = clips[selectedClipIndex] || clips[0];
  const currentCritique = bossReview?.clipCritiques?.find((c) => c.clipId === currentClip?.id);

  // Generate real WebM video for the current clip
  useEffect(() => {
    if (!currentClip) {
      setCurrentVideoUrl('');
      return;
    }

    let isMounted = true;
    videoClipGenerator.generateVideoBlobUrl(currentClip).then((url) => {
      if (isMounted) {
        setCurrentVideoUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentClip?.id]);

  // Video fallback timer loop (used only when currentVideoUrl is not yet loaded into native video tag)
  useEffect(() => {
    if (!isOpen || !isPlayingVideo || !currentClip || currentVideoUrl) return;

    videoIntervalRef.current = setInterval(() => {
      setVideoProgress((prev) => {
        if (prev >= 100) {
          setIsPlayingVideo(false);
          return 100;
        }
        return prev + 3;
      });

      setVideoSeconds((prev) => Math.min(24, prev + 1));
    }, 250);

    return () => clearInterval(videoIntervalRef.current);
  }, [isOpen, isPlayingVideo, currentClip, currentVideoUrl]);

  // Trigger Boss explanation ONLY AFTER the video finishes playing!
  const triggerBossExplanation = (force: boolean = false) => {
    if (!currentClip || isLoadingReview || !bossReview) return;
    if (!force && hasBossReactedForClip[currentClip.id]) return;

    setHasBossReactedForClip((prev) => ({ ...prev, [currentClip.id]: true }));

    // Stop video and sound effects
    soundManager.stopAudio();

    if (isPass) {
      soundManager.playChaChing();
    } else {
      soundManager.playDeskSlam();
    }

    let speechText = '';
    if (selectedClipIndex === 0) {
      speechText = bossReview.quote || bossReview.overallReview;
    } else if (currentCritique?.comment) {
      speechText = currentCritique.comment;
    } else {
      speechText = isPass
        ? `[laughs hysterically] Look at that video! You completely extracted their cash on ${currentClip.callerName}!`
        : `[slams desk] Look at that screen footage! What was that on ${currentClip.callerName}?! You let them hang up!`;
    }

    if (!isMuted) {
      soundManager.speakBoss(
        speechText,
        bossReview.bossMood,
        () => setIsBossTalking(true),
        () => setIsBossTalking(false)
      );
    }
  };

  // Video ended callback: Video has finished playing -> Now Boss explains!
  const handleVideoEnded = () => {
    setIsPlayingVideo(false);
    setVideoProgress(100);
    triggerBossExplanation();
  };

  // When progress reaches 100% in fallback mode, trigger explanation
  useEffect(() => {
    if (videoProgress >= 100 && !isPlayingVideo && !hasBossReactedForClip[currentClip?.id || '']) {
      triggerBossExplanation();
    }
  }, [videoProgress, isPlayingVideo, currentClip?.id, isLoadingReview, bossReview]);

  // User manually skips the video to hear Boss Vikram explain immediately
  const handleSkipToExplanation = () => {
    setIsPlayingVideo(false);
    setVideoProgress(100);
    if (videoRef.current) {
      videoRef.current.currentTime = videoRef.current.duration || 12;
      videoRef.current.pause();
    }
    triggerBossExplanation(true);
  };

  // Handle Play/Pause
  const togglePlayPause = () => {
    if (videoProgress >= 100) {
      handleReplayVideo();
      return;
    }

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlayingVideo(true);
      } else {
        videoRef.current.pause();
        setIsPlayingVideo(false);
      }
    } else {
      setIsPlayingVideo(!isPlayingVideo);
    }
    soundManager.playKeyTone(3);
  };

  // Handle Replay Clip: Plays the video first again, stops Vikram from talking
  const handleReplayVideo = () => {
    soundManager.stopAudio();
    setIsBossTalking(false);
    setVideoProgress(0);
    setVideoSeconds(0);
    setIsPlayingVideo(true);
    setHasBossReactedForClip((prev) => ({ ...prev, [currentClip?.id || '']: false }));

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    soundManager.playKeyTone(6);
  };

  // Replay Boss Spoken Voice
  const handleReplayBossVoice = () => {
    triggerBossExplanation(true);
  };

  // Handle Switching Clip Tab
  const handleSelectClip = (idx: number) => {
    soundManager.stopAudio();
    setIsBossTalking(false);
    setSelectedClipIndex(idx);
    setVideoProgress(0);
    setVideoSeconds(0);
    setIsPlayingVideo(true);
    soundManager.playKeyTone(idx + 1);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  if (!isOpen) return null;

  const isVideoFinished = videoProgress >= 100 || !isPlayingVideo;
  const isVikramExplaining = isVideoFinished && (hasBossReactedForClip[currentClip?.id || ''] || isBossTalking);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <div
        className={`w-full max-w-4xl rounded-2xl border-4 shadow-2xl overflow-hidden font-sans flex flex-col my-auto transition-all ${
          isPass
            ? 'bg-[#0a1410] border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.35)]'
            : 'bg-[#180a0a] border-rose-600 shadow-[0_0_50px_rgba(225,29,72,0.35)]'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`px-4 py-2.5 flex items-center justify-between border-b ${
            isPass ? 'bg-emerald-950/95 border-emerald-700/60' : 'bg-rose-950/95 border-rose-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {isPass ? (
              <Award className="w-5 h-5 text-emerald-400 animate-bounce" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            )}
            <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-neutral-100">
              CALL SCREEN RECORDING TAPES // BOSS VIKRAM REVIEW
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
              SHIFT DAY #{shiftDay}
            </span>
            <span
              className={`font-mono text-xs font-black px-2.5 py-0.5 rounded border-2 shadow-sm ${
                isPass
                  ? 'bg-emerald-900 border-emerald-400 text-emerald-300'
                  : 'bg-rose-900 border-rose-400 text-rose-300'
              }`}
            >
              {isPass ? 'STATUS: PASSED' : 'STATUS: FAILED'}
            </span>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-3 sm:p-5 space-y-3.5 overflow-y-auto max-h-[86vh]">
          {/* Tape Selector Bar: ONLY SHOWS PEOPLE ACTUALLY CALLED */}
          {clips.length > 0 ? (
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 font-mono text-xs">
              <span className="text-[11px] text-neutral-400 font-bold flex items-center gap-1 shrink-0">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span>SELECT TAPE ({clips.length} CALLED):</span>
              </span>
              <div className="flex gap-1.5 overflow-x-auto">
                {clips.map((clip, idx) => (
                  <button
                    key={clip.id}
                    onClick={() => handleSelectClip(idx)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer border flex items-center gap-1.5 ${
                      selectedClipIndex === idx
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)] scale-[1.02]'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span>📼</span>
                    <span>TAPE #{idx + 1}: {clip.callerName}</span>
                    {clip.tag === 'BIG_SCORE' && <span className="text-emerald-400 font-bold">($)</span>}
                    {clip.tag === 'DISASTER' && <span className="text-rose-400 font-bold">(!)</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-center text-xs font-mono text-neutral-400">
              📼 0 TAPES ARCHIVED — Only callers you actually dialed or connected with generate surveillance tapes.
            </div>
          )}

          {/* MAIN CENTERPIECE: REAL SCREEN RECORDING PLAYER & BOSS EXPLANATION */}
          {clips.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              {/* 1. Surveillance Video Monitor (Col 7/12) */}
              <div className="lg:col-span-7 bg-[#040810] border-2 border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative font-mono">
                {/* Retro CRT Scanline Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent pointer-events-none z-10" />

                {/* Top Video Header OSD */}
                <div className="bg-neutral-950 border-b border-neutral-800/90 px-3 py-1.5 flex items-center justify-between text-[10px] text-neutral-400 z-10 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-red-500 font-bold animate-pulse">
                      ● REC
                    </span>
                    <span className="text-neutral-300 font-bold">
                      {currentClip?.recordingSource === 'screen_capture' ? 'RAW SCREEN RECORD' : 'WORKSPACE CAPTURE'}
                    </span>
                    <span className="text-cyan-400">{currentClip?.callerName.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <span>{currentClip?.timestamp || '11:42 AM'}</span>
                    <span>|</span>
                    <span className="text-slate-300">TAPE #{selectedClipIndex + 1}</span>
                  </div>
                </div>

                {/* Real HTML5 Video Player Container */}
                <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between min-h-[250px] relative overflow-hidden bg-black">
                  {currentVideoUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <video
                        ref={videoRef}
                        key={currentVideoUrl}
                        src={currentVideoUrl}
                        autoPlay
                        playsInline
                        controls
                        className="w-full h-full max-h-[260px] object-contain rounded-lg border border-neutral-800 shadow-md"
                        onTimeUpdate={(e) => {
                          const v = e.currentTarget;
                          if (v.duration > 0) {
                            const pct = (v.currentTime / v.duration) * 100;
                            setVideoProgress(pct);
                            setVideoSeconds(Math.floor(v.currentTime));
                          }
                        }}
                        onEnded={handleVideoEnded}
                      />
                    </div>
                  ) : (
                    /* Fallback Animated Canvas Replay */
                    <div className="my-auto py-2 space-y-2">
                      <div className="flex items-center justify-between text-[11px] pb-2 border-b border-neutral-800/60 text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                          <span className="font-bold text-cyan-300">FEED: OPERATOR SCREEN</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-200 text-[10px]">
                          TARGET: {currentClip?.callerName || 'Unknown'} ({currentClip?.callerArchetype || 'Caller'})
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {currentClip?.dialogueSnippet.map((d, dIdx) => (
                          <div
                            key={dIdx}
                            className={`p-2 rounded-xl text-[11px] leading-relaxed ${
                              d.speaker === 'Operator'
                                ? 'bg-cyan-950/70 border border-cyan-700/60 text-cyan-200 ml-4'
                                : 'bg-neutral-900/90 border border-neutral-700/70 text-neutral-200 mr-4'
                            }`}
                          >
                            <span className="font-bold text-[10px] block opacity-75 mb-0.5 text-amber-300">
                              {d.speaker === 'Operator' ? 'OPERATOR (YOU):' : `${currentClip.callerName}:`}
                            </span>
                            <span>"{d.text}"</span>
                          </div>
                        ))}
                      </div>

                      {currentClip?.earnings > 0 && (
                        <div className="p-2 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-bold text-xs flex justify-between items-center">
                          <span>{currentClip.highlightAction}</span>
                          <span>+${currentClip.earnings.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Player Button Bar with Skip to Vikram Option */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={togglePlayPause}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow"
                      >
                        {isPlayingVideo ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        <span>{isPlayingVideo ? 'Pause' : 'Play Video'}</span>
                      </button>

                      <button
                        onClick={handleReplayVideo}
                        className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Replay Video from start (Vikram will wait until video finishes)"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Replay</span>
                      </button>

                      {!isVideoFinished && (
                        <button
                          onClick={handleSkipToExplanation}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Skip video and hear Vikram explain right now"
                        >
                          <FastForward className="w-3 h-3" />
                          <span>Skip to Vikram Explain</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[9px] text-neutral-400 font-mono">
                      {isPlayingVideo ? '▶️ FOOTAGE PLAYING FIRST' : '✅ REPLAY COMPLETE'}
                    </span>
                  </div>
                </div>

                {/* SCANNED AUDIO & TRANSCRIPT FROM THE VIDEO */}
                <div className="bg-[#080d1a] border-t border-neutral-800/90 p-2.5 text-[11px] font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-400 pb-1 border-b border-neutral-800">
                    <span className="flex items-center gap-1 text-cyan-400 font-bold text-[10px]">
                      <ScanText className="w-3.5 h-3.5" />
                      <span>SCANNED DIALOGUE & AUDIO FROM VIDEO:</span>
                    </span>
                    <span className="text-[9px] text-neutral-500">
                      TARGET: {currentClip.callerName} ({currentClip.callerArchetype})
                    </span>
                  </div>

                  {/* Scanned Lines */}
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {currentClip.dialogueSnippet.map((line, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-1.5 text-[10px]">
                        <span className="text-amber-400 font-bold shrink-0">
                          [{line.time || `00:${String((lIdx + 1) * 8).padStart(2, '0')}`}]
                        </span>
                        <span className={line.speaker === 'Operator' ? 'text-cyan-300 font-semibold' : 'text-neutral-300'}>
                          {line.speaker}:
                        </span>
                        <span className="text-neutral-300 truncate">"{line.text}"</span>
                      </div>
                    ))}
                  </div>

                  {/* Scanned Keywords & Protocol Badges */}
                  {currentClip.scannedWords && currentClip.scannedWords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-neutral-800/60">
                      {currentClip.scannedWords.map((word, wIdx) => (
                        <span
                          key={wIdx}
                          className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-[9px]"
                        >
                          🔍 {word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Boss Vikram's Live Reaction Station (Col 5/12) */}
              <div
                className={`lg:col-span-5 rounded-xl border-2 p-3.5 flex flex-col justify-between font-mono relative overflow-hidden shadow-xl ${
                  isPass
                    ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-600/70 text-rose-200'
                }`}
              >
                {/* Header: Boss Status - Clearly changes whether video is playing or Vikram is explaining */}
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${isVideoFinished ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'}`} />
                      <span className="text-[11px] font-bold text-neutral-200">
                        {isVideoFinished ? 'VIKRAM DELIVERING VERDICT' : 'VIKRAM WATCHING TAPE'}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        !isVideoFinished
                          ? 'bg-neutral-900 text-neutral-400 border border-neutral-700'
                          : isPass
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {!isVideoFinished
                        ? '👀 SILENT OBSERVATION'
                        : isPass
                        ? '😂 MANIC LAUGHTER'
                        : '😡 DESK SLAM FURY'}
                    </span>
                  </div>

                  {/* Boss Avatar & Live Status Bubble */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative shrink-0">
                      <div
                        className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-xl transition-all duration-300 ${
                          isBossTalking ? 'scale-105 ring-4 ring-amber-400/60' : ''
                        } ${
                          !isVideoFinished
                            ? 'bg-neutral-900 border-neutral-600'
                            : isPass
                            ? 'bg-emerald-900/90 border-emerald-400 shadow-emerald-950/60'
                            : 'bg-rose-950/90 border-rose-500 shadow-rose-950/60'
                        }`}
                      >
                        {!isVideoFinished ? '👀' : isPass ? '😂' : '😡'}
                      </div>

                      {/* Talking Audio Wave Indicator */}
                      {isBossTalking && (
                        <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] flex items-center gap-0.5 shadow animate-pulse">
                          <Volume2 className="w-2.5 h-2.5" />
                          <span>TTS</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-black text-sm text-neutral-100 tracking-wide">BOSS VIKRAM</h3>
                      <p className="text-[10px] text-neutral-400">Offshore Floor Operations Manager</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-amber-400">
                          {!isVideoFinished
                            ? 'Watching Your Screen Video...'
                            : isBossTalking
                            ? 'Explaining Tape Footage...'
                            : 'Verdict Delivered!'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spoken Reaction Dialogue Callout */}
                  <div className="bg-black/70 p-3 rounded-xl border border-neutral-800 space-y-2 relative shadow-inner">
                    {isLoadingReview ? (
                      <div className="py-4 flex items-center gap-2 text-xs text-neutral-400 animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Boss Vikram is analyzing tape surveillance...</span>
                      </div>
                    ) : !isVideoFinished ? (
                      /* While Video is Playing: Vikram waits in silence */
                      <div className="py-2 space-y-1.5 text-xs text-neutral-300 font-sans leading-relaxed">
                        <div className="text-amber-400 font-bold text-[11px] font-mono flex items-center gap-1.5">
                          <span>▶️</span>
                          <span>PLAYING VIDEO FOOTAGE FIRST...</span>
                        </div>
                        <p className="italic text-neutral-400">
                          Vikram is closely watching your recorded screen video. Once playback finishes, he will deliver his live spoken explanation and roast!
                        </p>
                        <button
                          onClick={handleSkipToExplanation}
                          className="mt-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <FastForward className="w-3 h-3" />
                          <span>Skip Video & Hear Vikram Now</span>
                        </button>
                      </div>
                    ) : (
                      /* After Video Finishes: Vikram delivers his explanation */
                      <>
                        <div
                          className={`text-xs font-black tracking-wide ${
                            isPass ? 'text-emerald-300' : 'text-rose-400'
                          }`}
                        >
                          {bossReview?.headline ||
                            (isPass ? "NOW THAT'S REVENUE GENERATION!" : 'WHAT WAS THAT PERFORMANCE?!')}
                        </div>

                        <div className="text-xs italic text-neutral-100 leading-relaxed font-sans">
                          "{selectedClipIndex === 0
                            ? bossReview?.quote || bossReview?.overallReview
                            : currentCritique?.comment || bossReview?.quote}"
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* TTS Controls for Boss */}
                <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={handleReplayBossVoice}
                    disabled={isLoadingReview}
                    className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    title="Speak Boss reaction aloud via Text-to-Speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>HEAR VIKRAM EXPLAIN (TTS)</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.stopAudio();
                      setIsBossTalking(false);
                      setIsMuted(!isMuted);
                    }}
                    className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                      isMuted
                        ? 'bg-rose-950 border-rose-700 text-rose-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                    title={isMuted ? 'Unmute Boss Voice' : 'Mute Boss Voice'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-black/70 border-2 border-neutral-800 rounded-2xl p-6 text-center space-y-3 font-mono">
              <div className="w-16 h-16 mx-auto rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-3xl">
                📼
              </div>
              <h3 className="text-sm font-black text-amber-400">NO CALL TAPES RECORDED THIS SHIFT</h3>
              <p className="text-xs text-neutral-300 font-sans max-w-md mx-auto leading-relaxed">
                Zero callers were connected during Shift Day #{shiftDay}. Surveillance tapes are ONLY generated for callers you actually dial and connect with. Pick up the receiver and dial the next lead!
              </p>
              <div className="bg-rose-950/60 border border-rose-700/60 rounded-xl p-3 max-w-md mx-auto text-rose-300 text-xs italic">
                Boss Vikram: "[slams desk] Are you sitting there taking a nap?! You didn't make a single call! Pick up that receiver and dial!"
              </div>
            </div>
          )}

          {/* Shift Financial Summary */}
          <div className="bg-black/60 border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-neutral-400">
              <span>SHIFT TARGET QUOTA:</span>
              <span className="font-bold text-neutral-200">${quota.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-neutral-400">
              <span>TOTAL REVENUE EXTRACTED:</span>
              <span className={`font-bold ${isPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${teamMoney.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-neutral-800 pt-1.5">
              <span>{isPass ? 'QUOTA SURPLUS:' : 'QUOTA DEFICIT:'}</span>
              <span className={`font-bold ${isPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPass ? `+$${difference.toLocaleString()}` : `-$${Math.abs(difference).toLocaleString()}`}
              </span>
            </div>

            {isPass && (
              <div className="flex justify-between items-center text-amber-300 border-t border-dashed border-neutral-800 pt-1.5">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> DAY COMPLETION COMMISSION:
                </span>
                <span className="font-bold">+$500.00</span>
              </div>
            )}
          </div>

          {/* Action Decision Buttons */}
          <div className="pt-1">
            {isPass ? (
              <button
                onClick={onContinueNextDay}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black rounded-xl text-sm font-mono tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-95 cursor-pointer transition-all border-2 border-emerald-300"
              >
                <span>CONTINUE TO NEXT DAY</span>
                <span className="text-xs bg-emerald-950/20 px-2 py-0.5 rounded font-bold">
                  DAY #{shiftDay + 1} (DOUBLED TIMER & HIGHER EARNINGS)
                </span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={onRequestExtension}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold rounded-xl text-xs font-mono tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-95 cursor-pointer transition-all"
                >
                  <Clock className="w-4 h-4" />
                  <span>REQUEST 2-MINUTE EMERGENCY EXTENSION</span>
                </button>

                <button
                  onClick={onRetryShift}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl text-xs font-mono tracking-wider flex items-center justify-center gap-2 border border-neutral-700 hover:border-neutral-500 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>RETRY SHIFT DAY #{shiftDay}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
