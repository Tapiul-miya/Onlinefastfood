import React, { useState } from 'react';
import { 
  Clock, Phone, MessageSquare, MapPin, 
  AlertTriangle, Play, Pause, Sparkles, RefreshCw, ChevronRight,
  ShoppingBag, User, FileText, Store, ChevronDown, ChevronUp, CheckCircle2, Receipt, Tag
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { MapView } from './MapView';
import { Language, Currency, formatPrice, TRANSLATIONS } from '../utils/i18n';
import { soundManager } from '../utils/audio';

interface RealtimeTrackerProps {
  order: Order;
  onOpenChat: () => void;
  onSimulateProgress: (nextStatus: OrderStatus, customMessage?: string) => void;
  onTriggerDelay: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  onCompleteDelivery: () => void;
  lang: Language;
  currency: Currency;
}

export const RealtimeTracker: React.FC<RealtimeTrackerProps> = ({
  order,
  onOpenChat,
  onSimulateProgress,
  onTriggerDelay,
  isPaused,
  onTogglePause,
  simSpeed,
  onChangeSimSpeed,
  onCompleteDelivery,
  lang,
  currency,
}) => {
  const t = TRANSLATIONS[lang].tracker;
  const [showOrderDetails, setShowOrderDetails] = useState(true);

  const STAGES: { id: OrderStatus; label: string; icon: string }[] = [
    { id: 'placed', label: t.placed, icon: '📝' },
    { id: 'confirmed', label: t.confirmed, icon: '✅' },
    { id: 'preparing', label: t.preparing, icon: '🍳' },
    { id: 'ready_for_pickup', label: t.ready, icon: '📦' },
    { id: 'on_the_way', label: t.onTheWay, icon: '🛵' },
    { id: 'arriving', label: t.arriving, icon: '🔔' },
    { id: 'delivered', label: t.delivered, icon: '🎉' },
  ];

  const getStageIndex = (status: OrderStatus) => {
    return STAGES.findIndex((s) => s.id === status);
  };

  const currentStageIndex = getStageIndex(order.status);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Status Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono text-xs font-bold">
                {t.orderNumber} #{order.orderNumber}
              </span>
              <span className="text-xs text-zinc-400">{t.placedAt} {order.createdAt}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
              {order.status === 'delivered' ? (
                <span className="text-emerald-400">🎉 অর্ডার সফলভাবে ডেলিভার করা হয়েছে!</span>
              ) : order.status === 'arriving' ? (
                <span className="text-amber-400">🔔 ডেলিভারি রাইডার আপনার দরজার বাইরে পৌঁছেছেন!</span>
              ) : order.status === 'on_the_way' ? (
                <span className="text-orange-400">🛵 রাইডার {order.driver.name.split(' ')[0]} খাবার নিয়ে আপনার ঠিকানায় আসছেন!</span>
              ) : (
                <span className="text-white">🍳 কিচেনে আপনার পছন্দের খাবার প্রস্তুত হচ্ছে...</span>
              )}
            </h1>
          </div>

          {/* ETA Card */}
          <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-2xl p-3.5 text-right shrink-0 flex sm:flex-col justify-between items-center sm:items-end">
            <span className="text-xs text-zinc-400 font-medium">{t.estimatedTime}</span>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400 animate-pulse" />
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-orange-400">
                {order.status === 'delivered' ? '00:00' : `${Math.max(1, order.estimatedDeliveryMinutes)} মি.`}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Step Animated Progress Bar */}
        <div className="pt-2">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {STAGES.map((stage, idx) => {
              const isDone = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.id} className="space-y-2">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-base transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                          : isCurrent
                          ? 'bg-orange-500 text-white font-extrabold ring-4 ring-orange-500/30 scale-110 shadow-lg shadow-orange-500/30 animate-bounce'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {isDone ? '✓' : stage.icon}
                    </div>
                  </div>
                  <p
                    className={`text-[10px] sm:text-xs font-semibold truncate ${
                      isDone
                        ? 'text-emerald-400'
                        : isCurrent
                        ? 'text-orange-400 font-bold'
                        : 'text-zinc-600'
                    }`}
                  >
                    {stage.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(5, (currentStageIndex / (STAGES.length - 1)) * 100))}%`,
              }}
            />
          </div>
        </div>

      </div>

      {/* Main Grid: Map & Details side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live GPS Interactive Map */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-300 font-medium px-2">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <MapPin className="w-4 h-4 text-orange-400" />
                {t.liveGpsTitle}
              </span>
              <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                <span>গতি: <strong className="text-white">{order.driverSpeedKmh} কিমি/ঘণ্টা</strong></span>
                <span>দূরত্ব: <strong className="text-white">{order.driverDistanceKm.toFixed(1)} কিমি</strong></span>
              </div>
            </div>

            {/* Map Component */}
            <div className="h-[280px] sm:h-[420px] w-full">
              <MapView
                restaurantLocation={order.restaurant.location}
                customerLocation={order.customerLocation}
                driverLocation={order.currentDriverLocation}
                routeCoordinates={order.routeCoordinates}
                driver={order.driver}
              />
            </div>
          </div>

          {/* Interactive Live Simulation Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> জিপিএস সিমুলেটর স্পিড কনট্রোল
              </span>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                গতি: {simSpeed}x
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              
              {/* Play / Pause Movement */}
              <button
                id="btn-toggle-sim-pause"
                onClick={onTogglePause}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'রাইডার চলুক' : 'পজ করুন'}</span>
              </button>

              {/* Speed Multiplier */}
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onChangeSimSpeed(speed)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-colors ${
                    simSpeed === speed
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}

              {/* Trigger Traffic Delay */}
              <button
                id="btn-sim-traffic-delay"
                onClick={onTriggerDelay}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>ট্রাফিক সিগন্যাল (+৩মি.)</span>
              </button>

              {/* Instant Next Stage */}
              <button
                id="btn-sim-next-stage"
                onClick={() => {
                  soundManager.playChime('click');
                  if (order.status === 'placed') onSimulateProgress('confirmed', 'অর্ডার কনফার্ম হয়েছে');
                  else if (order.status === 'confirmed') onSimulateProgress('preparing', 'খাবার রান্না শুরু হয়েছে');
                  else if (order.status === 'preparing') onSimulateProgress('ready_for_pickup', 'খাবার প্যাকেট সম্পন্ন');
                  else if (order.status === 'ready_for_pickup') onSimulateProgress('on_the_way', 'রাইডার রওনা দিয়েছেন');
                  else if (order.status === 'on_the_way') onSimulateProgress('arriving', 'রাইডার কাছাকাছি পৌঁছেছেন');
                  else if (order.status === 'arriving') onCompleteDelivery();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold ml-auto shadow-md"
              >
                <span>পরবর্তী ধাপ</span>
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>
          </div>

          {/* Customer Detailed Order Items & Delivery Summary Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl text-white space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    📋 অর্ডার আইটেম ও ডেলিভারি বিবরণ (Order Details)
                  </h3>
                  <p className="text-[11px] text-zinc-400">অর্ডার নম্বর: #{order.orderNumber} • {order.items.length} টি আইটেম</p>
                </div>
              </div>

              <button
                onClick={() => setShowOrderDetails((prev) => !prev)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <span>{showOrderDetails ? 'সংক্ষেপ করুন' : 'বিস্তারিত দেখুন'}</span>
                {showOrderDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Expanded Detailed Breakdown */}
            {showOrderDetails && (
              <div className="space-y-4 pt-1">
                
                {/* Current Detailed Status Explanation */}
                <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-zinc-900 border border-orange-500/30 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    {order.status === 'delivered' ? '✓' : '🛵'}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-orange-400 uppercase tracking-wide">
                      বর্তমান স্ট্যাটাস অবস্থা:
                    </span>
                    <p className="text-xs font-bold text-white">
                      {order.status === 'placed' && '📝 অর্ডার সিস্টেমে গ্রহণ করা হয়েছে। রেস্টুরেন্ট পর্যালোচনার অপেক্ষায়।'}
                      {order.status === 'confirmed' && '✅ রেস্টুরেন্ট অর্ডার কনফার্ম করেছে। কিচেনে তথ্য পাঠানো হয়েছে।'}
                      {order.status === 'preparing' && '🍳 কিচেনে অভিজ্ঞ শেফ আপনার ফ্রেশ খাবার রান্না করছেন।'}
                      {order.status === 'ready_for_pickup' && '📦 খাবার থার্মাল কন্টেইনারে সিল করা প্যাক সম্পন্ন, রাইডারের অপেক্ষায়।'}
                      {order.status === 'on_the_way' && '🛵 ডেলিভারি রাইডার খাবার গ্রহণ করে আপনার ঠিকানায় আসছেন।'}
                      {order.status === 'arriving' && '🔔 রাইডার আপনার বাড়ির একদম কাছে পৌঁছে গেছেন!'}
                      {order.status === 'delivered' && '🎉 অর্ডার সফলভাবে আপনার নিকট ডেলিভার করা সম্পন্ন হয়েছে!'}
                    </p>
                  </div>
                </div>

                {/* Grid: Customer Info & Restaurant Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Delivery Destination */}
                  <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                      <User className="w-3.5 h-3.5 text-orange-400" />
                      <span>গ্রাহক ও ঠিকানার তথ্য</span>
                    </div>
                    <p className="font-extrabold text-white text-sm">{order.customerName}</p>
                    <p className="text-zinc-300 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-zinc-400" /> {order.customerPhone}
                    </p>
                    <p className="text-zinc-300 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <span>{order.deliveryAddress}</span>
                    </p>
                    {order.deliveryNotes && (
                      <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1">
                        💬 <strong>নির্দেশনা:</strong> {order.deliveryNotes}
                      </p>
                    )}
                  </div>

                  {/* Restaurant Info */}
                  <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                      <Store className="w-3.5 h-3.5 text-orange-400" />
                      <span>রেস্টুরেন্ট তথ্য</span>
                    </div>
                    <p className="font-extrabold text-white text-sm">{order.restaurant.name}</p>
                    <p className="text-zinc-300 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-zinc-400" /> {order.restaurant.phone}
                    </p>
                    <p className="text-zinc-300 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{order.restaurant.address}</span>
                    </p>
                  </div>
                </div>

                {/* Itemized Order Items Table */}
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden text-xs">
                  <div className="bg-zinc-800/60 px-4 py-2.5 font-bold text-zinc-300 flex justify-between border-b border-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-orange-400" /> খাবার আইটেম তালিকা
                    </span>
                    <span>মূল্য</span>
                  </div>

                  <div className="divide-y divide-zinc-800/60">
                    {order.items.map((item, idx) => (
                      <div key={`${item.cartItemId}_${idx}`} className="p-3 flex items-start justify-between gap-3 hover:bg-zinc-900/50 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-lg font-mono font-extrabold text-xs">
                            {item.quantity}x
                          </span>
                          <div>
                            <p className="font-bold text-white text-xs">{item.menuItem.name}</p>
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                {item.selectedOptions.map((o) => o.choiceName).join(', ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-[10px] text-amber-400/90 italic">
                                "{item.specialInstructions}"
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="font-extrabold text-white font-mono shrink-0">
                          {formatPrice(item.itemTotalPrice, currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-zinc-900/90 p-3.5 border-t border-zinc-800 space-y-1.5 text-xs font-medium">
                    <div className="flex justify-between text-zinc-400">
                      <span>সাবটোটাল (Subtotal):</span>
                      <span className="font-mono text-zinc-200">{formatPrice(order.subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>ডেলিভারি চার্জ (Delivery Fee):</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {order.deliveryFee === 0 ? 'ফ্রি (FREE)' : formatPrice(order.deliveryFee, currency)}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>ডিসকাউন্ট (Discount):</span>
                        <span className="font-mono">-{formatPrice(order.discount, currency)}</span>
                      </div>
                    )}
                    {order.tip > 0 && (
                      <div className="flex justify-between text-amber-300">
                        <span>রাইডার টিপস (Tip):</span>
                        <span className="font-mono">{formatPrice(order.tip, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-zinc-800">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4 text-orange-400" /> সর্বমোট মূল্য (Total):
                      </span>
                      <span className="font-mono text-orange-400 text-base">
                        {formatPrice(order.totalAmount, currency)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Right 1 Col: Driver Card & Live Activity Stream */}
        <div className="space-y-5">
          
          {/* Driver Information Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.courierTitle}</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                GPS অনলাইন
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={order.driver.photo}
                alt={order.driver.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-md"
              />
              <div>
                <h3 className="font-extrabold text-base text-white">{order.driver.name}</h3>
                <p className="text-xs text-zinc-400 font-medium">
                  {order.driver.vehicleType.toUpperCase()} • {order.driver.vehiclePlate}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-extrabold">
                    ★ {order.driver.rating}
                  </span>
                  <span className="text-zinc-500 font-mono">{order.driver.tripsCompleted} টি সফল ডেলিভারি</span>
                </div>
              </div>
            </div>

            {/* Action buttons: Call & Direct Chat */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
              <a
                href={`tel:${order.driver.phone}`}
                onClick={() => soundManager.playChime('click')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-colors border border-zinc-700/60"
              >
                <Phone className="w-4 h-4" />
                <span>{t.callCourier}</span>
              </a>

              <button
                id="btn-open-driver-chat"
                onClick={() => { soundManager.playChime('click'); onOpenChat(); }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.chatCourier}</span>
              </button>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl text-white space-y-3">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
                <h3 className="font-bold text-sm text-white">{t.activityFeed}</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">লাইভ আপডেট</span>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {order.orderLogs.map((log, idx) => (
                <div
                  key={`${log.id || 'log'}_${idx}`}
                  className="bg-zinc-950/70 border border-zinc-800/80 p-3 rounded-xl space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="font-semibold text-orange-400 flex items-center gap-1">
                      {log.actor === 'kitchen' && '🍳 কিচেন'}
                      {log.actor === 'driver' && '🛵 রাইডার'}
                      {log.actor === 'customer' && '🧑‍💻 কাস্টমার'}
                      {log.actor === 'system' && '⚡ সিস্টেম'}
                    </span>
                    <span className="font-mono text-zinc-500 text-[10px]">{log.timestamp}</span>
                  </div>
                  <p className="text-zinc-200 font-medium leading-tight">{log.message}</p>
                  {log.detail && (
                    <p className="text-[11px] text-zinc-500">{log.detail}</p>
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
