import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, Mail, Lock, User, CheckCircle2, ArrowRight, 
  ShieldCheck, Sparkles, LogOut, Utensils, Bike, Settings,
  KeyRound, FileText, BadgeAlert, Building2, MapPin, Navigation,
  Edit3, Save, RefreshCw, Compass, UserCheck, Home, Check, Globe, Camera
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

import { soundManager } from '../utils/audio';
import { fetchCurrentGpsLocation } from '../utils/geolocation';
import { Language, Currency } from '../utils/i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  targetRole?: UserRole;
  lang?: Language;
  onSelectLang?: (lang: Language) => void;
  currency?: Currency;
  onSelectCurrency?: (currency: Currency) => void;
  activeOrder?: Order | null;
  onCancelOrder?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  targetRole = 'customer',
  lang = 'bn',
  onSelectLang,
  currency = 'INR',
  onSelectCurrency,
  activeOrder,
  onCancelOrder,
}) => {
  // Active App Role Tab inside Auth Modal (Customer, Kitchen, Driver, Admin)
  const [selectedAppRole, setSelectedAppRole] = useState<UserRole>(targetRole);

  // Sync with targetRole when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedAppRole(targetRole);
    }
  }, [isOpen, targetRole]);

  // Auth Action Mode per role: 'login' or 'signup'
  const [authAction, setAuthAction] = useState<'login' | 'signup'>('login');

  // Customer State
  const [custLoginMethod, setCustLoginMethod] = useState<'otp' | 'email'>('otp');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone');
  const [otpValue, setOtpValue] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Profile Edit State (For Logged In User)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editAddress, setEditAddress] = useState(currentUser?.address || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');
  const [editVehicleNumber, setEditVehicleNumber] = useState(currentUser?.vehicleNumber || '');
  const [editEmployeeId, setEditEmployeeId] = useState(currentUser?.employeeId || '');
  const [editRestaurantId, setEditRestaurantId] = useState(currentUser?.restaurantId || '');
  const [editAssignedHub, setEditAssignedHub] = useState(currentUser?.assignedHub || '');

  // GPS Location Status
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Kitchen State
  const [kitchenId, setKitchenId] = useState('');
  const [chefPin, setChefPin] = useState('');
  const [kitchenName, setKitchenName] = useState('');
  const [chefName, setChefName] = useState('');

  // Driver / Rider State
  const [riderPhone, setRiderPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [riderPin, setRiderPin] = useState('');
  const [riderName, setRiderName] = useState('');

  // Admin State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [adminName, setAdminName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync profile fields when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditPhone(currentUser.phone || '');
      setEditEmail(currentUser.email || '');
      setEditAddress(currentUser.address || '');
      setEditAvatar(currentUser.avatar || AVATAR_PRESETS[0]);
      setEditVehicleNumber(currentUser.vehicleNumber || '');
      setEditEmployeeId(currentUser.employeeId || '');
      setEditRestaurantId(currentUser.restaurantId || '');
      setEditAssignedHub(currentUser.assignedHub || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  // GPS Location Detection Handler with real reverse geocoding & graceful fallback
  const handleDetectCurrentLocation = async (isForProfileUpdate: boolean = false) => {
    setIsLocating(true);
    setErrorMsg('');
    setLocationSuccessMsg('');
    soundManager.playChime('click');

    const result = await fetchCurrentGpsLocation();
    setIsLocating(false);

    if (result.success && result.address) {
      if (isForProfileUpdate) {
        setEditAddress(result.address);
        if (currentUser) {
          const updatedUser: UserProfile = {
            ...currentUser,
            address: result.address,
          };
          onLogin(updatedUser);
        }
      } else {
        setCustAddress(result.address);
      }
      setLocationSuccessMsg('লাইভ জিপিএস লোকেশন পাওয়া গেছে!');
      soundManager.playChime('order_placed');
    } else {
      const currentTyped = isForProfileUpdate ? editAddress : custAddress;
      if (!currentTyped || currentTyped.trim().length === 0) {
        if (isForProfileUpdate) {
          setEditAddress('বাসা / ফ্ল্যাট নম্বর, এলাকা, শহরের নাম লিখুন');
        } else {
          setCustAddress('বাসা / ফ্ল্যাট নম্বর, এলাকা, শহরের নাম লিখুন');
        }
      }
      setErrorMsg(result.errorMessage || 'জিপিএস সিগন্যাল পাওয়া যায়নি। নিচে বক্সে আপনার সঠিক ঠিকানাটি ম্যানুয়ালি লিখুন।');
      soundManager.playChime('click');
    }
  };

  // Profile Save Changes Handler for Logged In User Profile
  const handleSaveProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম দিন');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    soundManager.playChime('click');

    setTimeout(() => {
      setIsLoading(false);
      if (currentUser) {
        const updatedUser: UserProfile = {
          ...currentUser,
          name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          address: editAddress.trim(),
          avatar: editAvatar || currentUser.avatar,
          vehicleNumber: editVehicleNumber.trim() || currentUser.vehicleNumber,
          employeeId: editEmployeeId.trim() || currentUser.employeeId,
          restaurantId: editRestaurantId.trim() || currentUser.restaurantId,
          assignedHub: editAssignedHub.trim() || currentUser.assignedHub,
        };
        onLogin(updatedUser);
        setProfileSuccessMsg('আপনার প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!');
        setIsEditingProfile(false);
        soundManager.playChime('order_placed');
      }
    }, 600);
  };

  // 1. Customer Login via OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setErrorMsg('সঠিক ১০ ডিজিটের মোবাইল নম্বর প্রদান করুন');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    soundManager.playChime('click');

    setTimeout(() => {
      setIsLoading(false);
      const generated = Math.floor(1000 + Math.random() * 9000).toString();
      setSimulatedOtp(generated);
      setOtpValue(generated);
      setOtpStep('verify');
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue !== simulatedOtp) {
      setErrorMsg('ভুল ওটিপি (OTP)! আবার চেষ্টা করুন');
      return;
    }
    setIsLoading(true);
    soundManager.playChime('click');

    setTimeout(() => {
      setIsLoading(false);
      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: countryCode === '+91' ? 'User' : 'Guest',
        phone: `${countryCode} ${phone}`,
        role: 'customer',
        email: 'user@example.com',
        address: 'West Bengal, India',
        avatar: AVATAR_PRESETS[0],
        isLoggedIn: true,
      };
      onLogin(newUser);
      soundManager.playChime('order_placed');
      onClose();
    }, 700);
  };

  // Customer Login via Email
  const handleCustomerEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custEmail || !custPassword) {
      setErrorMsg('ইমেইল ও পাসওয়ার্ড প্রদান করুন');
      return;
    }
    setIsLoading(true);
    soundManager.playChime('click');

    setTimeout(() => {
      setIsLoading(false);
      const userName = custEmail.split('@')[0];
      const newUser: UserProfile = {
        id: `usr_em_${Date.now()}`,
        name: userName.charAt(0).toUpperCase() + userName.slice(1),
        phone: '',
        role: 'customer',
        email: custEmail,
        address: '',
        avatar: AVATAR_PRESETS[1],
        isLoggedIn: true,
      };
      onLogin(newUser);
      soundManager.playChime('order_placed');
      onClose();
    }, 700);
  };

  // Customer Signup
  const handleCustomerSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !phone) {
      setErrorMsg('আপনার নাম এবং মোবাইল নম্বর প্রদান করুন');
      return;
    }
    setIsLoading(true);
    soundManager.playChime('click');

    setTimeout(() => {
      setIsLoading(false);
      const newUser: UserProfile = {
        id: `usr_signup_${Date.now()}`,
        name: custName,
        phone: `${countryCode} ${phone}`,
        role: 'customer',
        email: custEmail || `${custName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        address: custAddress || '',
        avatar: AVATAR_PRESETS[2],
        isLoggedIn: true,
      };
      onLogin(newUser);
      soundManager.playChime('order_placed');
      onClose();
    }, 700);
  };

  // 2. Kitchen Staff Login
  const handleKitchenAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitchenId || !chefPin) {
      setErrorMsg('কিচেন আইডি এবং শেফ পিন কোড লিখুন');
      return;
    }
    setIsLoading(true);
    soundManager.playChime('click');

    setTimeout(() => {
      setIsLoading(false);
      const newUser: UserProfile = {
        id: `kit_${Date.now()}`,
        name: chefName || 'Chef',
        phone: '',
        role: 'kitchen',
        restaurantId: kitchenId,
        avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=300',
        isLoggedIn: true,
      };
      onLogin(newUser);
      soundManager.playChime('kitchen_ready');
      onClose();
    }, 700);
  };

  // 3. Driver Rider Login
  const handleRiderAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderPhone || !vehiclePlate) {
      setErrorMsg('মোবাইল নম্বর ও গাড়ির নম্বর প্রদান করুন');
      return;
    }
    setIsLoading(true);
    soundManager.playChime('click');

    setTimeout(() => {
      setIsLoading(false);
      const newUser: UserProfile = {
        id: `drv_${Date.now()}`,
        name: riderName || 'Delivery Partner',
        phone: `+91 ${riderPhone}`,
        role: 'driver',
        vehicleNumber: vehiclePlate,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
        isLoggedIn: true,
      };
      onLogin(newUser);
      soundManager.playChime('driver_pickup');
      onClose();
    }, 700);
  };

  // 4. Admin Login
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminKey) {
      setErrorMsg('এডমিন ইমেইল ও মাস্টার পাসকোড প্রয়োজন');
      return;
    }
    setIsLoading(true);
    soundManager.playChime('click');

    setTimeout(() => {
      setIsLoading(false);
      const newUser: UserProfile = {
        id: `adm_${Date.now()}`,
        name: adminName || 'Admin User',
        phone: '',
        role: 'admin',
        email: adminEmail,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
        isLoggedIn: true,
      };
      onLogin(newUser);
      soundManager.playChime('order_placed');
      onClose();
    }, 700);
  };

  const getRoleHeaderInfo = () => {
    switch (selectedAppRole) {
      case 'kitchen':
        return {
          title: 'কিচেন ডিসপ্লে অ্যাপ সাইন-ইন',
          subtitle: 'শেফ ও কিচেন ম্যানেজারদের জন্য বিশেষ পোর্টাল',
          icon: Utensils,
          badge: '🍳 কিচেন অ্যাপ',
          bgGradient: 'from-amber-600 via-orange-600 to-red-600',
        };
      case 'driver':
        return {
          title: 'রাইডার ও ডেলিভারি অ্যাপ লগইন',
          subtitle: 'ডেলিভারি পার্টনার লাইভ জিপিএস ও ট্র্যাকিং',
          icon: Bike,
          badge: '🏍️ রাইডার অ্যাপ',
          bgGradient: 'from-blue-600 via-indigo-600 to-amber-600',
        };
      case 'admin':
        return {
          title: 'এডমিন ও বিজনেস ম্যানেজমেন্ট',
          subtitle: 'মেনু কন্ট্রোল, সেলস ও সিস্টেম কনফিগারেশন',
          icon: Settings,
          badge: '⚙️ এডমিন পোর্টাল',
          bgGradient: 'from-emerald-600 via-teal-600 to-zinc-800',
        };
      default:
        return {
          title: 'কাস্টমার অ্যাপ লগইন / সাইন আপ',
          subtitle: 'খাবার অর্ডার, প্রোফাইল আপডেট ও লাইভ জিপিএস লোকেশন',
          icon: User,
          badge: '🍔 কাস্টমার অ্যাপ',
          bgGradient: 'from-orange-600 via-amber-600 to-orange-700',
        };
    }
  };

  const headerInfo = getRoleHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className={`relative bg-gradient-to-r ${headerInfo.bgGradient} p-5 text-white transition-all`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0">
              <HeaderIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 rounded-full bg-black/20 border border-white/20 text-[10px] font-extrabold uppercase mb-1">
                {headerInfo.badge}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug">
                {currentUser?.isLoggedIn ? `${currentUser.name} (প্রোফাইল)` : headerInfo.title}
              </h2>
              <p className="text-xs text-white/90 font-medium">
                {currentUser?.isLoggedIn ? 'প্রোফাইল দেখা ও আপডেট করুন' : headerInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Dedicated App Role Selector Tabs Removed */}

        {/* Main Content Body */}
        <div className="p-5 space-y-5 text-zinc-200">
          
          {/* ======================================================== */}
          {/* LOGGED IN USER PROFILE & PROFILE UPDATE FORM             */}
          {/* ======================================================== */}
          {currentUser?.isLoggedIn ? (
            <div className="space-y-5">
              
              {/* Success Banner */}
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{profileSuccessMsg}</span>
                  </div>
                  <button onClick={() => setProfileSuccessMsg('')} className="text-zinc-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Profile Overview Card */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={currentUser.avatar || AVATAR_PRESETS[0]} 
                      alt={currentUser.name} 
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-orange-500/50 shadow-md"
                    />
                    <div>
                      <h3 className="font-bold text-base text-white">{currentUser.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                          {currentUser.role === 'customer' && '🍔 কাস্টমার অ্যাকাউন্ট'}
                          {currentUser.role === 'kitchen' && '🍳 কিচেন শেফ অ্যাকাউন্ট'}
                          {currentUser.role === 'driver' && '🏍️ ডেলিভারি রাইডার অ্যাকাউন্ট'}
                          {currentUser.role === 'admin' && '⚙️ এডমিন প্যানেল অ্যাকাউন্ট'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(!isEditingProfile);
                      soundManager.playChime('click');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isEditingProfile
                        ? 'bg-orange-600 text-white border-orange-500 shadow'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-orange-400 border-orange-500/40'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditingProfile ? 'বন্ধ করুন' : 'প্রোফাইল এডিট'}</span>
                  </button>
                </div>

                {/* Info List */}
                {!isEditingProfile && (
                  <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                    <div className="flex items-start gap-2">
                      <Smartphone className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-zinc-500 block text-[10px]">মোবাইল নম্বর:</span>
                        <span className="font-medium text-white">{currentUser.phone || 'দেওয়া হয়নি'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-zinc-500 block text-[10px]">ইমেইল এড্রেস:</span>
                        <span className="font-medium text-white">{currentUser.email || 'দেওয়া হয়নি'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-zinc-500 block text-[10px]">ডেলিভারি ঠিকানা ও লাইভ জিপিএস:</span>
                        <span className="font-medium text-amber-300 leading-snug">{currentUser.address || 'আপনার ঠিকানা যোগ করুন'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Profile Form */}
              {isEditingProfile && (
                <form onSubmit={handleSaveProfileUpdate} className="bg-zinc-950/90 p-4 rounded-2xl border border-orange-500/30 space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h4 className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4" />
                      <span>প্রোফাইল তথ্য আপডেট করুন</span>
                    </h4>
                    <span className="text-[10px] text-zinc-400">কাস্টমার প্রোফাইল</span>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <BadgeAlert className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* 1. Name */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">পূর্ণ নাম (Full Name)</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                        placeholder="আপনার নাম"
                        required
                      />
                    </div>
                  </div>

                  {/* 2. Phone */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">মোবাইল নম্বর (Phone)</label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                        placeholder="+91 XXXXX-XXXXX"
                        required
                      />
                    </div>
                  </div>

                  {/* 3. Email */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">ইমেইল এড্রেস (Email)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  {/* 4. Delivery Address & GPS Detect Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-zinc-400">ডেলিভারি ঠিকানা (Address)</label>
                      <button
                        type="button"
                        onClick={() => handleDetectCurrentLocation(true)}
                        disabled={isLocating}
                        className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/30 transition-all cursor-pointer active:scale-95"
                      >
                        {isLocating ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Navigation className="w-3 h-3 text-orange-400" />
                        )}
                        <span>বর্তমান GPS লোকেশন নিন</span>
                      </button>
                    </div>

                    <div className="relative">
                      <MapPin className="w-4 h-4 text-orange-400 absolute left-3 top-3" />
                      <textarea
                        rows={2}
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                        placeholder="আপনার ডেলিভারি এড্রেস লিখুন..."
                      />
                    </div>



                    {locationSuccessMsg && (
                      <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{locationSuccessMsg}</span>
                      </div>
                    )}
                  </div>

                  {/* Role Specific Extra Inputs */}
                  {currentUser?.role === 'driver' && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                      <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5" />
                        <span>ডেলিভারি রাইডার স্পেসিফিক তথ্য</span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">বাইক/যানবাহন প্লেট নম্বর (Vehicle Plate)</label>
                        <input
                          type="text"
                          value={editVehicleNumber}
                          onChange={(e) => setEditVehicleNumber(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          placeholder="Vehicle Name (e.g. TVS Apache)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">রাইডার এমপ্লয়ি আইডি (Driver ID)</label>
                        <input
                          type="text"
                          value={editEmployeeId}
                          onChange={(e) => setEditEmployeeId(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          placeholder="RIDER-ID-XXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">অ্যাসাইনড হাব (Assigned Hub)</label>
                        <input
                          type="text"
                          value={editAssignedHub}
                          onChange={(e) => setEditAssignedHub(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          placeholder="Hub name"
                        />
                      </div>
                    </div>
                  )}

                  {currentUser?.role === 'kitchen' && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                      <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>কিচেন ও রেস্তোরাঁ তথ্য</span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">রেস্তোরাঁ / কিচেন ব্র্যান্ডের নাম</label>
                        <input
                          type="text"
                          value={editRestaurantId}
                          onChange={(e) => setEditRestaurantId(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          placeholder="Kitchen/Restaurant Name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">শেফ স্টাফ আইডি (Employee ID)</label>
                        <input
                          type="text"
                          value={editEmployeeId}
                          onChange={(e) => setEditEmployeeId(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          placeholder="KITCHEN-ID-XXXX"
                        />
                      </div>
                    </div>
                  )}

                  {currentUser?.role === 'admin' && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                      <div className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>এডমিন কন্ট্রোল তথ্য</span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">এডমিন সার্ভিস আইডি (Security ID)</label>
                        <input
                          type="text"
                          value={editEmployeeId}
                          onChange={(e) => setEditEmployeeId(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                          placeholder="ADMIN-ID-XXXX"
                        />
                      </div>
                    </div>
                  )}

                  {/* 5. Avatar Picker */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">প্রোফাইল পিকচার সিলেক্ট করুন বা আপলোড করুন</label>
                    <div className="flex items-center gap-2 mb-2">
                      {AVATAR_PRESETS.map((avatarUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditAvatar(avatarUrl)}
                          className={`relative w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                            editAvatar === avatarUrl ? 'border-orange-500 ring-2 ring-orange-500/40 scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={avatarUrl} alt="Preset Avatar" className="w-full h-full object-cover" />
                          {editAvatar === avatarUrl && (
                            <div className="absolute inset-0 bg-orange-600/30 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white font-bold" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-orange-500/50 rounded-xl px-3 py-2 text-xs text-zinc-300 font-medium flex items-center justify-center gap-2 transition-all w-full">
                      <Camera className="w-4 h-4 text-orange-400" />
                      <span>গ্যালারি বা ক্যামেরা থেকে নিজস্ব ছবি দিন</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              if (uploadEvent.target?.result) {
                                setEditAvatar(uploadEvent.target.result as string);
                                soundManager.playChime('click');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Save Profile Button */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>পরিবর্তন সেভ করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Language & Currency Preferences Section */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                    <Globe className="w-4 h-4 text-orange-400" />
                    <span>অ্যাপের ভাষা ও কারেন্সি (Language & Currency)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Language Toggle */}
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex flex-col gap-1.5">
                    <span className="text-[10px] text-zinc-400 font-medium">ভাষা (Language)</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectLang) onSelectLang('bn');
                          soundManager.playChime('click');
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all ${
                          lang === 'bn'
                            ? 'bg-orange-600 text-white shadow-sm border border-orange-500'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                      >
                        বাংলা
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectLang) onSelectLang('en');
                          soundManager.playChime('click');
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all ${
                          lang === 'en'
                            ? 'bg-orange-600 text-white shadow-sm border border-orange-500'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* Currency Toggle */}
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex flex-col gap-1.5">
                    <span className="text-[10px] text-zinc-400 font-medium">মুদ্রা (Currency)</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectCurrency) onSelectCurrency('INR');
                          soundManager.playChime('click');
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all bg-amber-600 text-white shadow-sm border border-amber-500"
                      >
                        ₹ INR
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancel Active Order */}
              {activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    if (onCancelOrder) onCancelOrder();
                    soundManager.playChime('click');
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>অর্ডার ক্যানসেল করুন (Cancel Order)</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={() => {
                  onLogout();
                  soundManager.playChime('click');
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন</span>
              </button>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <BadgeAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login vs Signup Switcher */}
              <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setAuthAction('login'); setErrorMsg(''); soundManager.playChime('click'); }}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    authAction === 'login' ? 'bg-orange-600 text-white font-bold shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  লগইন করুন
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthAction('signup'); setErrorMsg(''); soundManager.playChime('click'); }}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    authAction === 'signup' ? 'bg-orange-600 text-white font-bold shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  নতুন সাইন আপ (Signup)
                </button>
              </div>

              {/* ======================================================== */}
              {/* 1. CUSTOMER APP AUTH (LOGIN & SIGNUP)                    */}
              {/* ======================================================== */}
              {selectedAppRole === 'customer' && (
                <div className="space-y-4">
                  {authAction === 'login' ? (
                    <>
                      {/* Cust login method selection */}
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setCustLoginMethod('otp')}
                          className={`flex-1 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 ${
                            custLoginMethod === 'otp'
                              ? 'bg-zinc-800 border-orange-500 text-orange-400 font-bold'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>মোবাইল ওটিপি</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustLoginMethod('email')}
                          className={`flex-1 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 ${
                            custLoginMethod === 'email'
                              ? 'bg-zinc-800 border-orange-500 text-orange-400 font-bold'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>ইমেইল লগইন</span>
                        </button>
                      </div>

                      {custLoginMethod === 'otp' ? (
                        otpStep === 'phone' ? (
                          <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                কাস্টমার মোবাইল নাম্বার
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={countryCode}
                                  onChange={(e) => setCountryCode(e.target.value)}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2.5 text-xs text-orange-400 font-bold focus:outline-none"
                                >
                                  <option value="+91">🇮🇳 +91</option>
                                </select>
                                <input
                                  type="tel"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                                  required
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={isLoading}
                              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                            >
                              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>ওটিপি (OTP) পাঠান</span>}
                            </button>
                          </form>
                        ) : (
                          <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300">
                              <span>টেস্ট ওটিপি কোড: </span>
                              <strong className="text-orange-400 font-mono tracking-widest">{simulatedOtp}</strong>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">৪-ডিজিট OTP দিন</label>
                              <input
                                type="text"
                                maxLength={4}
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center text-xl font-mono text-orange-400 font-extrabold focus:outline-none"
                                required
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isLoading}
                              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all"
                            >
                              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>ভেরিফাই ও লগইন</span>}
                            </button>
                          </form>
                        )
                      ) : (
                        <form onSubmit={handleCustomerEmailLogin} className="space-y-3.5">
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">ইমেইল এড্রেস</label>
                            <input
                              type="email"
                              value={custEmail}
                              onChange={(e) => setCustEmail(e.target.value)}
                              placeholder="user@example.com"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">পাসওয়ার্ড</label>
                            <input
                              type="password"
                              value={custPassword}
                              onChange={(e) => setCustPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all"
                          >
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>কাস্টমার লগইন</span>}
                          </button>
                        </form>
                      )}
                    </>
                  ) : (
                    /* CUSTOMER SIGNUP FORM WITH NAME, MOBILE, ADDRESS, CURRENT LOCATION */
                    <form onSubmit={handleCustomerSignup} className="space-y-3.5">
                      <div className="bg-orange-500/10 border border-orange-500/30 p-2.5 rounded-xl text-xs text-orange-300">
                        <span className="font-bold">কাস্টমার নতুন রেজিস্ট্রেশন:</span> নাম, মোবাইল, ঠিকানা ও লাইভ লোকেশন দিয়ে অ্যাকাউন্ট তৈরি করুন।
                      </div>

                      {/* 1. Name */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">আপনার নাম (Full Name)</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={custName}
                            onChange={(e) => setCustName(e.target.value)}
                            placeholder="Enter full name"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                            required
                          />
                        </div>
                      </div>

                      {/* 2. Mobile */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">মোবাইল নাম্বার (Mobile)</label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-orange-400 font-bold focus:outline-none"
                          >
                            <option value="+91">🇮🇳 +91</option>
                          </select>
                          <div className="relative w-full">
                            <Smartphone className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Enter 10 digit number"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Email */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">ইমেইল (Email - Optional)</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                          <input
                            type="email"
                            value={custEmail}
                            onChange={(e) => setCustEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* 4. Delivery Address & Current Location Button */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-zinc-400">ডেলিভারি ঠিকানা (Address)</label>
                          <button
                            type="button"
                            onClick={() => handleDetectCurrentLocation(false)}
                            disabled={isLocating}
                            className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/30 transition-all shadow-sm"
                          >
                            {isLocating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Navigation className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                            )}
                            <span>বর্তমান GPS লোকেশন অটো-সেট</span>
                          </button>
                        </div>

                        <div className="relative">
                          <MapPin className="w-4 h-4 text-orange-400 absolute left-3 top-3" />
                          <textarea
                            rows={2}
                            value={custAddress}
                            onChange={(e) => setCustAddress(e.target.value)}
                            placeholder="Enter your full address"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                            required
                          />
                        </div>



                        {locationSuccessMsg && (
                          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>{locationSuccessMsg}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            <span>কাস্টমার অ্যাকাউন্ট তৈরি করুন</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* 2. KITCHEN STAFF APP AUTH                                */}
              {/* ======================================================== */}
              {selectedAppRole === 'kitchen' && (
                <form onSubmit={handleKitchenAuth} className="space-y-3.5">
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-amber-400" />
                      <span>কিচেন ডিসপ্লে অ্যাপ সাইন-ইন:</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      শেফ এবং কিচেন টিম সদস্যরা কিচেন আইডি ও পিন দিয়ে সরাসরি অর্ডারের লাইভ প্রস্তুতি শুরু করতে পারেন।
                    </p>
                  </div>

                  {authAction === 'signup' && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">রেস্টুরেন্ট / কিচেন নাম</label>
                      <input
                        type="text"
                        value={kitchenName}
                        onChange={(e) => setKitchenName(e.target.value)}
                        placeholder="Kitchen name"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">হেড শেফ / কিচেন স্টাভের নাম</label>
                    <input
                      type="text"
                      value={chefName}
                      onChange={(e) => setChefName(e.target.value)}
                      placeholder="Chef name"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">কিচেন স্টেশন আইডি</label>
                    <input
                      type="text"
                      value={kitchenId}
                      onChange={(e) => setKitchenId(e.target.value)}
                      placeholder="KITCHEN-ID-XXXX"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">শেফ সিকিউরিটি পিন (Passcode)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={chefPin}
                      onChange={(e) => setChefPin(e.target.value)}
                      placeholder="PIN"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-center text-lg font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{authAction === 'signup' ? 'নতুন কিচেন রেজিস্ট্রেশন' : 'কিচেন অ্যাপে প্রবেশ করুন'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* ======================================================== */}
              {/* 3. RIDER DELIVERY APP AUTH                               */}
              {/* ======================================================== */}
              {selectedAppRole === 'driver' && (
                <form onSubmit={handleRiderAuth} className="space-y-3.5">
                  <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-xs text-blue-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Bike className="w-4 h-4 text-blue-400" />
                      <span>ডেলিভারি পার্টনার রাইডার অ্যাপ:</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      রাইডারদের লাইভ জিপিএস রুট, পিকআপ রিকোয়েস্ট এবং কাস্টমার চ্যাটের জন্য ডেলিভারি আইডি দিয়ে লগইন করুন।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">রাইডারের নাম</label>
                    <input
                      type="text"
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      placeholder="Enter Rider Name"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">রাইডার মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                      placeholder="Rider phone number"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">গাড়ির নম্বর (Vehicle Registration Plate)</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="Vehicle plate number"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-blue-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{authAction === 'signup' ? 'নতুন রাইডার অনবোর্ডিং' : 'রাইডার অ্যাপে সাইন ইন'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* ======================================================== */}
              {/* 4. ADMIN APP AUTH                                        */}
              {/* ======================================================== */}
              {selectedAppRole === 'admin' && (
                <form onSubmit={handleAdminAuth} className="space-y-3.5">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-emerald-400" />
                      <span>এডমিন ও ম্যানেজমেন্ট প্যানেল:</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      মেনু আইটেম এডিটিং, প্রাইসিং, ড্রাইভার এসাইন এবং সিস্টেম ওভারভিউয়ের জন্য এডমিন কী প্রদান করুন।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">এডমিনের নাম</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Enter Admin Name"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">এডমিন কর্পোরেট ইমেইল</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">এডমিন মাস্টার সিকিউরিটি পিন / Key</label>
                    <input
                      type="password"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      placeholder="ADMIN-KEY-XXXX"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>এডমিন প্যানেলে প্রবেশ করুন</span>
                    )}
                  </button>
                </form>
              )}

              {/* Language & Currency Preferences Section */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2 text-xs mt-3">
                <div className="flex items-center gap-1.5 font-bold text-zinc-400 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-orange-400" />
                  <span>ভাষা ও কারেন্সি সিলেক্ট করুন</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1">
                    <button
                      type="button"
                      onClick={() => { if (onSelectLang) onSelectLang('bn'); soundManager.playChime('click'); }}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold ${lang === 'bn' ? 'bg-orange-600 text-white' : 'text-zinc-400'}`}
                    >
                      বাংলা
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (onSelectLang) onSelectLang('en'); soundManager.playChime('click'); }}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold ${lang === 'en' ? 'bg-orange-600 text-white' : 'text-zinc-400'}`}
                    >
                      EN
                    </button>
                  </div>

                  <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1">
                    <button
                      type="button"
                      onClick={() => { if (onSelectCurrency) onSelectCurrency('INR'); soundManager.playChime('click'); }}
                      className="flex-1 py-1 rounded-lg text-[11px] font-bold bg-amber-600 text-white"
                    >
                      ₹ INR
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
