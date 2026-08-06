import React, { useState } from 'react';
import { 
  Navigation, MapPin, MessageSquare, Zap, Phone, ExternalLink, CheckCircle2
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { MapView } from './MapView';
import { Language, Currency, formatPrice, TRANSLATIONS } from '../utils/i18n';
import { soundManager } from '../utils/audio';

interface DriverViewProps {
  order: Order | null;
  onUpdateStatus: (nextStatus: OrderStatus, logMessage: string, detail?: string) => void;
  onSendMessage: (text: string) => void;
  onOpenChat: () => void;
  lang: Language;
  currency: Currency;
}

export const DriverView: React.FC<DriverViewProps> = ({
  order,
  onUpdateStatus,
  onSendMessage,
  onOpenChat,
  lang,
  currency,
}) => {
  const t = TRANSLATIONS[lang].driverApp;

  if (!order) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-white space-y-4 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center text-3xl">
          🛵
        </div>
        <h2 className="text-xl font-bold">{t.noOrderTitle}</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {t.noOrderDesc}
        </p>
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
      
      {/* Driver Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-zinc-900 rounded-3xl p-6 text-white border border-amber-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={order.driver.photo}
            alt={order.driver.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-black/40 text-amber-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                {t.title} • {order.driver.vehicleType.toUpperCase()} ({order.driver.vehiclePlate})
              </span>
              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                ● {t.gpsActive}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">{order.driver.name}</h1>
            <p className="text-xs text-amber-100">
              অর্ডার #{order.orderNumber} • {formatPrice(order.totalAmount, currency)} ({formatPrice(order.tip, currency)} টিপস)
            </p>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs space-y-1">
          <div className="text-amber-200 font-semibold">{t.currentJob}</div>
          <div className="text-white font-mono text-sm font-extrabold">
            Status: <span className="uppercase text-orange-300">{order.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: GPS Map & Dispatch Control Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Map View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-300 px-2">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <Navigation className="w-4 h-4 text-orange-400" />
                টার্ন-বাই-টার্ন জিপিএস ন্যাভিগেশন
              </span>
              <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[250px]">
                গন্তব্য: {order.customerLocation.address}
              </span>
            </div>

            <div className="h-[400px] w-full">
              <MapView
                restaurantLocation={order.restaurant.location}
                customerLocation={order.customerLocation}
                driverLocation={order.currentDriverLocation}
                routeCoordinates={order.routeCoordinates}
                driver={order.driver}
              />
            </div>
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
                  soundManager.playChime('click');
                  onUpdateStatus('preparing', 'রাইডার কিচেনে পৌঁছেছে', 'খাবার প্যাক করার অপেক্ষায়');
                }}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold text-center transition-colors border border-zinc-700"
              >
                ১. কিচেনে পৌঁছেছি
              </button>

              <button
                id="btn-driver-pickup"
                onClick={() => {
                  soundManager.playChime('driver_pickup');
                  onUpdateStatus('ready_for_pickup', 'রাইডার খাবার রিসিভ করেছে', 'থার্মাল ব্যাগে খাবার রাখা হয়েছে');
                }}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold text-center transition-colors border border-zinc-700"
              >
                ২. খাবার গ্রহণ
              </button>

              <button
                id="btn-driver-enroute"
                onClick={() => {
                  soundManager.playChime('click');
                  onUpdateStatus('on_the_way', 'রাইডার গন্তব্যের উদ্দেশ্যে রওনা দিয়েছে', 'গতি: ৩২ কিমি/ঘণ্টা');
                }}
                className="p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-md"
              >
                ৩. রাইড শুরু
              </button>

              <button
                id="btn-driver-delivered"
                onClick={() => {
                  soundManager.playChime('delivered');
                  onUpdateStatus('delivered', 'খাবার কাস্টমারের নিকট সফলভাবে হস্তান্তরিত হয়েছে!', 'ধন্যবাদ!');
                }}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-md"
              >
                ৪. ডেলিভারি সম্পন্ন
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
