// audio.ts
// WAV-only Audio Manager for React + Capacitor

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

export type SoundConfigMap = Record<
  SoundEventKey,
  SoundEventConfig
>;

export const DEFAULT_SOUND_CONFIGS: SoundConfigMap = {
  order_placed: {
    soundType: 'voice_bn',
    customVoiceBn:
      'আপনার নতুন অর্ডারটি সফলভাবে প্লেস করা হয়েছে!',
    customVoiceEn:
      'Your new order has been placed successfully!'
  },

  kitchen_new_order: {
    soundType: 'voice_bn',
    customVoiceBn:
      'সাবধান কিচেন শেফ! আপনার রান্নাঘরে একটি নতুন অর্ডারের টিকেট এসেছে। দ্রুত রান্না শুরু করুন!',
    customVoiceEn:
      'Attention kitchen chef! A new food order ticket has arrived in the kitchen!'
  },

  driver_new_order: {
    soundType: 'voice_bn',
    customVoiceBn:
      'মনোযোগ দিন ডেলিভারি রাইডার! আপনার নিকট একটি নতুন ডেলিভারি অর্ডার এসেছে। অ্যাপ থেকে রিসিভ করুন!',
    customVoiceEn:
      'Attention delivery rider! A new food delivery assignment has arrived for you!'
  },

  kitchen_ready: {
    soundType: 'voice_bn',
    customVoiceBn:
      'রান্নাঘরে খাবার তৈরি সম্পন্ন, ডেলিভারি রাইডার অ্যাসাইন করা হচ্ছে!',
    customVoiceEn:
      'Food is ready in kitchen, assigning delivery rider!'
  },

  driver_pickup: {
    soundType: 'voice_bn',
    customVoiceBn:
      'ডেলিভারি রাইডার আপনার খাবার পিকআপ করেছে এবং গন্তব্যের উদ্দেশ্যে রওনা দিয়েছে!',
    customVoiceEn:
      'The delivery rider has picked up your food and is on the way!'
  },

  nearby: {
    soundType: 'voice_bn',
    customVoiceBn:
      'ডেলিভারি রাইডার আপনার ঠিকানার কাছাকাছি পৌঁছে গেছে!',
    customVoiceEn:
      'The delivery rider is arriving near your location!'
  },

  delivered: {
    soundType: 'voice_bn',
    customVoiceBn:
      'অভিনন্দন! আপনার খাবার সফলভাবে ডেলিভারি হয়েছে। উপভোগ করুন!',
    customVoiceEn:
      'Congratulations! Your food order has been delivered successfully!'
  },

  cancelled: {
    soundType: 'voice_bn',
    customVoiceBn:
      'দুঃখিত, আপনার অর্ডারটি বাতিল করা হয়েছে।',
    customVoiceEn:
      'Sorry, your order has been cancelled.'
  },

  push_notification: {
    soundType: 'voice_bn',
    customVoiceBn:
      'ফাস্টবাইট এক্সপ্রেস থেকে একটি নতুন আপডেট নোটিফিকেশন এসেছে।',
    customVoiceEn:
      'You have a new update notification from FastBite Express.'
  }
};

const SOUND_SETTINGS_STORAGE_KEY =
  'fastbite_sound_event_configs_v4';


export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let samples: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    samples = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      samples[i * 2] = left[i];
      samples[i * 2 + 1] = right[i];
    }
  } else {
    samples = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteLength = samples.length * bytesPerSample;
  const headerByteLength = 44;
  const totalByteLength = headerByteLength + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF chunk descriptor */
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  /* fmt sub-chunk */
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  /* data sub-chunk */
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  /* Write 16-bit PCM samples */
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, type = 'audio/wav'): Blob {
  const parts = base64.split(';base64,');
  const raw = window.atob(parts[1] || parts[0]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type });
}

export async function synthesizeEventAudio(
  type: SoundEventKey,
  config?: SoundEventConfig
): Promise<Blob> {
  const soundType: ToneType = config?.soundType || 'chime_default';

  if (soundType === 'voice_bn' || soundType === 'voice_en') {
    const lang = soundType === 'voice_bn' ? 'bn' : 'en';
    const text = soundType === 'voice_bn'
      ? (config?.customVoiceBn || DEFAULT_SOUND_CONFIGS[type]?.customVoiceBn || '')
      : (config?.customVoiceEn || DEFAULT_SOUND_CONFIGS[type]?.customVoiceEn || '');

    if (text) {
      try {
        // First try the server TTS proxy route
        let response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`);
        if (!response.ok) {
          // Fallback to direct URL if proxy is unavailable
          response = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`);
        }
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const AudioCtxClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtxClass();
          const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
          ctx.close();
          return audioBufferToWav(decodedBuffer);
        }
      } catch (e) {
        console.warn("TTS fetch failed for voice WAV generation:", e);
      }
    }
    // For voice mode, if binary WAV cannot be generated, return null so we don't pollute with a tone WAV
    return null as unknown as Blob;
  }

  const sampleRate = 44100;
  let duration = 1.2;

  if (soundType === 'chime_siren' || soundType === 'chime_buzzer') duration = 1.0;
  if (soundType === 'chime_gong' || soundType === 'chime_fanfare') duration = 1.5;
  if (soundType === 'silent') duration = 0.2;

  const OfflineCtxClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;

  const offlineCtx = new OfflineCtxClass(1, Math.ceil(sampleRate * duration), sampleRate);
  const now = 0;

  if (soundType === 'chime_default') {
    const freqs = [659.25, 880.00, 1046.50];
    freqs.forEach((f, idx) => {
      const start = now + idx * 0.12;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  } else if (soundType === 'chime_bell') {
    const freqs = [783.99, 1046.50, 1318.51];
    freqs.forEach((f, idx) => {
      const start = now + idx * 0.15;
      const osc = offlineCtx.createOscillator();
      const harmonic = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(f * 2.4, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);

      osc.connect(gain);
      harmonic.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(start);
      harmonic.start(start);
      osc.stop(start + 0.8);
      harmonic.stop(start + 0.8);
    });
  } else if (soundType === 'chime_siren') {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.3);
    osc.frequency.linearRampToValueAtTime(400, now + 0.6);
    osc.frequency.linearRampToValueAtTime(800, now + 0.9);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(now);
    osc.stop(now + 0.95);
  } else if (soundType === 'chime_gong') {
    const osc = offlineCtx.createOscillator();
    const sub = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(261.63, now);
    osc.frequency.exponentialRampToValueAtTime(130.81, now + 1.2);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(130.81, now);
    sub.frequency.exponentialRampToValueAtTime(65.4, now + 1.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 1.2);
    sub.stop(now + 1.2);
  } else if (soundType === 'chime_fanfare') {
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, idx) => {
      const start = now + idx * 0.1;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(start);
      osc.stop(start + 0.7);
    });
  } else if (soundType === 'chime_buzzer') {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(140, now + 0.2);
    osc.frequency.setValueAtTime(180, now + 0.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  } else if (soundType === 'silent') {
    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.connect(offlineCtx.destination);
  } else {
    // Default fallback
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, idx) => {
      const start = now + idx * 0.12;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  }

  return offlineCtx.startRendering().then((renderedBuffer) => {
    return audioBufferToWav(renderedBuffer);
  });
}

const CUSTOM_WAV_STORAGE_KEY = 'fastbite_custom_wavs_v1';

export class SoundManager {

  private audioCtx: AudioContext | null = null;

  private soundEnabled: boolean = true;

  private eventConfigs: SoundConfigMap = {
    ...DEFAULT_SOUND_CONFIGS
  };

  private cachedVoices: SpeechSynthesisVoice[] = [];

  private currentAudio: HTMLAudioElement | null = null;

  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private customWavUrls: Partial<Record<SoundEventKey, string>> = {};

  private customWavBlobs: Partial<Record<SoundEventKey, Blob>> = {};


  constructor() {
    this.loadConfigs();
    this.loadCustomWavs();
    this.initVoices();
    this.setupAutoUnlock();
  }


  // ============================================================
  // LOCAL WAV PATH / REGENERATED WAV URL
  // ============================================================

  public getAudioUrl(
    type: SoundEventKey
  ): string {
    if (this.customWavUrls[type]) {
      return this.customWavUrls[type]!;
    }
    return `/audio/${type}.wav`;
  }

  private loadCustomWavs() {
    // Retained for compatibility
  }

  public removeCustomWav(type: SoundEventKey): void {
    if (this.customWavUrls[type]) {
      try {
        URL.revokeObjectURL(this.customWavUrls[type]!);
      } catch {}
      delete this.customWavUrls[type];
      delete this.customWavBlobs[type];
    }
  }

  public async regenerateWav(type: SoundEventKey, customConfig?: SoundEventConfig): Promise<string> {
    const config = customConfig || this.eventConfigs[type] || DEFAULT_SOUND_CONFIGS[type];
    try {
      const blob = await synthesizeEventAudio(type, config);
      if (blob) {
        if (this.customWavUrls[type]) {
          try { URL.revokeObjectURL(this.customWavUrls[type]!); } catch {}
        }
        const objectUrl = URL.createObjectURL(blob);
        this.customWavUrls[type] = objectUrl;
        this.customWavBlobs[type] = blob;
        return objectUrl;
      }
    } catch (e) {
      console.warn("Synthesis failed during regenerateWav, falling back to raw WAV:", e);
    }
    this.removeCustomWav(type);
    return `/audio/${type}.wav`;
  }

  public async regenerateAllWavs(customConfigs?: SoundConfigMap): Promise<Record<SoundEventKey, string>> {
    const keys: SoundEventKey[] = [
      'order_placed',
      'kitchen_new_order',
      'driver_new_order',
      'kitchen_ready',
      'driver_pickup',
      'nearby',
      'delivered',
      'cancelled',
      'push_notification'
    ];

    const results: Partial<Record<SoundEventKey, string>> = {};
    for (const key of keys) {
      const cfg = customConfigs?.[key] || this.eventConfigs[key] || DEFAULT_SOUND_CONFIGS[key];
      const url = await this.regenerateWav(key, cfg);
      results[key] = url;
    }
    return results as Record<SoundEventKey, string>;
  }

  public hasCustomWav(type: SoundEventKey): boolean {
    return !!this.customWavUrls[type];
  }

  public getCustomWavCount(): number {
    return Object.keys(this.customWavUrls).length;
  }

  public resetCustomWavs(): void {
    (Object.keys(this.customWavUrls) as SoundEventKey[]).forEach((key) => {
      if (this.customWavUrls[key]) {
        try {
          URL.revokeObjectURL(this.customWavUrls[key]!);
        } catch {}
      }
    });
    this.customWavUrls = {};
    this.customWavBlobs = {};
  }

  public async downloadWav(type: SoundEventKey): Promise<void> {
    if (typeof window === 'undefined') return;

    const url = this.getAudioUrl(type);
    const fullUrl = url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')
      ? url
      : new URL(url, window.location.href).href;

    try {
      let blob: Blob | null = this.customWavBlobs[type] || null;

      if (!blob) {
        const response = await fetch(fullUrl);
        if (response.ok) {
          blob = await response.blob();
        } else {
          throw new Error(`সাউন্ড ফাইলটি সার্ভারে পাওয়া যায়নি (HTTP ${response.status})`);
        }
      }

      if (blob) {
        const file = new File([blob], `${type}.wav`, { type: 'audio/wav' });

        // 1. Web Share API (Android native share sheet allows saving directly to device storage)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${type}.wav`,
              text: `FastBite sound file: ${type}.wav`
            });
            return;
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') return;
          }
        }

        // 2. ObjectURL download
        try {
          const objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = `${type}.wav`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 8000);
          return;
        } catch (e) {
          console.warn("ObjectURL download failed, fallback to base64:", e);
        }

        // 3. Base64 download
        const base64Data = await blobToBase64(blob);
        const anchor = document.createElement('a');
        anchor.href = base64Data;
        anchor.download = `${type}.wav`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        return;
      }
    } catch (e: any) {
      console.warn("Blob download attempt failed, trying direct link fallback:", e);
    }

    // 4. Direct window / anchor trigger
    try {
      const anchor = document.createElement('a');
      anchor.href = fullUrl;
      anchor.download = `${type}.wav`;
      anchor.target = '_blank';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err: any) {
      throw new Error(`ডাউনলোড লিঙ্ক খুলতে ব্যর্থ: ${err?.message || 'অজানা ত্রুটি'}`);
    }
  }


  // ============================================================
  // AUDIO UNLOCK
  // ============================================================

  private setupAutoUnlock() {

    if (typeof window === 'undefined') {
      return;
    }

    const unlock = () => {

      const ctx = this.getContext();

      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      window.removeEventListener('touchstart', unlock);

      window.removeEventListener('click', unlock);

      window.removeEventListener('pointerdown', unlock);
    };

    window.addEventListener('touchstart', unlock, { passive: true });

    window.addEventListener('click', unlock, { passive: true });

    window.addEventListener('pointerdown', unlock, { passive: true });
  }


  // ============================================================
  // SPEECH VOICES
  // ============================================================

  private initVoices() {

    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    const updateVoices = () => {
      this.cachedVoices = window.speechSynthesis.getVoices();
    };

    updateVoices();

    window.speechSynthesis.onvoiceschanged = updateVoices;
  }


  // ============================================================
  // LOAD CONFIG
  // ============================================================

  private loadConfigs() {

    if (typeof window === 'undefined') {
      return;
    }

    try {

      const saved = localStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);

      if (saved) {

        const parsed = JSON.parse(saved) as Partial<SoundConfigMap>;

        this.eventConfigs = {
          ...DEFAULT_SOUND_CONFIGS,
          ...parsed
        };

      }

    } catch {

      this.eventConfigs = {
        ...DEFAULT_SOUND_CONFIGS
      };
    }
  }


  // ============================================================
  // SAVE CONFIG
  // ============================================================

  public saveConfigs(
    newConfigs: SoundConfigMap
  ) {

    this.eventConfigs = {
      ...newConfigs
    };

    if (typeof window !== 'undefined') {

      try {

        localStorage.setItem(
          SOUND_SETTINGS_STORAGE_KEY,
          JSON.stringify(this.eventConfigs)
        );

      } catch {
        // Ignore storage errors
      }
    }
  }


  // ============================================================
  // GET CONFIG
  // ============================================================

  public getConfigs(): SoundConfigMap {

    return {
      ...this.eventConfigs
    };
  }


  // ============================================================
  // RESET
  // ============================================================

  public resetToDefault(): SoundConfigMap {

    this.saveConfigs(DEFAULT_SOUND_CONFIGS);

    return {
      ...DEFAULT_SOUND_CONFIGS
    };
  }


  // ============================================================
  // AUDIO CONTEXT
  // ============================================================

  private getContext(): AudioContext | null {

    if (
      !this.soundEnabled ||
      typeof window === 'undefined'
    ) {
      return null;
    }

    if (!this.audioCtx) {

      const AudioContextClass =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (
      this.audioCtx &&
      this.audioCtx.state === 'suspended'
    ) {

      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }


  // ============================================================
  // ENABLE / DISABLE
  // ============================================================

  public setEnabled(
    enabled: boolean
  ) {

    this.soundEnabled = enabled;

    if (!enabled) {
      this.stopAll();
    }
  }


  public isEnabled(): boolean {
    return this.soundEnabled;
  }


  // ============================================================
  // STOP ALL AUDIO
  // ============================================================

  public stopAll() {

    if (this.currentAudio) {

      try {

        this.currentAudio.pause();

        this.currentAudio.currentTime = 0;

      } catch {}

      this.currentAudio = null;
    }


    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {

      try {
        window.speechSynthesis.cancel();
      } catch {}
    }


    this.currentUtterance = null;
  }

  public stop() {
    this.stopAll();
  }


  // ============================================================
  // PLAY WAV
  // ============================================================

  public async playWav(
    type: SoundEventKey,
    volume = 1.0
  ): Promise<boolean> {
    if (!this.soundEnabled || typeof window === 'undefined') {
      return false;
    }

    this.stopAll();

    // 1. Immediately wake up / unlock AudioContext synchronously on user gesture tick!
    const ctx = this.getContext();

    const url = this.getAudioUrl(type);
    const fullUrl = url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')
      ? url
      : new URL(url, window.location.href).href;

    // 2. Try Web Audio API decoding first (Best for Android WebViews)
    if (ctx) {
      try {
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }
        const response = await fetch(fullUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

          const source = ctx.createBufferSource();
          source.buffer = decodedBuffer;

          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);

          source.connect(gainNode);
          gainNode.connect(ctx.destination);

          source.start(0);
          return true;
        }
      } catch (e) {
        console.warn("WebAudio decoding playWav failed, trying HTML5 Audio fallback:", e);
      }
    }

    // 3. HTML5 Audio element fallback
    return new Promise<boolean>((resolve) => {
      try {
        const audio = new Audio(fullUrl);
        audio.preload = 'auto';
        audio.volume = Math.max(0, Math.min(1, volume));
        this.currentAudio = audio;

        let finished = false;

        const success = () => {
          if (finished) return;
          finished = true;
          resolve(true);
        };

        const failure = () => {
          if (finished) return;
          finished = true;
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          resolve(false);
        };

        audio.addEventListener('error', failure, { once: true });
        audio.addEventListener('ended', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
        }, { once: true });

        audio.play()
          .then(() => success())
          .catch(() => failure());
      } catch {
        resolve(false);
      }
    });
  }

  private async playWavViaWebAudio(url: string, volume = 1.0): Promise<boolean> {
    try {
      const ctx = this.getContext();
      if (!ctx) return false;

      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      const fullUrl = url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')
        ? url
        : new URL(url, window.location.href).href;

      const response = await fetch(fullUrl);
      if (!response.ok) return false;

      const arrayBuffer = await response.arrayBuffer();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(0);
      return true;
    } catch (e) {
      console.warn("playWavViaWebAudio failed:", e);
      return false;
    }
  }


  // ============================================================
  // WEB SPEECH FALLBACK
  // ============================================================

  private speakFallback(
    text: string,
    lang: 'bn' | 'en'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (
        !this.soundEnabled ||
        typeof window === 'undefined' ||
        !('speechSynthesis' in window)
      ) {
        resolve(false);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices =
          this.cachedVoices.length > 0
            ? this.cachedVoices
            : window.speechSynthesis.getVoices();

        const selectedVoice = voices.find((voice) => {
          const voiceLang = voice.lang.toLowerCase();
          if (lang === 'bn') {
            return voiceLang.includes('bn') || voiceLang.includes('bengali');
          }
          return voiceLang.startsWith('en');
        });

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        this.currentUtterance = utterance;

        utterance.onend = () => {
          if (this.currentUtterance === utterance) {
            this.currentUtterance = null;
          }
          resolve(true);
        };

        utterance.onerror = () => {
          if (this.currentUtterance === utterance) {
            this.currentUtterance = null;
          }
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
        setTimeout(() => resolve(true), 2500);
      } catch {
        resolve(false);
      }
    });
  }


  // ============================================================
  // PUBLIC SPEAK
  // ============================================================

  public async speak(
    text: string,
    lang: 'bn' | 'en' = 'bn'
  ): Promise<boolean> {
    if (!text || !this.soundEnabled || typeof window === 'undefined') {
      return false;
    }

    this.stopAll();

    return new Promise<boolean>((resolve) => {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
      const audio = new Audio(ttsUrl);
      audio.preload = 'auto';
      audio.volume = 1.0;
      this.currentAudio = audio;

      let finished = false;

      const finish = (success: boolean) => {
        if (finished) return;
        finished = true;
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        if (success) {
          resolve(true);
        } else {
          this.speakFallback(text, lang).then(resolve);
        }
      };

      audio.addEventListener('ended', () => finish(true), { once: true });
      audio.addEventListener('error', () => finish(false), { once: true });

      audio.play()
        .then(() => {
          // Playback started
        })
        .catch(() => {
          finish(false);
        });
    });
  }


  // ============================================================
  // GENERATED CHIME
  // ============================================================

  public playToneDirect(
    tone: ToneType
  ) {

    const ctx = this.getContext();

    if (!ctx || tone === 'silent') {
      return;
    }

    try {

      const now = ctx.currentTime;

      if (tone === 'chime_default') {

        this.playNotes(ctx, [659.25, 880, 1046.50], 0.1, 0.3, 'sine');

      } else if (tone === 'chime_bell') {

        this.playNotes(ctx, [783.99, 1046.50], 0.12, 0.5, 'sine');

      } else if (tone === 'chime_siren') {

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.linearRampToValueAtTime(800, now + 0.2);
        oscillator.frequency.linearRampToValueAtTime(400, now + 0.4);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.45);

      } else if (tone === 'chime_gong') {

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(261.63, now);
        oscillator.frequency.exponentialRampToValueAtTime(130.81, now + 0.6);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.6);

      } else if (tone === 'chime_fanfare') {

        this.playNotes(ctx, [523.25, 659.25, 783.99, 1046.50], 0.08, 0.45, 'triangle');

      } else if (tone === 'chime_buzzer') {

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(180, now);
        oscillator.frequency.setValueAtTime(140, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.4);
      }

    } catch {
      // Ignore Web Audio errors
    }
  }

  public playTone(tone: ToneType) {
    this.playToneDirect(tone);
  }

  private playNotes(
    ctx: AudioContext,
    frequencies: number[],
    gap: number,
    duration: number,
    waveform: OscillatorType = 'sine'
  ) {
    const now = ctx.currentTime;
    frequencies.forEach((frequency, index) => {
      const start = now + index * gap;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(start);
      oscillator.stop(start + duration);
    });
  }


  // ============================================================
  // PLAY EVENT
  // ============================================================

  public async play(type: SoundEventKey) {
    if (!this.soundEnabled) {
      return;
    }

    const config =
      this.eventConfigs[type] ||
      DEFAULT_SOUND_CONFIGS[type];

    if (!config || config.soundType === 'silent') {
      return;
    }

    if (config.soundType === 'voice_bn' || config.soundType === 'voice_en') {
      const isBn = config.soundType === 'voice_bn';
      const message = isBn
        ? (config.customVoiceBn || DEFAULT_SOUND_CONFIGS[type]?.customVoiceBn || '')
        : (config.customVoiceEn || DEFAULT_SOUND_CONFIGS[type]?.customVoiceEn || '');

      // 1. First try playing pre-recorded/custom voice WAV file (Works 100% on Android assets & Web)
      const playedWav = await this.playWav(type, 1.0);
      if (playedWav) {
        return;
      }

      // 2. Fallback to speech TTS if WAV file is missing
      if (message) {
        const spoke = await this.speak(message, isBn ? 'bn' : 'en');
        if (spoke) return;
      }

      // 3. Fallback tone
      this.playToneDirect('chime_default');
      return;
    }

    const played = await this.playWav(type, 1.0);

    if (!played) {
      this.playToneDirect(config.soundType);
    }
  }


  // ============================================================
  // PLAY SOUND EVENT / CHIME
  // ============================================================

  public async playChime(
    type: SoundEventKey | 'click'
  ) {

    if (!this.soundEnabled) {
      return;
    }

    if (type === 'click') {
      const ctx = this.getContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
      } catch {
        // Ignore
      }
      return;
    }

    return this.play(type);
  }


  // ============================================================
  // TEST WAV
  // ============================================================

  public test(type: SoundEventKey) {
    return this.playWav(type, 1.0);
  }


  // ============================================================
  // PRELOAD WAV
  // ============================================================

  public preload(type: SoundEventKey) {

    if (typeof window === 'undefined') {
      return;
    }

    const audio = new Audio(this.getAudioUrl(type));

    audio.preload = 'auto';

    audio.load();
  }


  // ============================================================
  // PRELOAD ALL WAV
  // ============================================================

  public preloadAll() {

    const events: SoundEventKey[] = [
      'order_placed',
      'kitchen_new_order',
      'driver_new_order',
      'kitchen_ready',
      'driver_pickup',
      'nearby',
      'delivered',
      'cancelled',
      'push_notification'
    ];

    events.forEach((event) => {
      this.preload(event);
    });
  }
}


export const soundManager = new SoundManager();

export default soundManager;
