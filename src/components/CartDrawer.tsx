import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, Bike, Clock, ArrowRight, ShieldCheck, MapPin, Navigation, RefreshCw, Check } from 'lucide-react';
import { CartItem } from '../types';
import { Language, Currency, formatPrice, TRANSLATIONS } from '../utils/i18n';
import { REGIONAL_PRESET_LOCATIONS } from '../data/mockData';
import { soundManager } from '../utils/audio';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onCheckout: (subtotal: number, deliveryFee: number, tip: number, discount: number, selectedAddress: string) => void;
  lang: Language;
  currency: Currency;
  selectedAddress: string;
  onSelectAddress: (addr: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  lang,
  currency,
  selectedAddress,
  onSelectAddress,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang].cart;

  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string>('');
  const [tip, setTip] = useState<number>(0.50); // ~$0.50 tip (~৳60 BDT / ₹40 INR)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');

  // GPS Location Status
  const [isLocating, setIsLocating] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState('');
  const [isCustomAddressEdit, setIsCustomAddressEdit] = useState(false);

  const handleDetectGpsInCart = async () => {
    setIsLocating(true);
    setGpsSuccessMsg('');
    soundManager.playChime('click');

    const applyCartGpsAddress = (newGpsAddress: string, isRealGps: boolean) => {
      setIsLocating(false);
      onSelectAddress(newGpsAddress);
      if (isRealGps) {
        setGpsSuccessMsg('লাইভ জিপিএস লোকেশন নেওয়া হয়েছে! রাইডার এই ঠিকানায় আসবেন।');
        soundManager.playChime('order_placed');
      } else {
        setGpsSuccessMsg('জিপিএস সিগন্যাল পাওয়া যায়নি। আপনি ম্যানুয়ালি নিজের ঠিকানা লিখে দিতে পারেন।');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let realAddress = '';

          // 1. BigDataCloud reverse geocoding
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=bn`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              const place = data.locality || data.city || data.localityInfo?.informative?.[0]?.name;
              const region = data.principalSubdivision || data.countryName;
              if (place) {
                realAddress = `${place}, ${region}`;
              }
            }
          } catch (e) {
            console.warn('BigDataCloud geocode failed:', e);
          }

          // 2. Nominatim fallback
          if (!realAddress) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
                { signal: controller.signal }
              );
              clearTimeout(timeoutId);
              if (res.ok) {
                const data = await res.json();
                if (data && data.display_name) {
                  const parts = data.display_name.split(',');
                  realAddress = parts.slice(0, 3).join(',').trim();
                }
              }
            } catch (e) {
              console.warn('Nominatim geocode failed:', e);
            }
          }

          const finalLocString = realAddress
            ? `${realAddress} (GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`
            : `লাইভ লোকেশন (GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;

          applyCartGpsAddress(finalLocString, true);
        },
        (error) => {
          console.warn('Cart Geolocation permission/error:', error);
          setIsLocating(false);
          setGpsSuccessMsg('ব্রাউজারে জিপিএস পারমিশন অফ করা আছে। অনুগ্রহ করে নিচে আপনার নিজস্ব বাসার সঠিক ঠিকানাটি টাইপ করুন।');
          soundManager.playChime('click');
        },
        { timeout: 5000, enableHighAccuracy: true, maximumAge: 10000 }
      );
    } else {
      setIsLocating(false);
      setGpsSuccessMsg('জিপিএস সিগন্যাল পাওয়া যায়নি। নিচে বক্সে আপনার সঠিক ঠিকানাটি ম্যানুয়ালি টাইপ করুন।');
    }
  };

  // Subtotal calculation
  const subtotal = cartItems.reduce((acc, item) => acc + item.itemTotalPrice, 0);
  const baseDeliveryFee = subtotal > 0 ? 0.50 : 0; // ~$0.50 delivery fee
  const effectiveDeliveryFee = appliedDiscount === 99 ? 0 : baseDeliveryFee;
  const discountAmount = appliedDiscount > 0 && appliedDiscount !== 99 ? (subtotal * appliedDiscount) / 100 : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + effectiveDeliveryFee + tip);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playChime('click');
    const code = promoCode.trim().toUpperCase();

    if (code === 'FAST20') {
      setAppliedDiscount(20);
      setPromoMessage('20% ছাড় কোড সফলভাবে যোগ হয়েছে!');
    } else if (code === 'FREEDEL') {
      setAppliedDiscount(99);
      setPromoMessage('ফ্রি ডেলিভারি ছাড় প্রয়োগ করা হয়েছে!');
    } else {
      setPromoMessage('ভুল কোড! FAST20 বা FREEDEL চেষ্টা করুন');
    }
  };

  const handlePlaceOrder = () => {
    soundManager.playChime('order_placed');
    onCheckout(subtotal, effectiveDeliveryFee, tip, discountAmount, selectedAddress);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 text-white flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                🛒
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">{t.title}</h2>
                <p className="text-xs text-zinc-400">
                  {cartItems.length} টি আইটেম যোগ করা হয়েছে
                </p>
              </div>
            </div>

            <button
              id="btn-close-cart"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Delivery Location Selector */}
            <div className="bg-zinc-950 border border-orange-500/30 p-3.5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ডেলিভারি পার্টনারের গন্তব্য ঠিকানা</span>
                </span>
                <button
                  type="button"
                  onClick={handleDetectGpsInCart}
                  disabled={isLocating}
                  className="text-[10px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/30 transition-all active:scale-95"
                >
                  {isLocating ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-orange-400" />
                  ) : (
                    <Navigation className="w-3 h-3 text-orange-400" />
                  )}
                  <span>GPS লোকেশন নিন</span>
                </button>
              </div>

              {/* Address Input or Display */}
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={selectedAddress}
                  onChange={(e) => onSelectAddress(e.target.value)}
                  placeholder="আপনার সঠিক বাড়ি/ফ্ল্যাট নম্বর ও ডেলিভারি ঠিকানা লিখুন..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-semibold focus:border-orange-500 outline-none resize-none"
                />

                {/* 1-Click Preset Pills */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 block">⚡ ১-ক্লিকে টেস্ট / জনপ্রিয় লোকেশন সিলেক্ট করুন:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {REGIONAL_PRESET_LOCATIONS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          onSelectAddress(preset.address);
                          setGpsSuccessMsg(`লোকেশন সেট করা হয়েছে: ${preset.name}`);
                          soundManager.playChime('click');
                        }}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer active:scale-95 ${
                          selectedAddress === preset.address
                            ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-orange-500/40'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {gpsSuccessMsg && (
                <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{gpsSuccessMsg}</span>
                </div>
              )}

              <div className="text-[10px] text-zinc-400 flex items-center gap-1 border-t border-zinc-800/80 pt-1.5">
                <span className="text-emerald-400 font-bold">✓ রাইডার সুবিধা:</span>
                <span>অর্ডার করার পর রাইডার এই ঠিকানায় লাইভ জিপিএস পাবে।</span>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
                  🍲
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{t.emptyTitle}</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                    {t.emptyDesc}
                  </p>
                </div>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-14 h-14 rounded-lg object-cover bg-zinc-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">
                        {item.menuItem.name}
                      </h4>
                      
                      {item.selectedOptions.length > 0 && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                          {item.selectedOptions.map((o) => o.choiceName).join(', ')}
                        </p>
                      )}

                      {item.specialInstructions && (
                        <p className="text-[10px] text-amber-400 italic mt-0.5">
                          নোট: "{item.specialInstructions}"
                        </p>
                      )}

                      <div className="text-xs font-bold text-orange-400 mt-1">
                        {formatPrice(item.itemTotalPrice, currency)}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.cartItemId)}
                      className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                    <span className="text-zinc-500 font-medium">পরিমাণ</span>
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg">
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="p-1 px-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="p-1 px-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Promo Code Section */}
            {cartItems.length > 0 && (
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-xl space-y-2">
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="কুপন কোড (FAST20 / FREEDEL)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg text-zinc-200 transition-colors"
                  >
                    আবেদন
                  </button>
                </form>
                {promoMessage && (
                  <p className={`text-[11px] font-medium ${appliedDiscount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {promoMessage}
                  </p>
                )}
              </div>
            )}

            {/* Payment Method Selector */}
            {cartItems.length > 0 && (
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-zinc-300 block">{t.paymentMethod}</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-2 rounded-lg font-bold border transition-colors text-center ${
                      paymentMethod === 'cod'
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    💵 {t.cod}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`p-2 rounded-lg font-bold border transition-colors text-center ${
                      paymentMethod === 'online'
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    📲 {t.onlinePay}
                  </button>
                </div>
              </div>
            )}

            {/* Courier Tip Selector */}
            {cartItems.length > 0 && (
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5 text-orange-400" />
                    {t.tipCourier}
                  </span>
                  <span className="font-mono text-orange-400 font-bold">
                    {formatPrice(tip, currency)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.30, 0.50, 1.00, 2.00].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTip(amount)}
                      className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-colors border ${
                        tip === amount
                          ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {formatPrice(amount, currency)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout Button */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
              <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <span className="font-mono text-white">{formatPrice(subtotal, currency)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t.discount}</span>
                    <span className="font-mono">-{formatPrice(discountAmount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{t.deliveryFee}</span>
                  <span className="font-mono text-white">
                    {effectiveDeliveryFee === 0 ? (
                      <span className="text-emerald-400 font-bold">ফ্রি (FREE)</span>
                    ) : (
                      formatPrice(effectiveDeliveryFee, currency)
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>{t.tipCourier}</span>
                  <span className="font-mono text-white">{formatPrice(tip, currency)}</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-zinc-800">
                  <span>{t.totalAmount}</span>
                  <span className="text-orange-400 font-mono text-base">
                    {formatPrice(grandTotal, currency)}
                  </span>
                </div>
              </div>

              {/* ETA Indicator */}
              <div className="bg-zinc-900 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>আনুমানিক সময়:</span>
                </div>
                <span className="font-bold text-white bg-orange-500/20 px-2 py-0.5 rounded text-orange-300">
                  ১৮ - ২৫ মিনিট
                </span>
              </div>

              {/* Checkout Button */}
              <button
                id="btn-place-order"
                onClick={handlePlaceOrder}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-base"
              >
                <span>{t.placeOrder}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-[10px] text-center text-zinc-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> ১০০% সুরক্ষিত অর্ডার • সাথে সাথে রাইড জিপিএস মানচিত্র সক্রিয়
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
