import React, { useState } from 'react';
import { X, Star, RefreshCw, Check, Clock, Heart, Award, AlertTriangle, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../types';
import { soundManager } from '../utils/audio';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderHistory: Order[];
  onReorder: (order: Order) => void;
  onSubmitRating: (orderId: string, foodRating: number, driverRating: number, feedback: string) => void;
  onViewCancelledOrder?: (order: Order) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orderHistory,
  onReorder,
  onSubmitRating,
  onViewCancelledOrder,
}) => {
  if (!isOpen) return null;

  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [foodRating, setFoodRating] = useState<number>(5);
  const [driverRating, setDriverRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [submittedMessage, setSubmittedMessage] = useState<string>('');

  const handleOpenRating = (orderId: string) => {
    soundManager.playChime('click');
    setRatingOrderId(orderId);
  };

  const handleSaveRating = (orderId: string) => {
    soundManager.playChime('delivered');
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
    
    onSubmitRating(orderId, foodRating, driverRating, feedback);
    setRatingOrderId(null);
    setSubmittedMessage('Thank you for rating! You earned +50 FastBite Reward Points 🌟');
    setTimeout(() => setSubmittedMessage(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[620px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-lg">
              📜
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Order History & Ratings</h2>
              <p className="text-xs text-zinc-400">Past FastBite orders and driver reviews</p>
            </div>
          </div>

          <button
            id="btn-close-history"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {submittedMessage && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-2xl text-xs font-bold text-center animate-bounce">
              {submittedMessage}
            </div>
          )}

          {orderHistory.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs space-y-2">
              <div className="text-4xl">🧾</div>
              <p>No past order history found.</p>
            </div>
          ) : (
            orderHistory.map((histOrder, idx) => (
              <div
                key={`${histOrder.id || 'hist'}_${idx}`}
                className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-400">
                      Order #{histOrder.orderNumber}
                    </span>
                    <span className="text-zinc-500">• {histOrder.createdAt}</span>
                  </div>

                  {histOrder.status === 'cancelled' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      বাতিল (Cancelled)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Delivered
                    </span>
                  )}
                </div>

                {/* Items summary */}
                <div className="text-xs space-y-1 text-zinc-300">
                  <p className="font-semibold text-white">
                    {histOrder.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                  </p>
                  <p className="text-zinc-500 font-mono">
                    Total: ${histOrder.totalAmount.toFixed(2)} • Courier: {histOrder.driver.name}
                  </p>
                </div>

                {/* Rating status or Rating Trigger or Cancelled Notice */}
                {histOrder.status === 'cancelled' ? (
                  <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-xl text-xs flex items-center justify-between text-red-300">
                    <span className="text-[11px]">এই অর্ডারটি ক্যানসেল করা হয়েছিল (১০০% রিফান্ডড)</span>
                    <button
                      onClick={() => {
                        soundManager.playChime('click');
                        if (onViewCancelledOrder) onViewCancelledOrder(histOrder);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all"
                    >
                      <FileText className="w-3 h-3" />
                      <span>মেসেজ দেখুন</span>
                    </button>
                  </div>
                ) : histOrder.ratingSubmitted ? (
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs flex items-center justify-between text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>Rated: Food ({histOrder.ratingSubmitted.foodRating}★) • Driver ({histOrder.ratingSubmitted.driverRating}★)</span>
                    </div>
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : ratingOrderId === histOrder.id ? (
                  /* Interactive Rating Form */
                  <div className="bg-zinc-900 border border-orange-500/40 p-3.5 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-orange-400">Rate Your Experience</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-400 block mb-1">Food Quality:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFoodRating(star)}
                              className="text-lg"
                            >
                              <Star className={`w-4 h-4 ${star <= foodRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-400 block mb-1">Courier Service ({histOrder.driver.name}):</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setDriverRating(star)}
                              className="text-lg"
                            >
                              <Star className={`w-4 h-4 ${star <= driverRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add review feedback (e.g. Burger was piping hot!)..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setRatingOrderId(null)}
                        className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveRating(histOrder.id)}
                        className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow"
                      >
                        Submit Review
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleOpenRating(histOrder.id)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                    >
                      <Star className="w-3.5 h-3.5" /> Rate Food & Driver
                    </button>

                    <button
                      onClick={() => {
                        soundManager.playChime('click');
                        onReorder(histOrder);
                        onClose();
                      }}
                      className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reorder Items
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
};
