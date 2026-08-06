import React, { useState, useMemo } from 'react';
import { Search, Flame, Zap, Percent, ShieldCheck, Clock, Star, Plus } from 'lucide-react';
import { MenuItem, FoodCategory } from '../types';
import { Language, Currency, formatPrice, TRANSLATIONS } from '../utils/i18n';
import { soundManager } from '../utils/audio';

interface MenuSectionProps {
  onSelectItem: (item: MenuItem) => void;
  lang: Language;
  currency: Currency;
  menuItems: MenuItem[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  onSelectItem,
  lang,
  currency,
  menuItems,
}) => {
  const t = TRANSLATIONS[lang].menu;

  const CATEGORIES: { id: FoodCategory; label: string; icon: string }[] = [
    { id: 'all', label: t.all, icon: '⚡' },
    { id: 'biryani', label: t.biryani, icon: '🍲' },
    { id: 'burgers', label: t.burgers, icon: '🍔' },
    { id: 'chicken', label: t.chicken, icon: '🍗' },
    { id: 'pizza', label: t.pizza, icon: '🍕' },
    { id: 'sides', label: t.sides, icon: '🍟' },
    { id: 'drinks', label: t.drinks, icon: '🥤' },
    { id: 'desserts', label: t.desserts, icon: '🍩' },
  ];

  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'popular' | 'fast' | 'spicy'>('all');

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search match
      if (
        searchQuery &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Filter tag match
      if (activeFilter === 'popular' && !item.isPopular) return false;
      if (activeFilter === 'fast' && item.prepTimeMinutes > 10) return false;
      if (activeFilter === 'spicy' && !item.isSpicy) return false;

      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, activeFilter]);

  return (
    <section className="space-y-4 sm:space-y-6 pb-28">
      
      {/* Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-zinc-900 text-white p-4 sm:p-8 border border-orange-500/30 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
          <div className="w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-white/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-semibold text-amber-300">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <span className="truncate">লাইভ জিপিএস ট্র্যাকিং • এক্সপ্রেস ডেলিভারি</span>
          </div>

          <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {t.title} <br className="hidden sm:inline" />
            <span className="text-amber-200">কাচ্চি বিরিয়ানি, বার্গার, পিজ্জা ও রোল</span>
          </h1>

          <p className="text-[11px] sm:text-sm text-amber-100/80 leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-none">
            {t.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[10px] sm:text-xs font-medium text-amber-100">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" /> ২০ মিনিট ডেলিভারি
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> থার্মাল বক্সে গরম খাবার
            </span>
            <span className="flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-orange-300 shrink-0" /> কুপন <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[10px]">FAST20</code> (20% ছাড়)
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills & Search Row */}
      <div className="space-y-3 sm:space-y-4">
        
        {/* Search Input & Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl pl-9 pr-8 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Tags */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium no-scrollbar scrollbar-none">
            <button
              onClick={() => { soundManager.playChime('click'); setActiveFilter('all'); }}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl whitespace-nowrap transition-colors text-[11px] sm:text-xs ${
                activeFilter === 'all'
                  ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              {t.all}
            </button>
            <button
              onClick={() => { soundManager.playChime('click'); setActiveFilter('popular'); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl whitespace-nowrap transition-colors text-[11px] sm:text-xs ${
                activeFilter === 'popular'
                  ? 'bg-orange-500/20 text-orange-400 font-bold border border-orange-500/40'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-400 text-orange-400" />
              {t.popular}
            </button>
            <button
              onClick={() => { soundManager.playChime('click'); setActiveFilter('fast'); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl whitespace-nowrap transition-colors text-[11px] sm:text-xs ${
                activeFilter === 'fast'
                  ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              &lt;১০ মি.
            </button>
            <button
              onClick={() => { soundManager.playChime('click'); setActiveFilter('spicy'); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl whitespace-nowrap transition-colors text-[11px] sm:text-xs ${
                activeFilter === 'spicy'
                  ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              🌶️ {t.spicy}
            </button>
          </div>

        </div>

        {/* Category Selector Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/80 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundManager.playChime('click');
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-102'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Food Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-2">
          <div className="text-3xl">🍲</div>
          <h3 className="text-base font-bold text-white">কোন খাবার পাওয়া যায়নি</h3>
          <p className="text-xs text-zinc-400">অন্য কোনো নাম লিখে খুঁজুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 rounded-2xl overflow-hidden shadow-lg transition-all hover:-translate-y-0.5 flex flex-col justify-between"
            >
              {/* Card Image */}
              <div 
                className="relative h-32 sm:h-48 bg-zinc-950 overflow-hidden cursor-pointer"
                onClick={() => onSelectItem(item)}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/30" />

                {/* Badges on image */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {item.isPopular && (
                    <span className="bg-orange-500 text-black font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-md uppercase">
                      <Flame className="w-2.5 h-2.5 fill-black" /> {t.popular}
                    </span>
                  )}
                  {item.isSpicy && (
                    <span className="bg-rose-600 text-white font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded shadow-md uppercase">
                      🌶️
                    </span>
                  )}
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-2 right-2 bg-zinc-900/90 backdrop-blur-md px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold text-amber-400 border border-zinc-700/80 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{item.rating}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <h3 
                    onClick={() => onSelectItem(item)}
                    className="font-bold text-white text-xs sm:text-base hover:text-orange-400 cursor-pointer line-clamp-1 transition-colors"
                  >
                    {item.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-400 line-clamp-2 leading-tight sm:leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-500 font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-orange-400" /> {item.prepTimeMinutes} মি.
                  </span>
                  <span className="hidden xs:inline">{item.calories} {t.kcal}</span>
                </div>

                {/* Footer Price & Add Controls */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                  <div>
                    <span className="text-sm sm:text-lg font-extrabold text-white font-mono">
                      {formatPrice(item.price, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { soundManager.playChime('click'); onSelectItem(item); }}
                      className="hidden sm:block px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors border border-zinc-700/60"
                    >
                      কাস্টমাইজ
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </section>
  );
};
