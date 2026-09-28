// Real Call Screen Recorder: Captures actual browser screen or workspace viewport
// Records real video/webm footage of calls and scans spoken dialogue into tapes

export interface ScannedSpeechItem {
  speaker: 'Operator' | string;
  text: string;
  timeString: string;
  seconds: number;
  highlightTag?: string;
}

export interface CallerRecording {
  callerName: string;
  videoUrl: string;
  transcript: ScannedSpeechItem[];
  scannedKeywords: string[];
  durationSeconds: number;
  recordingSource: 'screen_capture' | 'workspace_capture';
}

class CallScreenRecorder {
  private displayStream: MediaStream | null = null;
  private currentRecorder: MediaRecorder | null = null;
  private currentChunks: Blob[] = [];
  private currentCallerName: string | null = null;
  private currentCallerArchetype: string | null = null;
  private callStartTime: number = 0;
  private currentTranscript: ScannedSpeechItem[] = [];
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasInterval: any = null;
  private isSharingScreen: boolean = false;

  // Stored finished recordings mapped by callerName
  private recordings: Map<string, CallerRecording> = new Map();

  /**
   * Prompts the player to share their screen/tab for genuine 60FPS display recording.
   * If approved, all calls are recorded directly from their real screen!
   */
  async requestScreenShare(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      console.warn('getDisplayMedia not available in this environment');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: false,
      });

      this.displayStream = stream;
      this.isSharingScreen = true;

      // Handle user stopping share from browser UI
      stream.getVideoTracks()[0].onended = () => {
        this.displayStream = null;
        this.isSharingScreen = false;
      };

      return true;
    } catch (err: any) {
      console.info('Screen share dismissed or restricted:', err?.message || err);
      this.isSharingScreen = false;
      return false;
    }
  }

  isScreenSharingActive(): boolean {
    return Boolean(this.isSharingScreen && this.displayStream && this.displayStream.active);
  }

  stopScreenShare() {
    if (this.displayStream) {
      this.displayStream.getTracks().forEach((t) => t.stop());
      this.displayStream = null;
    }
    this.isSharingScreen = false;
  }

  /**
   * Start recording when a call connects with a caller
   */
  startCallRecording(callerName: string, archetype?: string) {
    // Stop any existing session
    this.stopCallRecording();

    this.currentCallerName = callerName;
    this.currentCallerArchetype = archetype || 'Citizen';
    this.callStartTime = Date.now();
    this.currentTranscript = [];
    this.currentChunks = [];

    // Choose stream: 1) Active DisplayMedia screen stream, OR 2) Real-time DOM canvas stream
    let streamToRecord: MediaStream | null = null;
    let source: 'screen_capture' | 'workspace_capture' = 'workspace_capture';

    if (this.displayStream && this.displayStream.active) {
      streamToRecord = this.displayStream;
      source = 'screen_capture';
    } else {
      // Setup live canvas capture of game viewport
      streamToRecord = this.createWorkspaceCanvasStream();
      source = 'workspace_capture';
    }

    if (!streamToRecord) return;

    try {
      let mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(streamToRecord, { mimeType });
      this.currentRecorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.currentChunks.push(e.data);
        }
      };

      recorder.start(500); // Collect in 500ms slices
    } catch (err) {
      console.warn('Failed to start MediaRecorder:', err);
    }
  }

  /**
   * Scans words and dialogue said during this call into the tape record
   */
  scanSpokenDialogue(
    speaker: 'Operator' | string,
    text: string,
    highlightTag?: string
  ) {
    if (!this.currentCallerName) return;

    const seconds = Math.floor((Date.now() - this.callStartTime) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const timeString = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

    this.currentTranscript.push({
      speaker,
      text,
      timeString,
      seconds,
      highlightTag,
    });
  }

  /**
   * Stops recording when call ends (hang up or completion)
   */
  async stopCallRecording(): Promise<CallerRecording | null> {
    const callerName = this.currentCallerName;
    if (!callerName) return null;

    if (this.canvasInterval) {
      clearInterval(this.canvasInterval);
      this.canvasInterval = null;
    }

    const durationSeconds = Math.max(1, Math.floor((Date.now() - this.callStartTime) / 1000));
    const transcript = [...this.currentTranscript];

    // Extract scanned keywords from transcript
    const scannedKeywords = this.extractScannedKeywords(transcript);

    const recordingPromise = new Promise<string>((resolve) => {
      if (!this.currentRecorder || this.currentRecorder.state === 'inactive') {
        resolve('');
        return;
      }

      this.currentRecorder.onstop = () => {
        if (this.currentChunks.length > 0) {
          const blob = new Blob(this.currentChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          resolve('');
        }
      };

      try {
        this.currentRecorder.stop();
      } catch (e) {
        resolve('');
      }
    });

    const videoUrl = await recordingPromise;

    const recordingResult: CallerRecording = {
      callerName,
      videoUrl,
      transcript,
      scannedKeywords,
      durationSeconds,
      recordingSource: this.isSharingScreen ? 'screen_capture' : 'workspace_capture',
    };

    this.recordings.set(callerName, recordingResult);

    // Reset current active session
    this.currentCallerName = null;
    this.currentRecorder = null;
    this.currentChunks = [];

    return recordingResult;
  }

  getRecordingForCaller(callerName: string): CallerRecording | undefined {
    return this.recordings.get(callerName);
  }

  getAllRecordings(): Map<string, CallerRecording> {
    return this.recordings;
  }

  resetShift() {
    this.recordings.clear();
    this.currentCallerName = null;
    this.currentChunks = [];
    this.currentTranscript = [];
    if (this.canvasInterval) {
      clearInterval(this.canvasInterval);
      this.canvasInterval = null;
    }
  }

  private extractScannedKeywords(transcript: ScannedSpeechItem[]): string[] {
    const keywords: Set<string> = new Set();
    const fullText = transcript.map((t) => t.text).join(' ');

    // Scan for AnyViewer / Remote access codes
    const codeMatch = fullText.match(/\b\d{3}[-\s]?\d{3}\b/);
    if (codeMatch) keywords.add(`Remote Code Scanned: ${codeMatch[0]}`);

    // Scan for card / payment numbers or amounts
    const dollarMatch = fullText.match(/\$\d+([,.]\d+)?/g);
    if (dollarMatch) {
      dollarMatch.forEach((d) => keywords.add(`Amount Scanned: ${d}`));
    }

    // Scan for sensitive keywords
    if (/cancellation|refund|reversal|charge/i.test(fullText)) {
      keywords.add('Protocol: Refund Reversal');
    }
    if (/anyviewer|teamviewer|partner id|connection/i.test(fullText)) {
      keywords.add('Tactic: Remote Desktop Access');
    }
    if (/syskey|lockdown|frozen|security/i.test(fullText)) {
      keywords.add('Threat: Security Lockdown');
    }
    if (/wire|swift|routing|bank/i.test(fullText)) {
      keywords.add('Channel: Wire Transfer Authorization');
    }
    if (/cvv|security code|expiration/i.test(fullText)) {
      keywords.add('Credential: Card Verification Digits');
    }

    if (keywords.size === 0) {
      keywords.add('Support Hotline Connection');
    }

    return Array.from(keywords);
  }

  /**
   * High-fidelity Canvas Stream of the game workstation
   * Captures live call UI, messages, meters, and status in real-time
   */
  private createWorkspaceCanvasStream(): MediaStream | null {
    if (typeof document === 'undefined') return null;

    const width = 640;
    const height = 360;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    this.canvasElement = canvas;

    let frameCount = 0;
    this.canvasInterval = setInterval(() => {
      frameCount++;
      const callerName = this.currentCallerName || 'Target';
      const archetype = this.currentCallerArchetype || 'Caller';
      const elapsedSec = Math.floor((Date.now() - this.callStartTime) / 1000);
      const m = Math.floor(elapsedSec / 60);
      const s = elapsedSec % 60;
      const timerStr = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

      // 1. Dark Desktop Background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Subtle CRT grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Top Status Bar (Recording OSD)
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, width, 28);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(0, 0, width, 28);

      // Pulsing REC indicator
      if (Math.floor(frameCount / 12) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(14, 14, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('REC [SCREEN CAPTURE]', 24, 18);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`DURATION: ${timerStr}`, 170, 18);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`TARGET: ${callerName.toUpperCase()} (${archetype})`, 310, 18);

      // 3. Simulated Active Phone Window on Screen
      const winX = 20;
      const winY = 40;
      const winW = width - 40;
      const winH = height - 55;

      ctx.fillStyle = '#090e17';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(winX, winY, winW, winH, 8);
      ctx.fill();
      ctx.stroke();

      // Window Header
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(winX, winY, winW, 26);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`☎ VOIP CALL IN PROGRESS — ${callerName}`, winX + 12, winY + 17);

      // Audio waveform animation
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 20; i++) {
        const barH = 4 + Math.sin((frameCount * 0.2) + i) * 6;
        const barX = winX + winW - 130 + i * 5;
        const barY = winY + 13;
        ctx.moveTo(barX, barY - barH);
        ctx.lineTo(barX, barY + barH);
      }
      ctx.stroke();

      // 4. Live Dialogue Chat Log from actual call
      const recentLines = this.currentTranscript.slice(-3);
      let lineY = winY + 45;

      if (recentLines.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 11px monospace';
        ctx.fillText('Listening to active call line...', winX + 16, lineY + 15);
      } else {
        recentLines.forEach((item) => {
          const isOp = item.speaker === 'Operator';
          ctx.fillStyle = isOp ? 'rgba(8, 51, 68, 0.7)' : 'rgba(30, 41, 59, 0.8)';
          ctx.strokeStyle = isOp ? '#0284c7' : '#475569';
          ctx.lineWidth = 1;

          const boxW = winW - 32;
          const boxH = 42;
          ctx.beginPath();
          ctx.roundRect(winX + 16, lineY, boxW, boxH, 6);
          ctx.fill();
          ctx.stroke();

          // Speaker label + time
          ctx.fillStyle = isOp ? '#38bdf8' : '#fbbf24';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`[${item.timeString}] ${item.speaker.toUpperCase()}:`, winX + 24, lineY + 14);

          // Dialogue text (truncated to fit box)
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '10px monospace';
          const truncated = item.text.length > 70 ? item.text.substring(0, 68) + '...' : item.text;
          ctx.fillText(`"${truncated}"`, winX + 24, lineY + 30);

          lineY += 48;
        });
      }

      // 5. Bottom Live Scan OSD
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(winX, winY + winH - 32, winW, 32);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(winX, winY + winH - 32, winW, 32);

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('LIVE OCR / AUDIO SCAN: ACTIVE', winX + 12, winY + winH - 12);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`LOGGED EVENTS: ${this.currentTranscript.length} EXCHANGES`, winX + winW - 190, winY + winH - 12);
    }, 1000 / 24); // 24 FPS

    try {
      return (canvas as any).captureStream ? (canvas as any).captureStream(24) : (canvas as any).mozCaptureStream(24);
    } catch (e) {
      console.warn('captureStream failed:', e);
      return null;
    }
  }
}

export const callScreenRecorder = new CallScreenRecorder();
