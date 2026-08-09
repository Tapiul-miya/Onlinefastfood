import React, { useState } from 'react';
import { Volume2, VolumeX, Play, RotateCcw, Check, MessageSquare, Music, Save, RefreshCw, Download, Sparkles, Trash2 } from 'lucide-react';
import { 
  soundManager, 
  SoundEventKey, 
  ToneType, 
  SoundConfigMap, 
  DEFAULT_SOUND_CONFIGS 
} from '../utils/audio';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const EVENT_LABELS: Record<SoundEventKey, { bn: string; en: string; icon: string; descBn: string }> = {
  order_placed: {
    bn: 'অর্ডার প্লেস করা হলে (Order Placed)',
    en: 'When a new order is placed',
    icon: '🛍️',
    descBn: 'কাস্টমার বা টেস্ট অর্ডার জমা হলে যে শব্দ বা ভয়েস বাজবে'
  },
  kitchen_new_order: {
    bn: 'কিচেনে নতুন অর্ডার আসার পর (Kitchen New Order)',
    en: 'When a new order ticket arrives at kitchen',
    icon: '🍳',
    descBn: 'কিচেন প্যানেল বা শেফের কাছে নতুন অর্ডার টিকিট আসার সাথে সাথে বাজবে'
  },
  driver_new_order: {
    bn: 'রাইডারের কাছে নতুন অর্ডার অ্যাসাইনমেন্ট (Rider New Order)',
    en: 'When a new delivery order is assigned to rider',
    icon: '🛵',
    descBn: 'ডেলিভারি রাইডারের কাছে নতুন অর্ডার অ্যাসাইন হওয়া বা নোটিফিকেশন এলে বাজবে'
  },
  kitchen_ready: {
    bn: 'রান্নাঘরে খাবার প্রস্তুত হলে (Kitchen Ready)',
    en: 'When food preparation is complete',
    icon: '🍳',
    descBn: 'কিচেন টিম খাবার রেডি করলে বাজানো হবে'
  },
  driver_pickup: {
    bn: 'রাইডার পিকআপ সম্পন্ন করলে (Driver Pickup)',
    en: 'When rider picks up order',
    icon: '🛵',
    descBn: 'ডেলিভারি বয় খাবার রিসিভ করে রওনা দিলে'
  },
  nearby: {
    bn: 'রাইডার কাছাকাছি পৌঁছালে (Rider Arriving Nearby)',
    en: 'When rider is nearby destination',
    icon: '📍',
    descBn: 'কাস্টমারের বাসার ৫০০ মিটারের মধ্যে এলে'
  },
  delivered: {
    bn: 'অর্ডার ডেলিভারি সফল হলে (Order Delivered)',
    en: 'When order delivery is completed',
    icon: '✅',
    descBn: 'কাস্টমার খাবার পেয়ে গেলে চূড়ান্ত সাকসেস এলার্ট'
  },
  cancelled: {
    bn: 'অর্ডার ক্যানসেল করা হলে (Order Cancelled)',
    en: 'When an order is cancelled',
    icon: '🚫',
    descBn: 'অর্ডার বাতিল বা রিজেক্ট হলে সসংবাদ নোটিফিকেশন'
  },
  push_notification: {
    bn: 'জেনারাল পুশ নোটিফিকেশন (Push Notification)',
    en: 'General system alerts & updates',
    icon: '🔔',
    descBn: 'সাধারণ নোটিশ বা বার্তা পাঠানোর সময়ে'
  }
};

const TONE_OPTIONS: { value: ToneType; labelBn: string; labelEn: string; isVoice?: boolean }[] = [
  { value: 'voice_bn', labelBn: '🗣️ বাংলা ভয়েস বার্তা (Bangla Voice Speech)', labelEn: '🗣️ Bangla Voice Announcement', isVoice: true },
  { value: 'voice_en', labelBn: '🗣️ ইংরেজি ভয়েস বার্তা (English Voice Speech)', labelEn: '🗣️ English Voice Announcement', isVoice: true },
  { value: 'chime_default', labelBn: '🔔 মেলোডি বিট (Default Melody Chime)', labelEn: '🔔 Default Melody' },
  { value: 'chime_bell', labelBn: '🔔 সফট বেল (Soft Ring Bell)', labelEn: '🔔 Soft Bell' },
  { value: 'chime_siren', labelBn: '🚨 সাইরেন এলার্ট (Urgent Alert Ring)', labelEn: '🚨 Urgent Siren Ring' },
  { value: 'chime_gong', labelBn: '🍳 কিচেন গং (Kitchen Gong Ring)', labelEn: '🍳 Kitchen Gong' },
  { value: 'chime_fanfare', labelBn: '🎉 সাকসেস ফ্যানফেয়ার (Success Chord)', labelEn: '🎉 Success Chord' },
  { value: 'chime_buzzer', labelBn: '⚠️ ওয়ার্নিং বাজার (Warning Buzzer)', labelEn: '⚠️ Warning Buzzer' },
  { value: 'silent', labelBn: '🔇 নিশব্দ (Silent / No Sound)', labelEn: '🔇 Silent' }
];

export const SoundSettings: React.FC = () => {
  const [configs, setConfigs] = useState<SoundConfigMap>(() => soundManager.getConfigs());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [currentlyTesting, setCurrentlyTesting] = useState<string | null>(null);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState<boolean>(false);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const [regenerateSuccessMsg, setRegenerateSuccessMsg] = useState<string | null>(null);
  const [customWavCount, setCustomWavCount] = useState<number>(() => soundManager.getCustomWavCount());

  const handleTypeChange = (eventKey: SoundEventKey, newType: ToneType) => {
    const updated = {
      ...configs,
      [eventKey]: {
        ...configs[eventKey],
        soundType: newType
      }
    };
    setConfigs(updated);
    setHasUnsavedChanges(true);
  };

  const handleVoiceTextChange = (eventKey: SoundEventKey, field: 'customVoiceBn' | 'customVoiceEn', value: string) => {
    const updated = {
      ...configs,
      [eventKey]: {
        ...configs[eventKey],
        [field]: value
      }
    };
    setConfigs(updated);
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    soundManager.saveConfigs(configs);
    try {
      await setDoc(doc(db, "settings", "sound_configs"), configs, { merge: true });
    } catch (e) {
      console.warn("Could not save sound settings to Firestore:", e);
    }
    soundManager.playChime('click');
    setHasUnsavedChanges(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = async () => {
    soundManager.playChime('click');
    const reset = soundManager.resetToDefault();
    setConfigs(reset);
    try {
      await setDoc(doc(db, "settings", "sound_configs"), reset, { merge: true });
    } catch (e) {
      console.warn("Could not reset sound settings in Firestore:", e);
    }
    setHasUnsavedChanges(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRegenerateAllWavs = async () => {
    soundManager.playChime('click');
    setIsRegeneratingAll(true);
    setRegenerateSuccessMsg(null);
    try {
      soundManager.saveConfigs(configs);
      await soundManager.regenerateAllWavs(configs);
      setCustomWavCount(soundManager.getCustomWavCount());
      setRegenerateSuccessMsg('সিলেক্ট করা সাউন্ড অপশন অনুযায়ী সবগুলি (৯টি) WAV ফাইল রি-জেনারেট করা হয়েছে!');
      await soundManager.playWav('order_placed');
      setTimeout(() => setRegenerateSuccessMsg(null), 5000);
    } catch (e) {
      console.error("WAV regeneration error:", e);
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  const handleRegenerateSingleWav = async (key: SoundEventKey) => {
    soundManager.playChime('click');
    setRegeneratingKey(key);
    try {
      const currentConfig = configs[key] || DEFAULT_SOUND_CONFIGS[key];
      soundManager.saveConfigs(configs);
      await soundManager.regenerateWav(key, currentConfig);
      setCustomWavCount(soundManager.getCustomWavCount());
      const selectedTypeLabel = TONE_OPTIONS.find(t => t.value === currentConfig.soundType)?.labelBn || 'সিলেক্টেড টিউন';
      setRegenerateSuccessMsg(`'${EVENT_LABELS[key].bn.split(' ')[0]}' এর জন্য সিলেক্ট করা [${selectedTypeLabel}] WAV ফাইল জেনারেট হয়েছে!`);
      await soundManager.playWav(key);
      setTimeout(() => setRegenerateSuccessMsg(null), 4000);
    } catch (e) {
      console.error("WAV regeneration error:", e);
    } finally {
      setRegeneratingKey(null);
    }
  };

  const handleDownloadWav = (key: SoundEventKey) => {
    soundManager.playChime('click');
    soundManager.downloadWav(key);
  };

  const handleResetCustomWavs = () => {
    soundManager.playChime('click');
    soundManager.resetCustomWavs();
    setCustomWavCount(0);
    setRegenerateSuccessMsg('অরিজিনাল ডিফোল্ট WAV সাউন্ড ফাইলে ফিরে যাওয়া হয়েছে।');
    setTimeout(() => setRegenerateSuccessMsg(null), 4000);
  };

  const testPlayVoice = (eventKey: SoundEventKey) => {
    setCurrentlyTesting(eventKey + '_voice');
    const currentConfig = configs[eventKey] || DEFAULT_SOUND_CONFIGS[eventKey];
    const textBn = currentConfig.customVoiceBn || DEFAULT_SOUND_CONFIGS[eventKey].customVoiceBn || '';
    soundManager.speak(textBn, 'bn');
    setTimeout(() => setCurrentlyTesting(null), 2500);
  };

  const testPlayWavFile = async (eventKey: SoundEventKey) => {
    setCurrentlyTesting(eventKey + '_wav');
    try {
      await soundManager.playWav(eventKey, 1.0);
    } catch {
      soundManager.playChime(eventKey);
    }
    setTimeout(() => setCurrentlyTesting(null), 2000);
  };

  const testPlayEvent = (eventKey: SoundEventKey) => {
    setCurrentlyTesting(eventKey);
    soundManager.play(eventKey);
    setTimeout(() => setCurrentlyTesting(null), 2500);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 text-white space-y-6 shadow-xl relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-orange-400">
            <Volume2 className="w-5 h-5 text-orange-400 animate-pulse" />
            শব্দ ও ভয়েস মেসেজ কনফিগারেশন (Sound & Voice Settings)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            ওয়েব অডিও সিন্থেসাইজার এবং বাংলা টেক্সট-টু-স্পিচ (TTS) ব্যবহার করে লাইভ সাউন্ড পরীক্ষা ও WAV ফাইল রি-জেনারেট করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/30 px-3 py-2 rounded-xl animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400" /> সেটিংস সেভ হয়েছে!
            </span>
          )}

          {/* Regenerate All WAV Files Button */}
          <button
            onClick={handleRegenerateAllWavs}
            disabled={isRegeneratingAll}
            className="px-3.5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30 active:scale-95 border border-purple-400/40 cursor-pointer disabled:opacity-50"
            title="সমস্ত সাউন্ডের জন্য নতুন 44.1kHz 16-bit PCM WAV ফাইল রি-জেনারেট করুন"
          >
            <RefreshCw className={`w-4 h-4 text-purple-200 ${isRegeneratingAll ? 'animate-spin' : ''}`} />
            <span>{isRegeneratingAll ? 'জেনারেট হচ্ছে...' : '🔄 WAV ফাইল রি-জেনারেট করুন'}</span>
          </button>

          <button
            onClick={handleSaveSettings}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 animate-bounce'
                : 'bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-500/50'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>সেটিং সেভ করুন</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-zinc-700 shrink-0 cursor-pointer active:scale-95"
            title="সব ডিফল্ট সেটিংসে ফিরিয়ে নিন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {regenerateSuccessMsg && (
        <div className="bg-purple-950/90 border border-purple-500/50 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-purple-200 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>{regenerateSuccessMsg}</span>
          </div>
          {customWavCount > 0 && (
            <button
              onClick={handleResetCustomWavs}
              className="text-[11px] underline text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              অরিজিনাল WAV এ রিসেট
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {(Object.keys(EVENT_LABELS) as SoundEventKey[]).map((key) => {
          const info = EVENT_LABELS[key];
          const currentConfig = configs[key] || DEFAULT_SOUND_CONFIGS[key];
          const isVoiceSelected = currentConfig.soundType === 'voice_bn' || currentConfig.soundType === 'voice_en';
          const hasCustomWav = soundManager.hasCustomWav(key);

          return (
            <div 
              key={key} 
              className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3 hover:border-orange-500/30 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-sm flex items-center gap-2 text-zinc-100 flex-wrap">
                    <span className="text-base">{info.icon}</span>
                    <span>{info.bn}</span>
                    {hasCustomWav && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                        রি-জেনারেটেড WAV
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">{info.descBn}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Test Voice TTS Button */}
                  <button
                    onClick={() => testPlayVoice(key)}
                    title="বাংলা ভয়েস মেসেজ টেস্ট করুন (Speech TTS)"
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all border cursor-pointer ${
                      currentlyTesting === key + '_voice'
                        ? 'bg-amber-500 text-black border-amber-400 scale-105'
                        : 'bg-zinc-900 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 text-amber-400" />
                    <span>ভয়েস টেস্ট</span>
                  </button>

                  {/* Test WAV File Button */}
                  <button
                    onClick={() => testPlayWavFile(key)}
                    title="44100Hz 16-bit Mono PCM WAV ফাইল সাউন্ড টেস্ট করুন"
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all border cursor-pointer ${
                      currentlyTesting === key + '_wav'
                        ? 'bg-purple-500 text-white border-purple-400 scale-105'
                        : 'bg-zinc-900 hover:bg-purple-500/20 hover:text-purple-300 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    <Music className="w-3 h-3 text-purple-400" />
                    <span>WAV সাউন্ড টেস্ট</span>
                  </button>

                  {/* Regenerate Single WAV Button */}
                  <button
                    onClick={() => handleRegenerateSingleWav(key)}
                    disabled={regeneratingKey === key}
                    title="এই সাউন্ডটির জন্য নতুন WAV ফাইল রি-জেনারেট করুন"
                    className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border cursor-pointer bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-600 hover:to-indigo-600 text-purple-200 border-purple-500/40 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 text-purple-300 ${regeneratingKey === key ? 'animate-spin' : ''}`} />
                    <span>{regeneratingKey === key ? 'জেনারেটিং...' : 'রি-জেনারেট WAV'}</span>
                  </button>

                  {/* Download WAV File Button */}
                  <button
                    onClick={() => handleDownloadWav(key)}
                    title="WAV সাউন্ড ফাইল ডাউনলোড করুন"
                    className="p-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all border cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Main Selected Sound Test Button */}
                  <button
                    onClick={() => testPlayEvent(key)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border shadow-sm cursor-pointer ${
                      currentlyTesting === key 
                        ? 'bg-orange-500 text-white border-orange-400 scale-105' 
                        : 'bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border-orange-500/30'
                    }`}
                  >
                    <Play className={`w-3.5 h-3.5 ${currentlyTesting === key ? 'animate-spin' : ''}`} />
                    <span>{currentlyTesting === key ? 'বাজছে...' : 'প্লে টেস্ট'}</span>
                  </button>

                  {/* Sound Type Selector Dropdown */}
                  <select
                    value={currentConfig.soundType}
                    onChange={(e) => handleTypeChange(key, e.target.value as ToneType)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-orange-300 focus:outline-none focus:border-orange-500 max-w-[180px] sm:max-w-xs cursor-pointer"
                  >
                    {TONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                        {opt.labelBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editable Voice Speech Text if Voice selected */}
              {isVoiceSelected && (
                <div className="pt-2 border-t border-zinc-800/50 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-fade-in">
                  <div>
                    <label className="block text-amber-400 font-bold mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      বাংলা ভয়েস বার্তাটি লিখুন:
                    </label>
                    <input
                      type="text"
                      value={currentConfig.customVoiceBn ?? DEFAULT_SOUND_CONFIGS[key].customVoiceBn}
                      onChange={(e) => handleVoiceTextChange(key, 'customVoiceBn', e.target.value)}
                      placeholder="বাংলায় বার্তা লিখুন..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-blue-400 font-bold mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      English Voice Message Text:
                    </label>
                    <input
                      type="text"
                      value={currentConfig.customVoiceEn ?? DEFAULT_SOUND_CONFIGS[key].customVoiceEn}
                      onChange={(e) => handleVoiceTextChange(key, 'customVoiceEn', e.target.value)}
                      placeholder="Enter message in English..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Status Bar */}
      <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-4">
        <p className="text-xs text-zinc-400 font-medium">
          {hasUnsavedChanges ? (
            <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
              ⚠️ আপনার কিছু পরিবর্তন এখনও সেভ করা হয়নি। ওপরের 'সেটিং সেভ করুন' বোতামে চাপুন।
            </span>
          ) : (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              ✓ সমস্ত সাউন্ড ও ভয়েস সেটিংস সেভ করা রয়েছে।
            </span>
          )}
        </p>

        {customWavCount > 0 && (
          <button
            onClick={handleResetCustomWavs}
            className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            অরিজিনাল WAV এ রিসেট ({customWavCount})
          </button>
        )}
      </div>
    </div>
  );
};


