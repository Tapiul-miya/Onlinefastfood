import React, { useState, useEffect } from 'react';
import { Bike, Flame, Sparkles, Utensils, HelpCircle, RefreshCw, Palette } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SplashScreenProps {
  onComplete: () => void;
}

type ThemePreset = 'sunset_orange' | 'midnight_purple' | 'emerald_green' | 'dark_luxury';
type LogoPreset = 'delivery_bike' | 'speedy_flame' | 'hot_plate';

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState<number>(0);
  const [statusIdx, setStatusIdx] = useState<number>(0);
  const [theme, setTheme] = useState<ThemePreset>('sunset_orange');
  const [logoStyle, setLogoStyle] = useState<LogoPreset>('delivery_bike');
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const statusTexts = [
    'ফাস্টবাইট ডেলিভারি অ্যাপ চালু হচ্ছে... (FastBite Loading)',
    'জিপিএস লোকেশন ও ক্লাউড ডাটাবেজ সিঙ্ক করা হচ্ছে...',
    'পার্টনার কিচেনের স্পেশাল খাবারের মেনু সাজানো হচ্ছে...',
    'ডেলিভারি রাইডারদের অনলাইন জিপিএস কানেক্ট করা হচ্ছে...',
    'সবকিছু প্রস্তুত! স্বাগতম এবং শুভকামনা...',
  ];

  // Progress Bar Simulation
  useEffect(() => {
    let animationFrameId: number;
    const duration = 2600; // 2.6 seconds total loading duration
    const startTime = performance.now();

    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const calculatedProgress = Math.min(100, (elapsed / duration) * 100);
      
      setProgress(calculatedProgress);

      // Map progress to status indexes
      const nextIdx = Math.min(
        statusTexts.length - 1,
        Math.floor((calculatedProgress / 100) * statusTexts.length)
      );
      setStatusIdx(nextIdx);

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Trigger completion animation
        setIsExiting(true);
        setTimeout(() => {
          onComplete();
        }, 500); // Wait for fade-out animation to finish
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    // Play startup chime sound once
    try {
      soundManager.playChime('push_notification');
    } catch (e) {
      console.log('Audio not ready yet');
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  // CSS themes
  const getThemeStyles = () => {
    switch (theme) {
      case 'sunset_orange':
        return {
          background: 'bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.15)_0%,rgba(9,9,11,1)_75%)] bg-zinc-950',
          accentColor: 'from-orange-500 via-amber-500 to-yellow-500',
          ringColor: 'border-orange-500/40 border-t-orange-500',
          badgeText: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
          glowEffect: 'shadow-[0_0_40px_rgba(249,115,22,0.25)]',
        };
      case 'midnight_purple':
        return {
          background: 'bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,rgba(9,9,11,1)_75%)] bg-zinc-950',
          accentColor: 'from-violet-600 via-purple-500 to-fuchsia-500',
          ringColor: 'border-purple-500/40 border-t-purple-500',
          badgeText: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          glowEffect: 'shadow-[0_0_40px_rgba(139,92,246,0.25)]',
        };
      case 'emerald_green':
        return {
          background: 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,rgba(9,9,11,1)_75%)] bg-zinc-950',
          accentColor: 'from-emerald-500 via-teal-500 to-cyan-500',
          ringColor: 'border-emerald-500/40 border-t-emerald-500',
          badgeText: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          glowEffect: 'shadow-[0_0_40px_rgba(16,185,129,0.25)]',
        };
      case 'dark_luxury':
        return {
          background: 'bg-gradient-to-b from-zinc-900 to-zinc-950',
          accentColor: 'from-amber-600 via-amber-500 to-yellow-600',
          ringColor: 'border-amber-500/40 border-t-amber-500',
          badgeText: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          glowEffect: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]',
        };
    }
  };

  const style = getThemeStyles();

  return (
    <div
      id="custom-app-splash-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 transition-all duration-500 ease-out ${
        style.background
      } ${isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}`}
    >
      {/* Top Brand Name & Subtitle */}
      <div className="text-center mt-12 space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center justify-center gap-2">
          <span className="p-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
          </span>
          <span className="text-xs font-mono tracking-widest text-zinc-400 font-extrabold uppercase">
            FastBite Delivery System
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
          ফাস্টবাইট <span className="text-orange-500">ডেলিভারি</span>
        </h1>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto font-medium leading-relaxed">
          মিনিটেই গরম খাবার এবং লাইভ জিপিএস ট্র্যাকিং নিয়ে কড়া নাড়বে আপনার দরজায়!
        </p>
      </div>

      {/* Central Interactive Rotating Logo & Circle Loader */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        
        {/* Outer Rotating Dotted Circle */}
        <div className="absolute w-44 h-44 rounded-full border-2 border-dashed border-zinc-800 animate-[spin_12s_linear_infinite]" />
        
        {/* Outer Circular Loading Ring */}
        <div className={`absolute w-36 h-36 rounded-full border-[3.5px] border-solid animate-spin ${style.ringColor}`} />

        {/* Outer Glow Overlay */}
        <div className={`absolute w-32 h-32 rounded-full ${style.glowEffect} opacity-50 blur-xl animate-pulse`} />

        {/* Main Logo Container */}
        <div className="relative w-28 h-28 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner overflow-hidden group">
          {/* Internal pulsating glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-transparent to-amber-500/5 opacity-50 animate-pulse" />

          {/* Logo Preset: Delivery Bike */}
          {logoStyle === 'delivery_bike' && (
            <div className="relative flex flex-col items-center text-orange-500 animate-[bounce_2s_infinite]">
              <Bike className="w-12 h-12 stroke-[2.2] animate-pulse" />
              <div className="absolute -bottom-2 flex gap-1 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                <span className="w-1 h-1 rounded-full bg-orange-400" />
              </div>
            </div>
          )}

          {/* Logo Preset: Speedy Flame */}
          {logoStyle === 'speedy_flame' && (
            <div className="relative flex flex-col items-center text-amber-500 animate-[pulse_1.5s_infinite]">
              <Flame className="w-14 h-14 stroke-[2] drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)]" />
              <div className="absolute bottom-2 text-[10px] font-black uppercase tracking-wider text-white">FAST</div>
            </div>
          )}

          {/* Logo Preset: Hot Plate */}
          {logoStyle === 'hot_plate' && (
            <div className="relative flex flex-col items-center text-yellow-500 animate-bounce">
              <Utensils className="w-11 h-11 stroke-[2.2]" />
              <span className="absolute -top-3 text-[14px] animate-pulse">♨️</span>
            </div>
          )}
        </div>

        {/* Small floating status speed lines */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <span className="h-0.5 w-6 bg-zinc-800 rounded animate-[slide_1.5s_infinite]" />
          <span className="h-0.5 w-10 bg-zinc-700 rounded animate-[slide_1.2s_infinite]" />
        </div>
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-end">
          <span className="h-0.5 w-10 bg-zinc-700 rounded animate-[slide_1.3s_infinite_reverse]" />
          <span className="h-0.5 w-6 bg-zinc-800 rounded animate-[slide_1.7s_infinite_reverse]" />
        </div>
      </div>

      {/* Loading Status & Modern Progress Indicators */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-4 mb-8">
        
        {/* Status text with smooth dynamic content */}
        <div className="text-center h-5">
          <span className="text-xs sm:text-sm font-bold text-zinc-300 animate-pulse">
            {statusTexts[statusIdx]}
          </span>
        </div>

        {/* Elegant Loading Bar */}
        <div className="w-full bg-zinc-900/90 border border-zinc-800/80 p-1 rounded-full shadow-inner flex items-center">
          <div className="flex-1 h-2 bg-zinc-950/80 rounded-full overflow-hidden relative">
            <div 
              className={`h-full bg-gradient-to-r ${style.accentColor} rounded-full transition-all duration-100 ease-out`}
              style={{ width: `${progress}%` }}
            />
            {/* Animated gleam on progress bar */}
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/4 animate-[shimmer_1.5s_infinite] rounded-full" />
          </div>
          
          {/* Progress Percentage */}
          <span className="text-[10px] font-mono font-extrabold text-zinc-400 w-10 text-right pr-2 select-none shrink-0">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Customizable Themes & Controls (Allows user to play & view different themes) */}
        <div className="w-full bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-3 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
            <span className="flex items-center gap-1">
              <Palette className="w-3 h-3 text-orange-400" />
              <span>Splash Screen Customizer</span>
            </span>
            <span>Live Preview</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Background Style Switcher */}
            <div className="space-y-1">
              <label className="text-[9px] text-zinc-400 font-bold">Background Theme:</label>
              <div className="flex gap-1.5">
                {(['sunset_orange', 'midnight_purple', 'emerald_green', 'dark_luxury'] as ThemePreset[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      soundManager.playChime('click');
                    }}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      theme === t ? 'scale-110 border-white ring-2 ring-orange-500/40' : 'border-zinc-700 hover:border-zinc-500'
                    } ${
                      t === 'sunset_orange' ? 'bg-orange-600' :
                      t === 'midnight_purple' ? 'bg-purple-600' :
                      t === 'emerald_green' ? 'bg-emerald-600' : 'bg-zinc-800'
                    }`}
                    title={t.replace('_', ' ')}
                  />
                ))}
              </div>
            </div>

            {/* Logo Icon Style Switcher */}
            <div className="space-y-1">
              <label className="text-[9px] text-zinc-400 font-bold">Splash Logo Icon:</label>
              <div className="flex gap-1">
                {(['delivery_bike', 'speedy_flame', 'hot_plate'] as LogoPreset[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLogoStyle(l);
                      soundManager.playChime('click');
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors border ${
                      logoStyle === l 
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {l === 'delivery_bike' ? 'Bike' : l === 'speedy_flame' ? 'Flame' : 'Food'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Skip button for quicker testing */}
          <button
            onClick={() => {
              soundManager.playChime('click');
              setIsExiting(true);
              setTimeout(() => {
                onComplete();
              }, 300);
            }}
            className="w-full py-1 rounded bg-zinc-950/60 hover:bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800/80 text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            <span>Skip Splash Animation & Enter App</span>
          </button>
        </div>
      </div>
    </div>
  );
}
