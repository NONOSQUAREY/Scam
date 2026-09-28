// Web Audio synthesizer and Gemini PCM / Web Speech TTS player

class SoundManager {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  public volume: number = 0.8;
  private currentSpeechId: number = 0;

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play phone ring sound
  playPhoneRing() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      [440, 480].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 0.95);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.0);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Play phone pickup click
  playPhonePickup() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // Play DTMF keypad tone
  playKeyTone(keyIndex: number = 5) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [697, 770, 852, 941, 1209, 1336, 1477];
      const f1 = freqs[keyIndex % 4];
      const f2 = freqs[4 + (keyIndex % 3)];

      [f1, f2].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      });
    } catch (e) {}
  }

  // Play Cash Register / Cha-ching!
  playChaChing() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Bell chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1800, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.7);

      // Higher register bell
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2600, now + 0.08);
      gain2.gain.setValueAtTime(0.3, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.9);
    } catch (e) {}
  }

  // Card Swipe sound
  playCardSwipe() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.linearRampToValueAtTime(600, now + 0.15);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(now);
    } catch (e) {}
  }

  // Printer chatter / receipt printing
  playPrinterChirp() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600 + (i % 2) * 200, now + i * 0.06);
        gain.gain.setValueAtTime(0.08, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.05);
      }
    } catch (e) {}
  }

  // Hangup buzzer / click
  playHangUp() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // Airhorn sound effect for soundboard
  playAirhorn() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [466.16, 622.25, 932.33];
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.setValueAtTime(f * 1.03, now + 0.08);
        osc.frequency.setValueAtTime(f, now + 0.16);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
      });
    } catch (e) {}
  }

  // Police Siren
  playPoliceSiren() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.4);
      osc.frequency.linearRampToValueAtTime(600, now + 0.8);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    } catch (e) {}
  }

  // Subtle typewriter mechanical tick for dialogue text streaming
  playTypewriterClick() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Soft randomized high-pitch key click (1800Hz-2400Hz)
      const pitch = 1800 + Math.random() * 600;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.015);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.016);
    } catch (e) {}
  }

  // Stop current speech audio & abort all in-flight speech
  stopAudio() {
    this.currentSpeechId++;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {}
      this.currentSource = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  // Play raw PCM audio data (24kHz 16-bit Mono) with telephone DSP filter
  async playPcmBase64(base64Data: string, sampleRate = 24000): Promise<void> {
    this.stopAudio();
    const ctx = this.getContext();

    // Decode base64 to binary
    const binary = atob(base64Data);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Convert 16-bit PCM to Float32
    const int16Array = new Int16Array(buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Telephone Receiver Filter Graph (300Hz - 3400Hz Telecom Standard)
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 320;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 3400;

      const presence = ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 1850;
      presence.gain.value = 3.0;
      presence.Q.value = 1.2;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, ctx.currentTime);
      compressor.ratio.setValueAtTime(3.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume, ctx.currentTime);

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(presence);
      presence.connect(compressor);
      compressor.connect(gain);
      gain.connect(ctx.destination);

      this.currentSource = source;
      source.onended = () => {
        this.currentSource = null;
        resolve();
      };
      source.start();
    });
  }

  // Realistic Web Speech with voice selection and personality tuning
  playWebSpeech(
    text: string,
    options: {
      pitch?: number;
      rate?: number;
      voiceName?: string;
      gender?: 'male' | 'female';
    } = {}
  ): Promise<void> {
    this.stopAudio();
    if (!('speechSynthesis' in window)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = options.pitch ?? 1.0;
      utterance.rate = options.rate ?? 0.98;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const isFemale = options.gender
          ? options.gender === 'female'
          : options.voiceName === 'Kore' || options.voiceName === 'Puck';
        
        // Find highest fidelity natural/neural voice matching gender
        let bestVoice = voices.find((v) => {
          if (!v.lang.startsWith('en')) return false;
          const name = v.name.toLowerCase();
          const isNeural = name.includes('natural') || name.includes('google') || name.includes('online');
          if (isFemale) {
            return isNeural && (name.includes('jenny') || name.includes('aria') || name.includes('samantha') || name.includes('female') || name.includes('serena') || name.includes('karen') || name.includes('zira'));
          } else {
            return isNeural && (name.includes('guy') || name.includes('christopher') || name.includes('daniel') || name.includes('male') || name.includes('david') || name.includes('eric') || name.includes('mark'));
          }
        });

        // Secondary match if specific neural voice not present
        if (!bestVoice) {
          bestVoice = voices.find((v) => {
            if (!v.lang.startsWith('en')) return false;
            const name = v.name.toLowerCase();
            return isFemale
              ? name.includes('samantha') || name.includes('victoria') || name.includes('karen') || name.includes('female') || name.includes('zira')
              : name.includes('daniel') || name.includes('alex') || name.includes('fred') || name.includes('male') || name.includes('david');
          });
        }

        // Generic fallback English voice
        if (!bestVoice) {
          bestVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
        }

        if (bestVoice) utterance.voice = bestVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  // Unified speak function that tries Gemini realistic TTS first, then Web Speech
  async speakCaller(
    text: string,
    voice: string = 'Puck',
    onStartTalking?: () => void,
    onStopTalking?: () => void,
    gender?: 'male' | 'female'
  ) {
    const thisSpeechId = ++this.currentSpeechId;
    if (onStartTalking) onStartTalking();

    // Ensure voice matches gender
    let chosenVoice = voice;
    if (gender === 'male' && (chosenVoice === 'Kore' || chosenVoice === 'Puck')) {
      chosenVoice = 'Zephyr';
    } else if (gender === 'female' && (chosenVoice === 'Fenrir' || chosenVoice === 'Zephyr' || chosenVoice === 'Charon')) {
      chosenVoice = 'Kore';
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: chosenVoice, gender }),
      });

      if (this.currentSpeechId !== thisSpeechId) {
        if (onStopTalking) onStopTalking();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (this.currentSpeechId !== thisSpeechId) {
          if (onStopTalking) onStopTalking();
          return;
        }
        if (data.audio) {
          await this.playPcmBase64(data.audio, data.sampleRate || 24000);
          if (onStopTalking) onStopTalking();
          return;
        }
      }
    } catch (e) {
      console.warn('Gemini TTS fetch error, falling back to Web Speech:', e);
    }

    if (this.currentSpeechId !== thisSpeechId) {
      if (onStopTalking) onStopTalking();
      return;
    }

    // Realistic Web Speech fallback with voice-specific cadence
    const pitchMap: Record<string, number> = {
      Kore: 1.06,
      Puck: 1.02,
      Fenrir: 0.88,
      Zephyr: 0.94,
      Charon: 0.82,
    };

    const rateMap: Record<string, number> = {
      Kore: 0.94,
      Puck: 1.02,
      Fenrir: 0.93,
      Zephyr: 0.98,
      Charon: 0.95,
    };

    await this.playWebSpeech(text, {
      pitch: pitchMap[chosenVoice] || 1.0,
      rate: rateMap[chosenVoice] || 0.97,
      voiceName: chosenVoice,
      gender: gender,
    });

    if (onStopTalking) onStopTalking();
  }

  // Speak Player's voice
  async speakPlayer(text: string, voicePersona: string = 'Agent Alex', onStart?: () => void, onStop?: () => void) {
    const thisSpeechId = ++this.currentSpeechId;
    if (onStart) onStart();

    const voiceToGemini: Record<string, string> = {
      'Agent Alex': 'Zephyr',
      'Inspector Dick': 'Fenrir',
      'Friendly Hank': 'Puck',
      'Support Karen': 'Kore',
      'Robo-Terminal': 'Charon',
    };
    const mappedVoice = voiceToGemini[voicePersona] || 'Zephyr';

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: mappedVoice }),
      });
      if (this.currentSpeechId !== thisSpeechId) {
        if (onStop) onStop();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (this.currentSpeechId !== thisSpeechId) {
          if (onStop) onStop();
          return;
        }
        if (data.audio) {
          await this.playPcmBase64(data.audio, data.sampleRate || 24000);
          if (onStop) onStop();
          return;
        }
      }
    } catch (e) {}

    if (this.currentSpeechId !== thisSpeechId) {
      if (onStop) onStop();
      return;
    }

    // Fallback
    const pitchMap: Record<string, number> = {
      'Agent Alex': 1.0,
      'Inspector Dick': 0.75,
      'Friendly Hank': 0.95,
      'Support Karen': 1.25,
      'Robo-Terminal': 0.65,
    };
    await this.playWebSpeech(text, {
      pitch: pitchMap[voicePersona] || 1.0,
      rate: 1.1,
    });
    if (onStop) onStop();
  }

  // Synthesized Boss Desk Slam (deep thud with resonant wooden impact)
  playDeskSlam() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Heavy low thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

      gain.gain.setValueAtTime(0.7 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      // Noise burst for desk slap
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  // Synthesized Boss Laugh (chortle rhythm)
  playBossLaugh() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const laughFreqs = [240, 260, 230, 250, 210, 190];

      laughFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const start = now + idx * 0.11;
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.linearRampToValueAtTime(freq * 0.85, start + 0.08);

        gain.gain.setValueAtTime(0.18 * this.volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch (e) {}
  }

  // Malware Scanner Alert
  playMalwareAlert() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      [880, 440, 880, 440].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        const start = now + idx * 0.1;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12 * this.volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.09);
      });
    } catch (e) {}
  }

  // SysKey Federal Lockdown Alarm
  playSysKeyAlarm() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const start = now + i * 0.16;
        osc.frequency.setValueAtTime(1200, start);
        osc.frequency.linearRampToValueAtTime(300, start + 0.14);
        gain.gain.setValueAtTime(0.25 * this.volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.16);
      }
    } catch (e) {}
  }

  // Dial-up 56k Modem Handshake Screech
  playModemDialup() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [1800, 2100, 950, 1400, 2400];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'square' : 'sawtooth';
        const start = now + idx * 0.08;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.08 * this.volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.08);
      });
    } catch (e) {}
  }

  // Crypto / Bitcoin Transaction Confirm Chime
  playBitcoinCash() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.07;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2 * this.volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch (e) {}
  }

  // Boss Vikram Text-to-Speech Voice Player
  async speakBoss(
    text: string,
    mood: 'laughing_ecstatic' | 'furious_screaming' | 'smug_proud' | 'disappointed_facepalm' = 'smug_proud',
    onStart?: () => void,
    onStop?: () => void
  ) {
    const thisSpeechId = ++this.currentSpeechId;
    if (onStart) onStart();

    // Trigger physical sound effects matching stage cues in Boss text
    if (/\[(laughs|laughing|chuckle|haha)\]/i.test(text) || mood === 'laughing_ecstatic') {
      setTimeout(() => this.playBossLaugh(), 120);
    }
    if (/\[(slams|desk|bang|slamming)\]/i.test(text) || mood === 'furious_screaming') {
      setTimeout(() => this.playDeskSlam(), 150);
    }

    // Clean text by removing bracketed stage instructions for TTS speech
    const cleanSpoken = text
      .replace(/\[.*?\]/g, '')
      .replace(/[\*\#\_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpoken) {
      if (onStop) onStop();
      return;
    }

    const bossVoice = 'Fenrir'; // Deep, authoritative, commanding voice
    const isFurious = mood === 'furious_screaming';

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanSpoken,
          voice: bossVoice,
          gender: 'male',
        }),
      });

      if (this.currentSpeechId !== thisSpeechId) {
        if (onStop) onStop();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (this.currentSpeechId !== thisSpeechId) {
          if (onStop) onStop();
          return;
        }
        if (data.audio) {
          await this.playPcmBase64(data.audio, data.sampleRate || 24000);
          if (onStop) onStop();
          return;
        }
      }
    } catch (e) {
      console.warn('Boss TTS API error, falling back to Web Speech:', e);
    }

    if (this.currentSpeechId !== thisSpeechId) {
      if (onStop) onStop();
      return;
    }

    // High-impact Web Speech fallback with deep pitch & commanding rate
    await this.playWebSpeech(cleanSpoken, {
      pitch: isFurious ? 0.88 : 0.82,
      rate: isFurious ? 1.08 : 0.98,
      voiceName: 'Fenrir',
      gender: 'male',
    });

    if (onStop) onStop();
  }
}

export const soundManager = new SoundManager();
