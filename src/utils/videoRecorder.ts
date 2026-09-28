// Real WebM Video Generator using HTML5 Canvas & MediaRecorder
import { GameplayClip } from './gameplayRecorder';

class VideoClipGenerator {
  private cache: Map<string, string> = new Map();

  /**
   * Generates a real WebM video blob URL for a gameplay clip
   */
  async generateVideoBlobUrl(clip: GameplayClip): Promise<string> {
    if (clip.videoUrl) {
      return clip.videoUrl;
    }
    if (this.cache.has(clip.id)) {
      return this.cache.get(clip.id)!;
    }

    try {
      const blobUrl = await this.renderClipToWebM(clip);
      this.cache.set(clip.id, blobUrl);
      return blobUrl;
    } catch (err) {
      console.warn('Canvas MediaRecorder generation error, falling back:', err);
      return '';
    }
  }

  private renderClipToWebM(clip: GameplayClip): Promise<string> {
    return new Promise((resolve, reject) => {
      const width = 640;
      const height = 360;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // Check MediaRecorder support
      if (typeof window === 'undefined' || !('MediaRecorder' in window)) {
        reject(new Error('MediaRecorder not supported'));
        return;
      }

      // Setup stream
      let stream: MediaStream;
      try {
        stream = (canvas as any).captureStream ? (canvas as any).captureStream(24) : (canvas as any).mozCaptureStream(24);
      } catch (e) {
        reject(e);
        return;
      }

      let mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        resolve(videoUrl);
      };

      recorder.onerror = (err) => {
        reject(err);
      };

      recorder.start();

      const totalFrames = 120; // 5 seconds at 24fps
      let frame = 0;

      const drawFrame = () => {
        const progress = frame / totalFrames; // 0.0 to 1.0

        // 1. Clear background (Deep dark surveillance monitor)
        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, width, height);

        // Grid lines (CCTV raster)
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // 2. Top Header OSD
        ctx.fillStyle = '#0c1322';
        ctx.fillRect(0, 0, width, 32);
        ctx.fillStyle = '#ef4444';
        // Pulsing red rec dot
        if (Math.floor(frame / 6) % 2 === 0) {
          ctx.beginPath();
          ctx.arc(16, 16, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('REC [LIVE SCREEN CAPTURE]', 28, 19);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(`CAM-04 // ${clip.timestamp} // 1080P 60FPS`, 240, 19);

        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`TARGET: ${clip.callerName.toUpperCase()}`, width - 170, 19);

        // 3. Simulated Desktop Reenactment Window
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        const winX = 30;
        const winY = 46;
        const winW = width - 60;
        const winH = height - 90;
        ctx.beginPath();
        ctx.roundRect(winX, winY, winW, winH, 8);
        ctx.fill();
        ctx.stroke();

        // Window Title Bar
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(winX, winY, winW, 26, [8, 8, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`OPERATOR VOIP WORKSTATION - ACTIVE CALL: ${clip.callerName}`, winX + 12, winY + 17);

        // Window Content
        // Caller Profile Badge (Left Column)
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(winX + 10, winY + 34, 160, winH - 44, 6);
        ctx.fill();

        // Target Avatar Box
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(winX + 20, winY + 44, 48, 48, 6);
        ctx.fill();
        ctx.font = '24px sans-serif';
        ctx.fillText(clip.tag === 'DISASTER' ? '😨' : clip.tag === 'BIG_SCORE' ? '🤑' : '👤', winX + 32, winY + 77);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(clip.callerName, winX + 76, winY + 60);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(clip.callerArchetype, winX + 76, winY + 74);

        // Trust / Suspicion meter
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText('SUSPICION MONITOR:', winX + 20, winY + 110);

        const meterW = 140;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(winX + 20, winY + 116, meterW, 8);

        const suspPct = clip.tag === 'DISASTER' ? Math.min(1.0, 0.4 + progress * 0.6) : Math.max(0.1, 0.5 - progress * 0.4);
        ctx.fillStyle = clip.tag === 'DISASTER' ? '#ef4444' : '#10b981';
        ctx.fillRect(winX + 20, winY + 116, meterW * suspPct, 8);

        // Call State Badge
        ctx.fillStyle = '#065f46';
        ctx.strokeStyle = '#34d399';
        ctx.beginPath();
        ctx.roundRect(winX + 20, winY + 134, 140, 22, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('SECURE LINE // CONNECTED', winX + 28, winY + 148);

        // Dialogue bubbles (Right Column)
        const chatX = winX + 180;
        const chatY = winY + 34;
        const chatW = winW - 190;

        // Dialogue 1 (Caller greeting / message)
        if (progress >= 0.15 && clip.dialogueSnippet.length > 0) {
          const d1 = clip.dialogueSnippet[0];
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(chatX, chatY, chatW - 30, 36, 6);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`${d1.speaker.toUpperCase()}:`, chatX + 8, chatY + 13);
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '10px sans-serif';
          ctx.fillText(`"${d1.text.substring(0, 55)}${d1.text.length > 55 ? '...' : ''}"`, chatX + 8, chatY + 27);
        }

        // Dialogue 2 (Operator reply)
        if (progress >= 0.4 && clip.dialogueSnippet.length > 1) {
          const d2 = clip.dialogueSnippet[1];
          ctx.fillStyle = '#0c4a6e';
          ctx.beginPath();
          ctx.roundRect(chatX + 30, chatY + 44, chatW - 30, 36, 6);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('OPERATOR (YOU):', chatX + 38, chatY + 57);
          ctx.fillStyle = '#e0f2fe';
          ctx.font = '10px sans-serif';
          ctx.fillText(`"${d2.text.substring(0, 55)}${d2.text.length > 55 ? '...' : ''}"`, chatX + 38, chatY + 71);
        }

        // Action Highlight Climax Banner (Appears at progress >= 0.65)
        if (progress >= 0.65) {
          const bannerY = chatY + 88;
          ctx.fillStyle = clip.tag === 'BIG_SCORE' ? 'rgba(6, 78, 59, 0.95)' : clip.tag === 'DISASTER' ? 'rgba(127, 29, 29, 0.95)' : 'rgba(30, 41, 59, 0.95)';
          ctx.strokeStyle = clip.tag === 'BIG_SCORE' ? '#10b981' : clip.tag === 'DISASTER' ? '#ef4444' : '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(chatX, bannerY, chatW, 58, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = clip.tag === 'BIG_SCORE' ? '#34d399' : clip.tag === 'DISASTER' ? '#fca5a5' : '#7dd3fc';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`ACTION: ${clip.highlightAction}`, chatX + 10, bannerY + 20);

          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText(clip.outcomeText.substring(0, 60), chatX + 10, bannerY + 36);

          if (clip.earnings > 0) {
            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`EXTRACTED: +$${clip.earnings.toLocaleString()}`, chatX + 10, bannerY + 50);
          }
        }

        // Climax Big Text Overlay (Progress >= 0.8)
        if (progress >= 0.8 && clip.earnings > 0) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
          ctx.font = 'bold 15px monospace';
          ctx.fillText('$$$ FUNDS VERIFIED & SETTLED $$$', winX + 190, winY + 200);
        }

        // CRT Scanline Overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let y = 0; y < height; y += 3) {
          ctx.fillRect(0, y, width, 1);
        }

        // Bottom Timeline Watermark
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, height - 32, width, 32);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        const curSec = (progress * 5).toFixed(1);
        ctx.fillText(`TAPE TIMECODE: 00:0${curSec} / 00:05.0`, 16, height - 12);

        // Progress scrubber in video
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(230, height - 20, 240, 6);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(230, height - 20, 240 * progress, 6);

        ctx.fillStyle = '#a855f7';
        ctx.fillText('SURVEILLANCE ARCHIVE #981', width - 170, height - 12);

        frame++;

        if (frame < totalFrames) {
          setTimeout(drawFrame, 1000 / 24);
        } else {
          recorder.stop();
        }
      };

      // Start rendering loop
      drawFrame();
    });
  }
}

export const videoClipGenerator = new VideoClipGenerator();
