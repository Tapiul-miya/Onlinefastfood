import React from 'react';
import { CheckCircle2, ShoppingBag, Clock, MapPin, ArrowRight, X, Sparkles, Bike } from 'lucide-react';
import { Currency, formatPrice } from '../utils/i18n';
import { soundManager } from '../utils/audio';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  totalAmount: number;
  deliveryAddress: string;
  estimatedMinutes?: number;
  currency: Currency;
  onTrackOrder?: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  totalAmount,
  deliveryAddress,
  estimatedMinutes = 20,
  currency,
  onTrackOrder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Overlay Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-white z-10 space-y-5 animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playChime('click');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="absolute -top-1 -right-1 bg-amber-400 text-black p-1.5 rounded-full shadow">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
          </div>

          <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            অর্ডার সফল হয়েছে (Order Placed Successfully)
          </span>

          <h2 className="text-2xl font-extrabold text-white pt-1">
            🎉 ধন্যবাদ! আপনার অর্ডার গৃহীত হয়েছে
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            রেস্টুরেন্ট দ্রুত আপনার অর্ডার কনফার্ম করে ফ্রেশ রান্না শুরু করবে। রাইডার জিপিএস ট্র্যাকিং সক্রিয় রয়েছে।
          </p>
        </div>

        {/* Order Details Summary Box */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-3 text-xs">
          
          <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
            <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-orange-400" /> অর্ডার আইডি:
            </span>
            <span className="font-mono font-extrabold text-white text-sm bg-orange-500/20 text-orange-300 px-2.5 py-0.5 rounded-lg border border-orange-500/30">
              #{orderNumber}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
            <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" /> আনুমানিক সময়:
            </span>
            <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
              ~{estimatedMinutes} মিনিট
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
            <span className="text-zinc-400 font-semibold">সর্বমোট প্রদেয় মূল্য:</span>
            <span className="font-mono text-base font-extrabold text-orange-400">
              {formatPrice(totalAmount, currency)}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-zinc-400 font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" /> গন্তব্য ঠিকানা:
            </span>
            <p className="text-zinc-200 font-medium pl-4 line-clamp-2">
              {deliveryAddress}
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              soundManager.playChime('click');
              if (onTrackOrder) onTrackOrder();
              onClose();
            }}
            className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm"
          >
            <Bike className="w-5 h-5 text-black" />
            <span>🛵 লাইভ অর্ডার ট্র্যাকিং দেখুন (Track Order)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundManager.playChime('click');
              onClose();
            }}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2.5 px-4 rounded-xl transition-colors text-xs"
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
