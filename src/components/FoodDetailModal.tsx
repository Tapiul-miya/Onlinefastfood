import React, { useState } from 'react';
import { X, Plus, Minus, Check, Flame, Clock, Star, MessageSquare } from 'lucide-react';
import { MenuItem, SelectedOption } from '../types';
import { Language, Currency, formatPrice, TRANSLATIONS } from '../utils/i18n';
import { soundManager } from '../utils/audio';

interface FoodDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedOptions: SelectedOption[],
    specialInstructions: string
  ) => void;
  lang: Language;
  currency: Currency;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  item,
  onClose,
  onAddToCart,
  lang,
  currency,
}) => {
  if (!item) return null;

  const t = TRANSLATIONS[lang].menu;

  const [quantity, setQuantity] = useState<number>(1);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  
  // Track selected choices for options
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    item.optionGroups?.forEach((group) => {
      if (group.required && group.choices.length > 0) {
        initial[group.id] = [group.choices[0].id];
      } else {
        initial[group.id] = [];
      }
    });
    return initial;
  });

  const handleChoiceToggle = (groupId: string, choiceId: string, isSingle: boolean) => {
    soundManager.playChime('click');
    setSelectedChoices((prev) => {
      const current = prev[groupId] || [];
      if (isSingle) {
        return { ...prev, [groupId]: [choiceId] };
      } else {
        if (current.includes(choiceId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== choiceId) };
        } else {
          return { ...prev, [groupId]: [...current, choiceId] };
        }
      }
    });
  };

  // Calculate total price with options
  const calculateTotalPrice = (): { unitPrice: number; totalPrice: number; selectedList: SelectedOption[] } => {
    let extra = 0;
    const selectedList: SelectedOption[] = [];

    item.optionGroups?.forEach((group) => {
      const choiceIds = selectedChoices[group.id] || [];
      group.choices.forEach((choice) => {
        if (choiceIds.includes(choice.id)) {
          extra += choice.price;
          selectedList.push({
            groupId: group.id,
            groupTitle: group.title,
            choiceId: choice.id,
            choiceName: choice.name,
            price: choice.price,
          });
        }
      });
    });

    const unitPrice = item.price + extra;
    return {
      unitPrice,
      totalPrice: unitPrice * quantity,
      selectedList,
    };
  };

  const { totalPrice, selectedList } = calculateTotalPrice();

  const handleConfirm = () => {
    soundManager.playChime('click');
    onAddToCart(item, quantity, selectedList, specialInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image area */}
        <div className="relative h-60 sm:h-72 w-full bg-zinc-950 shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

          {/* Close button */}
          <button
            id="btn-close-food-modal"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-colors border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
            {item.isPopular && (
              <span className="bg-orange-500 text-black font-extrabold text-xs px-2.5 py-1 rounded-md flex items-center gap-1 shadow-md">
                <Flame className="w-3.5 h-3.5 fill-black" /> {t.popular}
              </span>
            )}
            {item.isSpicy && (
              <span className="bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1">
                🌶️ {t.spicy}
              </span>
            )}
            <span className="bg-zinc-900/80 backdrop-blur-md text-zinc-300 text-xs px-2.5 py-1 rounded-md border border-zinc-700 flex items-center gap-1">
              <Clock className="w-3 h-3 text-orange-400" /> {item.prepTimeMinutes} {t.mins} {t.prepTime}
            </span>
            <span className="bg-zinc-900/80 backdrop-blur-md text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-zinc-700 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" /> {item.rating} ({item.reviewsCount})
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-white">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">{item.name}</h2>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-orange-400">
                  {formatPrice(item.price, currency)}
                </span>
                <p className="text-xs text-zinc-500 font-mono">{item.calories} kcal</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{item.description}</p>
          </div>

          {/* Option Groups */}
          {item.optionGroups && item.optionGroups.length > 0 && (
            <div className="space-y-6 border-t border-zinc-800 pt-5">
              {item.optionGroups.map((group) => {
                const selectedForGroup = selectedChoices[group.id] || [];
                const isSingle = group.type === 'single';

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                        <span>{group.title}</span>
                        {group.required && (
                          <span className="text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                            প্রয়োজনীয়
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-zinc-500">
                        {isSingle ? '১টি নির্বাচন করুন' : 'একাধিক নির্বাচন করা যাবে'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.choices.map((choice) => {
                        const isSelected = selectedForGroup.includes(choice.id);

                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => handleChoiceToggle(group.id, choice.id, isSingle)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-orange-500/10 border-orange-500 text-orange-300 ring-1 ring-orange-500/30'
                                : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/70'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-${isSingle ? 'full' : 'md'} border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-orange-500 border-orange-500 text-black'
                                    : 'border-zinc-600 bg-zinc-900'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="text-sm font-medium">{choice.name}</span>
                            </div>
                            <span className="text-xs font-mono text-zinc-400">
                              {choice.price > 0 ? `+${formatPrice(choice.price, currency)}` : 'ফ্রি'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Instructions Note */}
          <div className="space-y-2 border-t border-zinc-800 pt-5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
              বিশেষ নির্দেশনা (কিচেনের জন্য)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="যেমন: ঝাল কম দিন, বোরহানি সাথে ঠান্ডা দিন..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center gap-4 shrink-0">
          
          {/* Quantity selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                if (quantity > 1) {
                  soundManager.playChime('click');
                  setQuantity((q) => q - 1);
                }
              }}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-white">{quantity}</span>
            <button
              type="button"
              onClick={() => {
                soundManager.playChime('click');
                setQuantity((q) => q + 1);
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Submit Button */}
          <button
            id="btn-confirm-add-cart"
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-between transition-all active:scale-[0.99]"
          >
            <span>কার্টে যোগ করুন</span>
            <span className="font-extrabold text-base">{formatPrice(totalPrice, currency)}</span>
          </button>

        </div>
      </div>
    </div>
  );
};
