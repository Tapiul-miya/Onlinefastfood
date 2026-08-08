// Web Audio API synth sound generator and Web Speech API Voice synthesis for food delivery updates

export type SoundEventKey =
  | 'order_placed'
  | 'kitchen_new_order'
  | 'driver_new_order'
  | 'kitchen_ready'
  | 'driver_pickup'
  | 'nearby'
  | 'delivered'
  | 'cancelled'
  | 'push_notification';

export type ToneType =
  | 'chime_default'
  | 'chime_bell'
  | 'chime_siren'
  | 'chime_gong'
  | 'chime_fanfare'
  | 'chime_buzzer'
  | 'voice_bn'
  | 'voice_en'
  | 'silent';

export interface SoundEventConfig {
  soundType: ToneType;
  customVoiceBn?: string;
  customVoiceEn?: string;
}

export type SoundConfigMap = Record<SoundEventKey, SoundEventConfig>;

export const DEFAULT_SOUND_CONFIGS: SoundConfigMap = {
  order_placed: {
    soundType: 'voice_bn',
    customVoiceBn: 'আপনার নতুন অর্ডারটি সফলভাবে প্লেস করা হয়েছে!',
    customVoiceEn: 'Your new order has been placed successfully!'
  },
  kitchen_new_order: {
    soundType: 'voice_bn',
    customVoiceBn: 'সাবধান কিচেন শেফ! আপনার রান্নাঘরে একটি নতুন অর্ডারের টিকেট এসেছে। দ্রুত রান্না শুরু করুন!',
    customVoiceEn: 'Attention kitchen chef! A new food order ticket has arrived in the kitchen!'
  },
  driver_new_order: {
    soundType: 'voice_bn',
    customVoiceBn: 'মনোযোগ দিন ডেলিভারি রাইডার! আপনার নিকট একটি নতুন ডেলিভারি অর্ডার এসেছে। অ্যাপ থেকে রিসিভ করুন!',
    customVoiceEn: 'Attention delivery rider! A new food delivery assignment has arrived for you!'
  },
  kitchen_ready: {
    soundType: 'chime_gong',
    customVoiceBn: 'রান্নাঘরে খাবার তৈরি সম্পন্ন, ডেলিভারি রাইডার অ্যাসাইন করা হচ্ছে!',
    customVoiceEn: 'Food is ready in kitchen, assigning delivery rider!'
  },
  driver_pickup: {
    soundType: 'voice_bn',
    customVoiceBn: 'ডেলিভারি রাইডার আপনার খাবার পিকআপ করেছে এবং গন্তব্যের উদ্দেশ্যে রওনা দিয়েছে!',
    customVoiceEn: 'The delivery rider has picked up your food and is on the way!'
  },
  nearby: {
    soundType: 'chime_bell',
    customVoiceBn: 'ডেলিভারি রাইডার আপনার ঠিকানার কাছাকাছি পৌঁছে গেছে!',
    customVoiceEn: 'The delivery rider is arriving near your location!'
  },
  delivered: {
    soundType: 'voice_bn',
    customVoiceBn: 'অভিনন্দন! আপনার খাবার সফলভাবে ডেলিভারি হয়েছে। উপভোগ করুন!',
    customVoiceEn: 'Congratulations! Your food order has been delivered successfully!'
  },
  cancelled: {
    soundType: 'chime_buzzer',
    customVoiceBn: 'দুঃখিত, আপনার অর্ডারটি বাতিল করা হয়েছে।',
    customVoiceEn: 'Sorry, your order has been cancelled.'
  },
  push_notification: {
    soundType: 'chime_default',
    customVoiceBn: 'ফাস্টবাইট এক্সপ্রেস থেকে একটি নতুন আপডেট নোটিফিকেশন এসেছে।',
    customVoiceEn: 'You have a new update notification from FastBite Express.'
  }
};

const SOUND_SETTINGS_STORAGE_KEY = 'fastbite_sound_event_configs_v2';

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private eventConfigs: SoundConfigMap = { ...DEFAULT_SOUND_CONFIGS };
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private isAudioUnlocked: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.loadConfigs();
    this.initVoices();
    this.setupAndroidAudioUnlock();
  }

  private setupAndroidAudioUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      // 1. Unlock Web Audio Context
      try {
        const ctx = this.getContext();
        if (ctx) {
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          // Play silent buffer to force unlock audio on Android
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        }
      } catch {
        // Ignore
      }

      // 2. Unlock HTMLAudioElement media autoplay on Android
      try {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
        silentAudio.volume = 0.01;
        const p = silentAudio.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      } catch {
        // Ignore
      }

      // 3. Unlock SpeechSynthesis on Android
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
          this.cachedVoices = window.speechSynthesis.getVoices();
        } catch {
          // Ignore
        }
      }

      this.isAudioUnlocked = true;
    };

    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        unlock();
      }
    });
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          this.cachedVoices = window.speechSynthesis.getVoices();
        } catch {
          // Ignore
        }
      };
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  private loadConfigs() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.eventConfigs = { ...DEFAULT_SOUND_CONFIGS, ...parsed };
      }
    } catch {
      this.eventConfigs = { ...DEFAULT_SOUND_CONFIGS };
    }
  }

  public saveConfigs(newConfigs: SoundConfigMap) {
    this.eventConfigs = { ...newConfigs };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, JSON.stringify(this.eventConfigs));
      } catch {
        // Storage fallback
      }
    }
  }

  public getConfigs(): SoundConfigMap {
    return { ...this.eventConfigs };
  }

  public resetToDefault(): SoundConfigMap {
    this.saveConfigs(DEFAULT_SOUND_CONFIGS);
    return { ...DEFAULT_SOUND_CONFIGS };
  }

  private getContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public speak(text: string, lang: 'bn' | 'en' = 'bn') {
    if (!this.soundEnabled || typeof window === 'undefined') return;

    // Ensure AudioContext & SpeechSynthesis are unlocked & active on Android
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try { this.audioCtx.resume(); } catch {}
    }
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.resume(); } catch {}
    }

    // Trigger haptic vibration pattern on Android devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch {
        // Ignore
      }
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio = null;
      } catch {
        // Ignore
      }
    }

    const targetLang = lang === 'bn' ? 'bn' : 'en';
    const voiceName = targetLang === 'bn' ? 'Bangla' : 'Brian';

    // StreamElements TTS has full CORS support (*), ideal for Android WebView & APKs
    const streamElementsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceName}&text=${encodeURIComponent(text)}`;
    const googleGtxUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl=${targetLang}&q=${encodeURIComponent(text)}`;
    const googleTwUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${targetLang}&q=${encodeURIComponent(text)}`;

    let speechHandled = false;

    const playAudioUrl = (url: string, onSuccess: () => void, onError: () => void) => {
      try {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        this.currentAudio = audio;
        audio.volume = 1.0;

        audio.onplay = () => {
          speechHandled = true;
          onSuccess();
        };

        audio.onerror = () => {
          onError();
        };

        audio.src = url;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            speechHandled = true;
            onSuccess();
          }).catch(() => {
            onError();
          });
        }
      } catch {
        onError();
      }
    };

    const tryAndroidWebSpeech = (onFail: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onFail();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLang === 'bn' ? 'bn-BD' : 'en-US';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        let started = false;

        utterance.onstart = () => {
          started = true;
          speechHandled = true;
        };

        utterance.onerror = () => {
          if (!started) onFail();
        };

        const voices = this.cachedVoices.length > 0 
          ? this.cachedVoices 
          : window.speechSynthesis.getVoices();

        if (voices.length > 0) {
          const matchedVoice = voices.find(v => {
            const name = v.name.toLowerCase();
            const vLang = v.lang.toLowerCase();
            return targetLang === 'bn' 
              ? (vLang.includes('bn') || vLang.includes('bangla') || name.includes('bengali') || name.includes('bangla') || vLang.includes('hi'))
              : vLang.includes('en');
          });

          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        }

        window.speechSynthesis.speak(utterance);

        // Timeout check: if WebSpeech didn't start within 500ms on Android, fall through
        setTimeout(() => {
          if (!started && !speechHandled) {
            onFail();
          }
        }, 500);
      } catch {
        onFail();
      }
    };

    // PIPELINE FOR ANDROID VOICE PLAYBACK:
    // 1st: StreamElements API (CORS-enabled MP3 stream)
    playAudioUrl(streamElementsUrl, () => {}, () => {
      // 2nd: Android Native WebSpeech Engine (Google Speech Services)
      tryAndroidWebSpeech(() => {
        // 3rd: Google GTX TTS URL
        playAudioUrl(googleGtxUrl, () => {}, () => {
          // 4th: Google TW-OB TTS URL
          playAudioUrl(googleTwUrl, () => {}, () => {
            // 5th: Audible Fanfare Chime Fallback so Android users never miss order alerts
            this.playToneDirect('chime_fanfare');
          });
        });
      });
    });
  }

  public playToneDirect(tone: ToneType) {
    const ctx = this.getContext();
    if (!ctx || tone === 'silent') return;

    try {
      const now = ctx.currentTime;

      if (tone === 'chime_default') {
        const notes = [659.25, 880, 1046.50];
        notes.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + idx * 0.1);
          g.connect(ctx.destination);
          o.connect(g);
          g.gain.setValueAtTime(0.15, now + idx * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
          o.start(now + idx * 0.1);
          o.stop(now + idx * 0.1 + 0.3);
        });
      } else if (tone === 'chime_bell') {
        // High soft bell tone
        const freqs = [783.99, 1046.50];
        freqs.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.12);
          g.connect(ctx.destination);
          o.connect(g);
          g.gain.setValueAtTime(0.2, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
          o.start(now + i * 0.12);
          o.stop(now + i * 0.12 + 0.5);
        });
      } else if (tone === 'chime_siren') {
        // Urgent alert siren ring
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(400, now);
        o.frequency.linearRampToValueAtTime(800, now + 0.2);
        o.frequency.linearRampToValueAtTime(400, now + 0.4);
        g.connect(ctx.destination);
        o.connect(g);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        o.start(now);
        o.stop(now + 0.45);
      } else if (tone === 'chime_gong') {
        // Deep warm kitchen gong
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(261.63, now); // Low C4
        o.frequency.exponentialRampToValueAtTime(130.81, now + 0.6);
        g.connect(ctx.destination);
        o.connect(g);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        o.start(now);
        o.stop(now + 0.6);
      } else if (tone === 'chime_fanfare') {
        // Major chord fanfare
        const chord = [523.25, 659.25, 783.99, 1046.50];
        chord.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, now + i * 0.08);
          g.connect(ctx.destination);
          o.connect(g);
          g.gain.setValueAtTime(0.15, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.45);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.45);
        });
      } else if (tone === 'chime_buzzer') {
        // Low danger warning buzzer
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(180, now);
        o.frequency.setValueAtTime(140, now + 0.15);
        g.connect(ctx.destination);
        o.connect(g);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        o.start(now);
        o.stop(now + 0.4);
      }
    } catch {
      // Audio error
    }
  }

  public playChime(type: SoundEventKey | 'click') {
    if (!this.soundEnabled) return;

    if (type === 'click') {
      const ctx = this.getContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } catch {
        // Audio error
      }
      return;
    }

    const config = this.eventConfigs[type] || DEFAULT_SOUND_CONFIGS[type];
    if (!config || config.soundType === 'silent') return;

    if (config.soundType === 'voice_bn') {
      const msg = config.customVoiceBn || DEFAULT_SOUND_CONFIGS[type].customVoiceBn || '';
      this.playToneDirect('chime_bell'); // short ping before voice
      setTimeout(() => this.speak(msg, 'bn'), 300);
    } else if (config.soundType === 'voice_en') {
      const msg = config.customVoiceEn || DEFAULT_SOUND_CONFIGS[type].customVoiceEn || '';
      this.playToneDirect('chime_bell');
      setTimeout(() => this.speak(msg, 'en'), 300);
    } else {
      this.playToneDirect(config.soundType);
    }
  }
}

export const soundManager = new SoundManager();
