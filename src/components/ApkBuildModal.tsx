import React, { useState } from 'react';
import { 
  X, Smartphone, Download, Copy, Check, ShieldCheck, 
  Sparkles, Code, Terminal, Layers, GitBranch, PlayCircle, PackageCheck
} from 'lucide-react';
import { UserRole } from '../types';
import { APP_CONFIGS, AppConfig } from '../utils/apkConfigs';
import { soundManager } from '../utils/audio';

interface ApkBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: UserRole;
}

export const ApkBuildModal: React.FC<ApkBuildModalProps> = ({
  isOpen,
  onClose,
  activeRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);
  const [buildTab, setBuildTab] = useState<'github' | 'manual'>('github');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentConfig: AppConfig = APP_CONFIGS[selectedRole];

  const handleCopy = (text: string, key: string) => {
    soundManager.playChime('click');
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadConfig = () => {
    soundManager.playChime('click');
    const jsonStr = JSON.stringify(currentConfig.capacitorConfig, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capacitor.config.${selectedRole}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildCommands = `# 1. Copy ${currentConfig.appNameEn} config
cat << 'EOF' > capacitor.config.json
${JSON.stringify(currentConfig.capacitorConfig, null, 2)}
EOF

# 2. Build web assets & sync to Android project
npm run build
npx cap sync android

# 3. Compile standalone APK with custom name & icon
npx cap open android
# Or command line build:
# cd android && ./gradlew assembleDebug`;

  const githubWorkflowSnippet = `name: Build Android APKs

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    name: Build Android APKs for All 4 Apps
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Build Web Project
        run: |
          npm ci
          npm run build

      - name: Build Android APKs with Product Flavors
        run: |
          npx cap add android || true
          npx cap sync android
          cd android && ./gradlew assembleDebug

      - name: Upload 4 APK Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: FastBite-All-4-APKs
          path: android/app/build/outputs/apk/*/debug/*.apk`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
                Android APK Multi-App Builder
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  ৪টি আলাদা অ্যাপ
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                GitHub Actions বা লোকাল বিল্ডের মাধ্যমে ৪টি আলাদা নাম ও আইকনযুক্ত APK জেনারেট করুন।
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playChime('click');
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Build Method Selector (GitHub vs Manual) */}
        <div className="flex items-center gap-2 p-2.5 bg-zinc-950 border-b border-zinc-800">
          <button
            onClick={() => { soundManager.playChime('click'); setBuildTab('github'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
              buildTab === 'github'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/40 shadow-lg shadow-orange-500/20'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>১. GitHub Actions অটোমেটিক বিল্ড (অনুরোধকৃত)</span>
          </button>

          <button
            onClick={() => { soundManager.playChime('click'); setBuildTab('manual'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
              buildTab === 'manual'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/40 shadow-lg shadow-orange-500/20'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>২. লোকাল Capacitor / CLI ম্যানুয়াল বিল্ড</span>
          </button>
        </div>

        {/* App Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-950/60 border-b border-zinc-800">
          {(Object.keys(APP_CONFIGS) as UserRole[]).map((roleKey) => {
            const cfg = APP_CONFIGS[roleKey];
            const isSelected = selectedRole === roleKey;
            return (
              <button
                key={roleKey}
                onClick={() => {
                  soundManager.playChime('click');
                  setSelectedRole(roleKey);
                }}
                className={`flex items-center gap-2.5 p-2 rounded-xl transition-all border text-left ${
                  isSelected
                    ? 'bg-zinc-800 border-orange-500/60 ring-1 ring-orange-500/30 text-white shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow">
                  <img src={cfg.iconUrl} alt={cfg.appNameEn} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate text-white">{cfg.appNameBn}</div>
                  <div className="text-[10px] font-mono text-zinc-400 truncate">{cfg.appId}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm text-zinc-200">

          {/* Active App Profile Header */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/10 shrink-0">
                  <img src={currentConfig.iconUrl} alt={currentConfig.appNameEn} className="w-full h-full object-cover" />
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-black text-[9px] font-mono font-bold text-orange-400 rounded-md border border-orange-500/40 shadow">
                  ICON
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">{currentConfig.appNameBn}</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {currentConfig.appNameEn}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{currentConfig.descriptionBn}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                  <span className="text-orange-400">Package ID: <strong className="text-white">{currentConfig.appId}</strong></span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400">Version: {currentConfig.version}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadConfig}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 shrink-0 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>capacitor.config.json</span>
            </button>
          </div>

          {/* Tab 1: GitHub Actions Flow */}
          {buildTab === 'github' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-950/30 via-zinc-950 to-zinc-950 border border-orange-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-orange-400 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-orange-400" />
                    GitHub Actions স্বয়ংক্রিয় বিল্ড গাইড (.github/workflows/android-build.yml)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Configured in Repo
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  আপনার প্রজেক্টের <code className="text-orange-300 font-mono bg-zinc-900 px-1 py-0.5 rounded">.github/workflows/android-build.yml</code> ফাইলটিতে ৪টি অ্যাপের <strong>Product Flavors</strong> কনফিগার করা রয়েছে।
                  GitHub এ কোড push করার সাথে সাথে আলাদা ৪টি APK একত্রে বিল্ড হয়ে যাবে!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-orange-400" />
                      ১. কিভাবে রান করবেন?
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      GitHub রির্পোজিটরিতে কোড <strong>push</strong> করুন অথবা GitHub Actions ট্যাবে গিয়ে <strong>Run workflow</strong> বাটনে ক্লিক করুন।
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ২. APK ডাউনলোড করার উপায়
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      বিল্ড শেষে GitHub Actions এর <strong>Artifacts</strong> সেকশন থেকে <code className="text-emerald-300 font-mono">FastBite-All-4-APKs</code> অথবা নির্দিষ্ট অ্যাপের ZIP ফাইল ডাউনলোড করে নিন।
                    </p>
                  </div>
                </div>
              </div>

              {/* Workflow Code Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-amber-400" />
                    GitHub Workflow (android-build.yml) Snippet
                  </span>
                  <button
                    onClick={() => handleCopy(githubWorkflowSnippet, 'workflow')}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedKey === 'workflow' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'workflow' ? 'কপি হয়েছে' : 'Workflow কপি করুন'}</span>
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-amber-300 overflow-x-auto max-h-56 leading-relaxed">
                  {githubWorkflowSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 2: Manual CLI / Capacitor Build */}
          {buildTab === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Capacitor Config JSON */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-orange-400" />
                      কনফিগারেশন JSON (capacitor.config.json)
                    </span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(currentConfig.capacitorConfig, null, 2), 'config')}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'config' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'config' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-52 leading-relaxed">
                    {JSON.stringify(currentConfig.capacitorConfig, null, 2)}
                  </pre>
                </div>

                {/* Right: Build Terminal Commands */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      লোকাল APK বিল্ড কমান্ড
                    </span>
                    <button
                      onClick={() => handleCopy(buildCommands, 'build')}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'build' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'build' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-amber-300 overflow-x-auto max-h-52 leading-relaxed">
                    {buildCommands}
                  </pre>
                </div>

              </div>

              {/* Detailed Instructions Steps */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  Android APK তে আলাদা নাম ও আইকন সেট করার নির্দেশিকা (Step-by-Step Guide)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 space-y-1">
                    <div className="font-bold text-orange-400">১. অ্যাপ নাম (App Title)</div>
                    <p className="text-zinc-400 text-[11px]">
                      <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">strings.xml</code> ফাইলে <code className="text-orange-300">&lt;string name="app_name"&gt;{currentConfig.appNameEn}&lt;/string&gt;</code> সেট করা থাকে।
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 space-y-1">
                    <div className="font-bold text-emerald-400">২. অ্যাপ আইকন (App Icon)</div>
                    <p className="text-zinc-400 text-[11px]">
                      <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">mipmap-*</code> ফোল্ডারে প্রতিটি অ্যাপের নিজস্ব আইকন (<code className="text-emerald-300">ic_launcher.png</code>) আপডেট করুন।
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 space-y-1">
                    <div className="font-bold text-indigo-400">৩. প্যাকেজ আইডি (Application ID)</div>
                    <p className="text-zinc-400 text-[11px]">
                      <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">capacitor.config.json</code> ফাইলে <code className="text-indigo-300">"{currentConfig.appId}"</code> নিশ্চিত করে বিল্ড রান করুন।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>প্রতিটি রোল (কাস্টমার, কিচেন, রাইডার, এডমিন) সম্পূর্ণ পৃথক অ্যান্ড্রয়েড APK হিসেবে ইনস্টল হবে।</span>
          </div>

          <button
            onClick={() => {
              soundManager.playChime('click');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};

