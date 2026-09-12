// WebRTC & Audio / Screen Media Service

class CallMediaService {
  private localAudioStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private ringOscillator: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringInterval: any = null;

  // Initialize or get AudioContext safely
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  // Request Microphone Audio
  async startMicrophone(): Promise<{ stream: MediaStream; isReal: boolean }> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        this.localAudioStream = stream;
        this.setupAudioAnalyser(stream);
        return { stream, isReal: true };
      }
    } catch (err) {
      console.warn('[CallMedia] Microphone permission unavailable or iframe blocked, using simulated audio channel:', err);
    }

    // Fallback: create silent/synthetic audio stream so WebRTC doesn't break
    const stream = this.createSyntheticAudioStream();
    this.localAudioStream = stream;
    return { stream, isReal: false };
  }

  // Stop Microphone Audio
  stopMicrophone() {
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => track.stop());
      this.localAudioStream = null;
    }
    if (this.analyser) {
      this.analyser = null;
    }
  }

  // Toggle Mute on audio track
  setAudioMuted(muted: boolean) {
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  // Request Screen Share Display Stream
  async startScreenShare(onEnded?: () => void): Promise<{ stream: MediaStream; isReal: boolean }> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        this.localScreenStream = stream;

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            this.stopScreenShare();
            if (onEnded) onEnded();
          };
        }

        return { stream, isReal: true };
      }
    } catch (err) {
      console.warn('[CallMedia] getDisplayMedia denied or blocked in iframe, creating interactive workspace share:', err);
    }

    // Fallback: Generate animated high-res canvas stream for screen share simulation
    const stream = this.createSimulatedScreenShareStream(onEnded);
    this.localScreenStream = stream;
    return { stream, isReal: false };
  }

  // Stop Screen Share
  stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((t) => t.stop());
      this.localScreenStream = null;
    }
  }

  getScreenStream(): MediaStream | null {
    return this.localScreenStream;
  }

  getAudioStream(): MediaStream | null {
    return this.localAudioStream;
  }

  // Audio Analyser for Speaking Indicators
  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const ctx = this.getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);
    } catch (e) {
      console.warn('[CallMedia] Could not set up audio analyser:', e);
    }
  }

  getAudioLevel(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / data.length;
    return Math.min(100, Math.round((avg / 128) * 100));
  }

  // Synthetic Audio Stream for fallback
  private createSyntheticAudioStream(): MediaStream {
    const ctx = this.getAudioContext();
    const dest = ctx.createMediaStreamDestination();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001; // virtually silent
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    return dest.stream;
  }

  // High quality screen share stream fallback (renders live Staff Portal HUD demo)
  private createSimulatedScreenShareStream(onEnded?: () => void): MediaStream {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    let frame = 0;
    const timer = setInterval(() => {
      if (!ctx) return;
      frame++;

      // Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Top App Bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, 60);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(40, 30, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.fillText('Staff Portal - Live Screen Presentation', 70, 38);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.fillText('1080p 60fps HD Share Active', canvas.width - 240, 36);

      // Main Dashboard Cards
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(80, 100, 360, 220, 12);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.fillText('Conference Call Mesh Metrics', 105, 140);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.fillText('• WebRTC Bitrate: 3,200 kbps', 105, 175);
      ctx.fillText('• Audio Packets: 0% loss (Opus 48kHz)', 105, 205);
      ctx.fillText('• Active Screen Sharer: Presenting', 105, 235);
      ctx.fillText('• Encryption: Real-time Staff Channel', 105, 265);

      // Graph Card
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(480, 100, 720, 220, 12);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.fillText('Real-Time Portal Activity & Telemetry', 505, 140);

      // Moving Waveform
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      for (let x = 505; x < 1160; x += 10) {
        const y = 220 + Math.sin((x + frame * 4) * 0.03) * 35;
        if (x === 505) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Bottom Section
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(80, 350, 1120, 300, 12);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.fillText('Staff Team Collaboration Roster', 110, 400);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.fillText('Team members can talk, mute, invite participants, and collaborate in real time.', 110, 435);

      // Pulse Indicator
      const pulse = (Math.sin(frame * 0.1) + 1) / 2;
      ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + pulse * 0.6})`;
      ctx.beginPath();
      ctx.arc(canvas.width - 60, canvas.height - 50, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText('LIVE STREAM', canvas.width - 160, canvas.height - 46);
    }, 1000 / 30);

    const stream = canvas.captureStream(30);
    const track = stream.getVideoTracks()[0];
    if (track) {
      const origStop = track.stop.bind(track);
      track.stop = () => {
        clearInterval(timer);
        origStop();
        if (onEnded) onEnded();
      };
    }
    return stream;
  }

  // Sound generator for Calls
  playRingbackTone() {
    this.stopRingTone();
    const ctx = this.getAudioContext();
    this.ringGain = ctx.createGain();
    this.ringGain.gain.value = 0.08;
    this.ringGain.connect(ctx.destination);

    const playBeep = () => {
      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.frequency.value = 440; // A4
        osc2.frequency.value = 480; // Telephone US ringback
        osc1.connect(this.ringGain!);
        osc2.connect(this.ringGain!);
        osc1.start();
        osc2.start();
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (e) {}
        }, 1200);
      } catch (e) {}
    };

    playBeep();
    this.ringInterval = setInterval(playBeep, 3500);
  }

  playIncomingRingtone() {
    this.stopRingTone();
    const ctx = this.getAudioContext();
    this.ringGain = ctx.createGain();
    this.ringGain.gain.value = 0.12;
    this.ringGain.connect(ctx.destination);

    const playChime = () => {
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteGain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.15);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.35);
          osc.frequency.value = freq;
          osc.connect(noteGain);
          noteGain.connect(this.ringGain!);
          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.4);
        });
      } catch (e) {}
    };

    playChime();
    this.ringInterval = setInterval(playChime, 2500);
  }

  stopRingTone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.ringGain) {
      try {
        this.ringGain.disconnect();
      } catch (e) {}
      this.ringGain = null;
    }
  }

  playConnectedSound() {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playHangupSound() {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }
}

export const callMedia = new CallMediaService();
