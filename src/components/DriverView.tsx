import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, MapPin, MessageSquare, Zap, Phone, ExternalLink, CheckCircle2,
  Bike, User, Edit3, ShieldCheck, Star, Award, Compass, RefreshCw, Radio,
  Eye, EyeOff
} from 'lucide-react';
import { Order, OrderStatus, UserProfile, GeoPoint } from '../types';
import { MapView } from './MapView';
import { Language, Currency, formatPrice, TRANSLATIONS } from '../utils/i18n';
import { soundManager } from '../utils/audio';
import { fetchCurrentGpsLocation } from '../utils/geolocation';

interface DriverViewProps {
  order: Order | null;
  allOrders?: Order[];
  onSelectOrder?: (selectedOrder: Order) => void;
  onUpdateStatus: (nextStatus: OrderStatus, logMessage: string, detail?: string) => void;
  onSendMessage: (text: string) => void;
  onOpenChat: () => void;
  lang: Language;
  currency: Currency;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onUpdateDriverLocation?: (newLocation: GeoPoint, addressStr: string) => void;
}

export const DriverView: React.FC<DriverViewProps> = ({
  order,
  allOrders = [],
  onSelectOrder,
  onUpdateStatus,
  onSendMessage,
  onOpenChat,
  lang,
  currency,
  currentUser,
  onOpenAuth,
  onUpdateDriverLocation,
}) => {
  const t = TRANSLATIONS[lang].driverApp;

  // Real device GPS state
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentGpsCoords, setCurrentGpsCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);

  // Ref for onUpdateDriverLocation callback to avoid re-triggering watchPosition effect
  const onUpdateDriverLocationRef = useRef(onUpdateDriverLocation);
  useEffect(() => {
    onUpdateDriverLocationRef.current = onUpdateDriverLocation;
  }, [onUpdateDriverLocation]);

  // Function to manually trigger device GPS fetch
  const handleFetchRealGps = async () => {
    soundManager.playChime('click');
    setGpsLoading(true);
    setGpsError(null);
    const result = await fetchCurrentGpsLocation();
    setGpsLoading(false);

    if (result.success && result.lat && result.lng) {
      setCurrentGpsCoords({ lat: result.lat, lng: result.lng });
      setIsLiveGpsActive(true);
      if (onUpdateDriverLocationRef.current) {
        onUpdateDriverLocationRef.current(
          { lat: result.lat, lng: result.lng, address: result.address },
          result.address || `GPS: ${result.lat.toFixed(4)}° N, ${result.lng.toFixed(4)}° E`
        );
      }
    } else {
      setGpsError(result.errorMessage || 'জিপিএস কানেক্ট করা যায়নি।');
    }
  };

  // Watch position for continuous real-time live location tracking
  useEffect(() => {
    let watchId: number | null = null;
    if (isLiveGpsActive && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          setCurrentGpsCoords({ lat, lng, accuracy });
          const addr = `রিয়েল ডিভাইস জিপিএস (GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;
          if (onUpdateDriverLocationRef.current) {
            onUpdateDriverLocationRef.current({ lat, lng, address: addr }, addr);
          }
        },
        (err) => {
          console.warn('Live GPS watch error:', err);
          if (err.code === 1) {
            setGpsError('ব্রাউজার লোকেশন পারমিশন ডিনাই করা হয়েছে।');
            setIsLiveGpsActive(false);
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    }
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isLiveGpsActive]);

  // Active rider profile data from currentUser or fallback to default
  const riderName = currentUser?.name || 'তাপিওল বান্দেগী (Rider Tapiul Bandegi)';
  const riderPhone = currentUser?.phone || '+91 98310-99482';
  const riderPhoto = currentUser?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300';
  const vehicleNo = currentUser?.vehicleNumber || 'TVS Apache 160 (WB-02-AK-4819)';
  const empId = currentUser?.employeeId || 'DRV-KOL-9948';
  const rating = currentUser?.rating || 4.95;
  const trips = currentUser?.tripsCompleted || 1840;

  // Find all active/pending orders from queue
  const pendingOrders = allOrders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  if (!order || order.status === 'cancelled') {
    return (
      <div className="space-y-6">
        {/* Rider Online Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-amber-950/40 to-zinc-900 border border-amber-500/30 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl shrink-0 animate-pulse">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  ডেলিভারি রাইডার ডিউটি অন (Active Duty)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{riderName}</h2>
              <p className="text-xs text-zinc-400">{vehicleNo} • {riderPhone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded-xl font-bold font-mono">
              পেন্ডিং ডেলিভারি টাস্ক: {pendingOrders.length}টি
            </span>
          </div>
        </div>

        {/* Pending Delivery Task Queue */}
        {pendingOrders.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span>📦 নতুন ডেলিভারি টাস্ক তালিকা ({pendingOrders.length}টি পাওয়া গেছে)</span>
              </h3>
              <span className="text-xs text-zinc-400 animate-pulse">
                টাস্ক সিলেক্ট করতে যেকোনো অর্ডারে ক্লিক করুন
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOrders.map((pOrder) => (
                <div
                  key={pOrder.id}
                  onClick={() => {
                    soundManager.playChime('click');
                    if (onSelectOrder) onSelectOrder(pOrder);
                  }}
                  className="bg-zinc-900 border border-amber-500/40 hover:border-amber-400 rounded-3xl p-5 text-white space-y-3 cursor-pointer transition-all hover:scale-[1.01] shadow-xl group"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl font-mono text-xs font-extrabold">
                        #{pOrder.orderNumber}
                      </span>
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        {pOrder.status === 'placed' ? 'নতুন অর্ডার' : pOrder.status === 'preparing' ? 'কিচেনে প্রস্তুত হচ্ছে' : pOrder.status === 'ready_for_pickup' ? 'পিকআপ রেডি' : pOrder.status}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">{pOrder.createdAt}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="font-extrabold text-white text-sm">{pOrder.customerName} ({pOrder.customerPhone})</div>
                    <p className="text-zinc-300 font-medium line-clamp-2 leading-relaxed">
                      📍 গন্তব্য: <span className="text-amber-300">{pOrder.deliveryAddress}</span>
                    </p>
                    <div className="text-zinc-400 text-[11px] font-mono pt-1">
                      আইটেম: {pOrder.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.playChime('click');
                      if (onSelectOrder) onSelectOrder(pOrder);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 group-hover:bg-amber-400"
                  >
                    <span>🛵 ডেলিভারি টাস্ক শুরু করুন</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-white space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center text-3xl animate-pulse">
              🛵
            </div>
            <h2 className="text-xl font-bold">{t.noOrderTitle}</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              কাস্টমার অ্যাপ থেকে যেকোনো খাবার প্লেস করলে আপনার স্ক্রিনে তাৎক্ষণিকভাবে ডেলিভারি টাস্ক টিকেট ওপেন হবে।
            </p>
          </div>
        )}
      </div>
    );
  }

  const QUICK_DRIVER_MESSAGES = [
    'আমি রেস্তোরাঁ কিচেনে পৌঁছে গেছি খাবার রিসিভ করতে 📦',
    'খাবার সংগৃহীত হয়েছে! রাইড শুরু করা হচ্ছে 🛵',
    'আমি আপনার লোকেশনের ২ মিনিটের দূরত্বে আছি 📍',
    'গেট/বাইরে অপেক্ষা করছি 🚪',
  ];

  const handleSendQuickNote = (note: string) => {
    soundManager.playChime('click');
    onSendMessage(note);
    onUpdateStatus(order.status, `রাইডার নোট: "${note}"`, 'Pushed via Courier App');
  };

  return (
    <div className="space-y-6">
      
      {/* Sleek Mini Profile Header & Toggle Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between text-white shadow-xl gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">ডেলিভারি পার্টনার প্রোফাইল</div>
            <div className="text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
              <span>{riderName}</span>
              <span className="text-[10px] bg-zinc-800/80 text-zinc-400 px-2.5 py-0.5 rounded-lg font-mono border border-zinc-700/80 font-bold">
                {vehicleNo}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* Active Job Marker */}
          <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl text-[10px] font-extrabold font-mono text-orange-400">
            {t.currentJob}: #{order.orderNumber}
          </div>
          
          <button
            id="btn-toggle-driver-profile"
            onClick={() => {
              soundManager.playChime('click');
              setShowProfile(!showProfile);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer hover:text-white shadow-sm"
          >
            {showProfile ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-orange-400" />}
            <span>{showProfile ? 'প্রোফাইল লুকান' : 'প্রোফাইল দেখান'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Driver Top Banner */}
      {showProfile && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-zinc-900 rounded-3xl p-6 text-white border border-amber-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-4">
            <img
              src={riderPhoto}
              alt={riderName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg ring-2 ring-amber-400/30"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-black/40 text-amber-200 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border border-amber-500/30">
                  🏍️ ডেলিভারি প্রোফাইল • {vehicleNo}
                </span>
                <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                  ● লাইভ জিপিএস অ্যাক্টিভ ({empId})
                </span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight mt-1">{riderName}</h1>
              <p className="text-xs text-amber-100 flex items-center gap-2 mt-0.5">
                <span>ফোন: {riderPhone}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> {rating} ({trips}টি ট্রিপ)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundManager.playChime('click');
                if (onOpenAuth) onOpenAuth();
              }}
              className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-400/40 text-amber-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>রাইডার প্রোফাইল এডিট</span>
            </button>

            <div className="bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs space-y-1">
              <div className="text-amber-200 font-semibold">{t.currentJob}</div>
              <div className="text-white font-mono text-sm font-extrabold">
                অর্ডার #{order.orderNumber}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: GPS Map & Dispatch Control Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Map View & Real Live GPS Control */}
        <div className="lg:col-span-2 space-y-4">

          {/* Real Live GPS Device Tracker Card */}
          <div className="bg-gradient-to-r from-zinc-900 via-amber-950/40 to-zinc-900 border border-amber-500/40 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                  isLiveGpsActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      📡 রিয়েল ডিভাইস জিপিএস লাইভ লোকেশন (Real GPS)
                    </span>
                    {isLiveGpsActive ? (
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        লাইভ সিগন্যাল একটিভ
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        ম্যানুয়াল অবস্থান
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {currentGpsCoords
                      ? `ডিভাইস স্থানাঙ্ক: ${currentGpsCoords.lat.toFixed(5)}° N, ${currentGpsCoords.lng.toFixed(5)}° E (${currentGpsCoords.accuracy ? `নির্ভুলতা ±${Math.round(currentGpsCoords.accuracy)}m` : 'জিপিএস লক'})`
                      : 'আপনার মোবাইল/কম্পিউটারের বাস্তব জিপিএস অবস্থান ম্যাপে সরাসরি দেখান।'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={handleFetchRealGps}
                  disabled={gpsLoading}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Compass className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'জিপিএস খোঁজা হচ্ছে...' : 'আমার জিপিএস আনুন'}</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playChime('click');
                    setIsLiveGpsActive((prev) => !prev);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95 ${
                    isLiveGpsActive
                      ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200 hover:bg-emerald-600/50'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLiveGpsActive ? 'animate-spin' : ''}`} />
                  <span>{isLiveGpsActive ? 'লাইভ ওয়াচ অন' : 'ওয়াচ চালু করুন'}</span>
                </button>
              </div>
            </div>

            {gpsError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2">
                <span>⚠️ {gpsError}</span>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-300 px-2">
              <div className="flex items-center gap-3">
                <span className="font-bold flex items-center gap-1.5 text-white">
                  <Navigation className="w-4 h-4 text-orange-400" />
                  টার্ন-বাই-টার্ন জিপিএস ন্যাভিগেশন
                </span>
                <button
                  id="btn-toggle-driver-map"
                  onClick={() => {
                    soundManager.playChime('click');
                    setShowMap(!showMap);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-300 text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm hover:text-white"
                >
                  {showMap ? <EyeOff className="w-3.5 h-3.5 text-zinc-400" /> : <Eye className="w-3.5 h-3.5 text-orange-400" />}
                  <span>{showMap ? 'ম্যাপ লুকান' : 'ম্যাপ দেখান'}</span>
                </button>
              </div>
              <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[250px]">
                গন্তব্য: {order.customerLocation.address}
              </span>
            </div>

            {showMap ? (
              <div className="h-[400px] w-full">
                <MapView
                  restaurantLocation={order.restaurant.location}
                  customerLocation={order.customerLocation}
                  driverLocation={order.currentDriverLocation}
                  routeCoordinates={order.routeCoordinates}
                  driver={order.driver}
                />
              </div>
            ) : (
              <div className="h-[120px] w-full rounded-2xl bg-zinc-950/60 border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center p-4">
                <div className="p-2.5 bg-orange-500/10 rounded-full border border-orange-500/20 mb-2">
                  <Navigation className="w-5 h-5 text-orange-400/80 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-zinc-300">🗺️ জিপিএস ন্যাভিগেশন ম্যাপটি লুকানো আছে</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">ন্যাভিগেশন দেখতে উপরের "ম্যাপ দেখান" বোতামটিতে ক্লিক করুন</p>
              </div>
            )}
          </div>

          {/* Quick Courier Action Buttons */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> ডেলিভারি স্ট্যাটাস আপডেট বাটন (লাইভ আপডেট হবে)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                id="btn-driver-at-kitchen"
                onClick={() => {
                  soundManager.playChime('driver_at_kitchen');
                  onUpdateStatus('preparing', 'রাইডার কিচেনে পৌঁছেছে', 'খাবার প্যাক করার অপেক্ষায়');
                }}
                className={`p-3 rounded-xl text-xs font-bold text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                  order.status === 'preparing'
                    ? 'bg-amber-500 text-black border-2 border-amber-300 font-extrabold shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40 scale-[1.02]'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80'
                }`}
              >
                <span>১. কিচেনে পৌঁছেছি</span>
                {order.status === 'preparing' && (
                  <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                    ✓ বর্তমান স্ট্যাটাস
                  </span>
                )}
              </button>

              <button
                id="btn-driver-pickup"
                onClick={() => {
                  soundManager.playChime('driver_pickup');
                  onUpdateStatus('ready_for_pickup', 'রাইডার খাবার রিসিভ করেছে', 'থার্মাল ব্যাগে খাবার রাখা হয়েছে');
                }}
                className={`p-3 rounded-xl text-xs font-bold text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                  order.status === 'ready_for_pickup'
                    ? 'bg-blue-500 text-white border-2 border-blue-300 font-extrabold shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/40 scale-[1.02]'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80'
                }`}
              >
                <span>২. খাবার গ্রহণ</span>
                {order.status === 'ready_for_pickup' && (
                  <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                    ✓ বর্তমান স্ট্যাটাস
                  </span>
                )}
              </button>

              <button
                id="btn-driver-enroute"
                onClick={() => {
                  soundManager.playChime('driver_started_ride');
                  onUpdateStatus('on_the_way', 'রাইডার গন্তব্যের উদ্দেশ্যে রওনা দিয়েছে', 'গতি: ৩২ কিমি/ঘণ্টা');
                }}
                className={`p-3 rounded-xl text-xs font-bold text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                  order.status === 'on_the_way'
                    ? 'bg-amber-500 text-black border-2 border-amber-300 font-extrabold shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40 scale-[1.02]'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80'
                }`}
              >
                <span>৩. রাইড শুরু</span>
                {order.status === 'on_the_way' && (
                  <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                    ✓ বর্তমান স্ট্যাটাস
                  </span>
                )}
              </button>

              <button
                id="btn-driver-delivered"
                onClick={() => {
                  soundManager.playChime('delivered');
                  onUpdateStatus('delivered', 'খাবার কাস্টমারের নিকট সফলভাবে হস্তান্তরিত হয়েছে!', 'ধন্যবাদ!');
                }}
                className={`p-3 rounded-xl text-xs font-bold text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                  order.status === 'delivered'
                    ? 'bg-emerald-500 text-black border-2 border-emerald-300 font-extrabold shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/40 scale-[1.02]'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80'
                }`}
              >
                <span>৪. ডেলিভারি সম্পন্ন</span>
                {order.status === 'delivered' && (
                  <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                    ✓ বর্তমান স্ট্যাটাস
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Customer Details & Messenger */}
        <div className="space-y-5">
          
          {/* Customer Address & Contact Card */}
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-5 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                কাস্টমার গন্তব্য লোকেশন
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                জিপিএস কানেক্টেড
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Customer Info Box */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-white text-sm">{order.customerName}</div>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-sm transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>কল করুন</span>
                  </a>
                </div>

                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-zinc-200 font-semibold space-y-1">
                  <div className="text-[10px] text-zinc-400">ডেলিভারির সঠিক ঠিকানা:</div>
                  <div className="text-xs text-emerald-300 font-bold leading-relaxed">{order.deliveryAddress}</div>
                </div>

                <div className="text-[11px] text-zinc-400 font-mono">
                  ফোন: <span className="text-white font-bold">{order.customerPhone}</span>
                </div>
              </div>

              {/* Google Maps External Directions Link */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>গুগল ম্যাপসে সরাসরি দিকনির্দেশনা দেখুন (Google Maps Navigation)</span>
              </a>

              {order.deliveryNotes && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300 text-xs">
                  <span className="font-bold">কাস্টমার ডেলিভারি নোট:</span> "{order.deliveryNotes}"
                </div>
              )}
            </div>

            <button
              onClick={onOpenChat}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.openChat}</span>
            </button>
          </div>

          {/* Quick Note Sender */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-white space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t.quickNoteTitle}
            </h3>

            <div className="space-y-1.5">
              {QUICK_DRIVER_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => handleSendQuickNote(msg)}
                  className="w-full text-left p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs transition-colors line-clamp-1"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
