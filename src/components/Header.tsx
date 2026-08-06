import React, { useState } from 'react';
import { ShoppingBag, MapPin, Volume2, VolumeX, Bike, User, Flame, ShieldAlert, Utensils, Sparkles, LogIn, Bell, BellRing, Trash2, CheckCircle2 } from 'lucide-react';
import { UserRole, Order, UserProfile } from '../types';
import { Language, Currency, TRANSLATIONS } from '../utils/i18n';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  role: UserRole;
  onSelectRole: (role: UserRole) => void;
  cartCount: number;
  onOpenCart: () => void;
  activeOrder: Order | null;
  onOpenTracking: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lang: Language;
  onSelectLang: (l: Language) => void;
  currency: Currency;
  onSelectCurrency: (c: Currency) => void;
  selectedAddress: string;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  pushEnabled: boolean;
  onTogglePush: () => void;
  pushNotifications: Array<{ id: string; title: string; body: string; time: string; read: boolean }>;
  onClearPush: () => void;
  onTestPush: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  onSelectRole,
  cartCount,
  onOpenCart,
  activeOrder,
  onOpenTracking,
  soundEnabled,
  onToggleSound,
  lang,
  onSelectLang,
  currency,
  onSelectCurrency,
  selectedAddress,
  currentUser,
  onOpenAuth,
  pushEnabled,
  onTogglePush,
  pushNotifications,
  onClearPush,
  onTestPush,
}) => {
  const isTrackingActive = activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled';
  const t = TRANSLATIONS[lang];
  const [isPushDropdownOpen, setIsPushDropdownOpen] = useState(false);
  const unreadPushCount = pushNotifications.length;


  return (
    <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* Main Header Top Row */}
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/30">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  {t.appName}
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-md uppercase hidden xs:inline-block">
                  ৩-ইন-১ প্লাটফর্ম
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 hidden xl:block">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Location Badge (Customer view) */}
          <button
            onClick={() => {
              soundManager.playChime('click');
              onOpenAuth();
            }}
            title="ঠিকানা বা প্রোফাইল পরিবর্তন করতে ক্লিক করুন"
            className="hidden lg:flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700/80 px-3 py-1.5 rounded-full border border-zinc-700/60 hover:border-orange-500/50 text-xs shrink-0 cursor-pointer transition-all active:scale-95 group"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-zinc-300 group-hover:text-white font-medium truncate max-w-[200px]">
              {selectedAddress}
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
              {t.header.deliveryAvg}
            </span>
          </button>

          {/* Quick Controls: Audio & Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-full">

            {/* Audio Toggle */}
            <button
              id="btn-toggle-sound"
              onClick={onToggleSound}
              title={soundEnabled ? t.header.soundOn : t.header.soundOff}
              className="p-1.5 sm:p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60 shrink-0"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />}
            </button>

            {/* Push Notifications Bell & Dropdown */}
            <div className="relative">
              <button
                id="btn-push-notifications"
                onClick={() => {
                  soundManager.playChime('click');
                  setIsPushDropdownOpen(prev => !prev);
                }}
                title="পুশ নোটিফিকেশন সেন্টার"
                className="relative p-1.5 sm:p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60 shrink-0 flex items-center justify-center"
              >
                {pushEnabled ? (
                  <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 animate-pulse" />
                ) : (
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />
                )}
                {unreadPushCount > 0 && pushEnabled && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {unreadPushCount}
                  </span>
                )}
              </button>

              {/* Push Dropdown Modal */}
              {isPushDropdownOpen && (
                <>
                  {/* Backdrop for mobile */}
                  <div 
                    className="fixed inset-0 z-40 bg-black/60 sm:hidden backdrop-blur-xs"
                    onClick={() => setIsPushDropdownOpen(false)}
                  />

                  <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 w-[calc(100vw-32px)] sm:w-96 max-w-sm mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-orange-400" />
                        <span className="font-bold text-xs sm:text-sm text-white">পুশ নোটিফিকেশন সেন্টার</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={onTogglePush}
                          className={`text-[11px] px-3 py-1.5 rounded-xl font-bold border transition-all ${
                            pushEnabled 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                          }`}
                        >
                          {pushEnabled ? '● চালু আছে' : '○ বন্ধ'}
                        </button>
                        <button
                          onClick={() => setIsPushDropdownOpen(false)}
                          className="text-zinc-400 hover:text-white text-sm font-bold p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={onTestPush}
                        className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <span>🧪 টেস্ট পুশ নোটিফিকেশন পাঠান</span>
                      </button>
                      {pushNotifications.length > 0 && (
                        <button
                          onClick={onClearPush}
                          title="সব মুছে দিন"
                          className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 rounded-xl border border-zinc-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60 p-2.5 space-y-2">
                      {pushNotifications.length === 0 ? (
                        <div className="py-10 text-center text-zinc-500 text-xs font-medium">
                          কোনো নতুন পুশ নোটিফিকেশন নেই
                        </div>
                      ) : (
                        pushNotifications.map((notif) => (
                          <div key={notif.id} className="p-3 rounded-xl bg-zinc-950/70 hover:bg-zinc-800/50 transition-colors border border-zinc-800/50">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs sm:text-sm text-orange-400">{notif.title}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{notif.time}</span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{notif.body}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 text-center text-[11px] text-zinc-400 font-medium">
                      ফাস্টবাইট রিয়েল-টাইম পুশ অ্যালার্ট সিস্টেম © ২০২৬
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Active Tracking Button */}
            {isTrackingActive && (
              <button
                id="btn-open-live-tracker"
                onClick={onOpenTracking}
                className="relative flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 ring-2 ring-orange-400/30 animate-pulse shrink-0"
              >
                <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">{t.header.liveTrack}</span>
              </button>
            )}

            {/* User Profile / Login Button */}
            <button
              id="btn-open-auth-modal"
              onClick={onOpenAuth}
              title={currentUser?.isLoggedIn ? `প্রোফাইল: ${currentUser.name}` : 'লগইন / সাইন আপ'}
              className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-all border shrink-0 ${
                currentUser?.isLoggedIn
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-amber-500/50 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700/80 hover:border-orange-500/50'
              }`}
            >
              {currentUser?.isLoggedIn ? (
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-orange-400" />
              )}
            </button>

            {/* Cart Button */}
            {role === 'customer' && (
              <button
                id="btn-open-cart"
                onClick={onOpenCart}
                className="relative flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-lg transition-all active:scale-95 shrink-0 ring-2 ring-orange-500/40"
              >
                <ShoppingBag className="w-4 h-4 text-white shrink-0" />
                <span className="inline">{t.header.cart}</span>
                {cartCount > 0 ? (
                  <span className="bg-white text-orange-600 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale-up">
                    {cartCount}
                  </span>
                ) : (
                  <span className="text-[10px] opacity-80 font-normal hidden xs:inline">(০)</span>
                )}
              </button>
            )}

          </div>

        </div>

        {/* Dedicated 4 Main Apps Tab Navigation Bar */}
        <div className="py-2 border-t border-zinc-800/80 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between min-w-max gap-2 text-xs font-medium">
            <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider hidden md:flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" /> অ্যাপ সিলেক্টর:
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto">
              
              {/* 1. Customer App Tab */}
              <button
                id="role-btn-customer"
                onClick={() => { soundManager.playChime('click'); onSelectRole('customer'); }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all ${
                  role === 'customer'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 ring-2 ring-orange-500/50 font-bold scale-105'
                    : 'bg-zinc-950/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <User className="w-4 h-4 text-orange-400" />
                <div className="text-left leading-tight">
                  <div className="font-bold text-xs sm:text-sm">১. {t.roles.customer}</div>
                  <div className="text-[9px] opacity-80 hidden sm:block">খাবার অর্ডার ও জিপিএস ট্র্যাকিং</div>
                </div>
              </button>

              {/* 2. Driver / Delivery App Tab */}
              <button
                id="role-btn-driver"
                onClick={() => { soundManager.playChime('click'); onSelectRole('driver'); }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all ${
                  role === 'driver'
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-500/50 font-bold scale-105'
                    : 'bg-zinc-950/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Bike className="w-4 h-4 text-amber-400" />
                <div className="text-left leading-tight">
                  <div className="font-bold text-xs sm:text-sm">২. {t.roles.driver}</div>
                  <div className="text-[9px] opacity-80 hidden sm:block">ডেলিভারি ট্রিপ ও রাইডার মোড</div>
                </div>
              </button>

              {/* 3. Kitchen KDS App Tab */}
              <button
                id="role-btn-kitchen"
                onClick={() => { soundManager.playChime('click'); onSelectRole('kitchen'); }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all ${
                  role === 'kitchen'
                    ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-500/50 font-bold scale-105'
                    : 'bg-zinc-950/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Utensils className="w-4 h-4 text-rose-400" />
                <div className="text-left leading-tight">
                  <div className="font-bold text-xs sm:text-sm">৩. {t.roles.kitchen}</div>
                  <div className="text-[9px] opacity-80 hidden sm:block">রেস্তোরাঁ কিচেন টিকিট স্ক্রিন</div>
                </div>
              </button>

              {/* 4. Admin App Tab */}
              <button
                id="role-btn-admin"
                onClick={() => { soundManager.playChime('click'); onSelectRole('admin'); }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-500/50 font-bold scale-105'
                    : 'bg-zinc-950/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <div className="text-left leading-tight">
                  <div className="font-bold text-xs sm:text-sm">৪. {t.roles.admin}</div>
                  <div className="text-[9px] opacity-80 hidden sm:block">মেনু এডিট ও ম্যানেজমেন্ট</div>
                </div>
              </button>

            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
