import React from 'react';
import { X, AlertTriangle, ShieldCheck, RefreshCw, Clock, Tag, FileText, ArrowRight, CornerDownRight } from 'lucide-react';
import { Order } from '../types';
import { Language, Currency, formatPrice } from '../utils/i18n';
import { soundManager } from '../utils/audio';

interface CancelledOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onReorder?: (order: Order) => void;
  lang?: Language;
  currency?: Currency;
}

export const CancelledOrderModal: React.FC<CancelledOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onReorder,
  currency = 'INR' as Currency,
}) => {
  if (!isOpen || !order) return null;

  // Find the cancellation log
  const cancelLog = order.orderLogs?.slice().reverse().find(l => l.status === 'cancelled') || {
    message: 'অর্ডার ক্যানসেল করা হয়েছে (Order Cancelled)',
    detail: 'অর্ডার সার্ভিস প্রক্রিয়া বাতিল করা হয়েছে।',
    timestamp: order.createdAt,
    actor: 'system'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-zinc-900 border border-red-500/40 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Cancel Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-zinc-950 p-5 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-500 text-white tracking-wider">
                  অর্ডার বাতিল (Cancelled)
                </span>
                <span className="text-xs font-mono text-zinc-300">#{order.orderNumber}</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                অর্ডার ক্যানসেল করা হয়েছে
              </h2>
            </div>
          </div>

          <button
            id="btn-close-cancel-modal"
            onClick={() => {
              soundManager.playChime('click');
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Main Cancellation Message Box */}
          <div className="bg-zinc-950 border border-red-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <CornerDownRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase text-red-400 tracking-wider">
                  বাতিলের মেসেজ / কারণ (Cancellation Message):
                </h3>
                <p className="text-sm font-extrabold text-white mt-1 leading-snug">
                  "{cancelLog.message}"
                </p>
                {cancelLog.detail && (
                  <p className="text-xs text-zinc-300 mt-1 bg-red-950/40 p-2.5 rounded-xl border border-red-900/50">
                    {cancelLog.detail}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80 font-mono">
              <span>সময়: {cancelLog.timestamp || order.createdAt}</span>
              <span>
                প্যারামিটার: {cancelLog.actor === 'customer' ? 'কাস্টমার নিজে' : cancelLog.actor === 'kitchen' ? 'রেস্টুরেন্ট কিচেন' : cancelLog.actor === 'driver' ? 'ডেলিভারি রাইডার' : 'সিস্টেম অটোমেটিক'}
              </span>
            </div>
          </div>

          {/* Refund Status Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-emerald-500/40 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ১০০% রিফান্ড স্ট্যাটাস (Refund Details)
              </span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                সম্পন্ন (Initiated)
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-zinc-300">ফেরতযোগ্য মোট মূল্য:</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {formatPrice(order.totalAmount, currency)}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
              💳 <strong>রিফান্ড তথ্য:</strong> আপনার পেমেন্ট ওয়ালেট / কার্ড / বিকাশ অ্যাকাউন্টে আগামী <strong>৫ থেকে ১০ মিনিটের মধ্যে</strong> ১০০% টাকা স্বয়ংক্রিয়ভাবে ফেরত চলে আসবে।
            </p>
          </div>

          {/* Cancelled Order Items Summary */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-400 font-bold border-b border-zinc-800 pb-2">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-orange-400" />
                বাতিল হওয়া আইটেমস ({order.items.length} টি):
              </span>
              <span className="font-mono text-zinc-300">{order.restaurant.name}</span>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div key={`${item.cartItemId}_${idx}`} className="flex items-center justify-between text-zinc-300">
                  <span className="truncate">
                    <strong className="text-orange-400 font-mono">{item.quantity}x</strong> {item.menuItem.name}
                  </span>
                  <span className="font-mono text-zinc-400">{formatPrice(item.itemTotalPrice, currency)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-2">
          {onReorder && (
            <button
              onClick={() => {
                soundManager.playChime('click');
                onReorder(order);
                onClose();
              }}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>পুনরায় অর্ডার করুন</span>
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playChime('click');
              onClose();
            }}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <span>বন্ধ করুন (Close)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
