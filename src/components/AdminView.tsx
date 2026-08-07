import React, { useState } from 'react';
import { 
  ShieldAlert, DollarSign, ShoppingBag, Users, Utensils, Plus, Edit2, Trash2, 
  CheckCircle2, XCircle, RefreshCw, Flame, Globe, MapPin, Search, Tag, Eye,
  Edit3, ShieldCheck, User, AlertTriangle, Smartphone
} from 'lucide-react';
import { MenuItem, Order, Driver, OrderStatus, FoodCategory, UserProfile } from '../types';
import { Language, Currency, formatPrice, TRANSLATIONS } from '../utils/i18n';
import { soundManager } from '../utils/audio';

interface AdminViewProps {
  lang: Language;
  currency: Currency;
  onSelectCurrency: (c: Currency) => void;
  onSelectLang: (l: Language) => void;
  menuItems: MenuItem[];
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  orders: Order[];
  activeOrder: Order | null;
  onForceOrderStatus: (orderId: string, status: OrderStatus, message: string) => void;
  drivers: Driver[];
  onAssignDriver: (orderId: string, driver: Driver) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onMasterReset?: () => void;
  onOpenApkModal?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  lang,
  currency,
  onSelectCurrency,
  onSelectLang,
  menuItems,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  orders,
  activeOrder,
  onForceOrderStatus,
  drivers,
  onAssignDriver,
  currentUser,
  onOpenAuth,
  onMasterReset,
  onOpenApkModal,
}) => {
  const t = TRANSLATIONS[lang].adminApp;

  const adminName = currentUser?.name || 'সুপার এডমিন রানা ব্যানার্জী (Super Admin Rana)';
  const adminEmail = currentUser?.email || 'admin.fastbite@foodexpress.in';
  const adminPhone = currentUser?.phone || '+91 98300-00100';
  const empId = currentUser?.employeeId || 'ADMIN-SYS-2026';
  const adminPhoto = currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300';

  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'drivers' | 'settings'>('menu');
  const [menuSearch, setMenuSearch] = useState<string>('');
  
  // Modal for adding / editing menu item
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Master System Reset Confirmation Modal State
  const [isResetWarningModalOpen, setIsResetWarningModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Stock availability map (local state)
  const [outOfStockIds, setOutOfStockIds] = useState<Record<string, boolean>>({});

  const toggleStock = (id: string) => {
    soundManager.playChime('click');
    setOutOfStockIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0) + (activeOrder ? activeOrder.totalAmount : 0);
  const totalOrdersCount = orders.length + (activeOrder ? 1 : 0);

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name || !editingItem?.price) return;

    soundManager.playChime('click');

    const newItem: MenuItem = {
      id: editingItem.id || `f_${Date.now()}`,
      name: editingItem.name,
      description: editingItem.description || '',
      price: Number(editingItem.price),
      category: (editingItem.category as FoodCategory) || 'burgers',
      image: editingItem.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
      calories: Number(editingItem.calories) || 600,
      prepTimeMinutes: Number(editingItem.prepTimeMinutes) || 10,
      rating: editingItem.rating || 4.8,
      reviewsCount: editingItem.reviewsCount || 100,
      isPopular: !!editingItem.isPopular,
      isSpicy: !!editingItem.isSpicy,
      isVeg: !!editingItem.isVeg,
    };

    if (editingItem.id) {
      onUpdateMenuItem(newItem);
    } else {
      onAddMenuItem(newItem);
    }

    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-purple-950 to-zinc-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src={adminPhoto}
            alt={adminName}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white shadow-lg ring-2 ring-purple-400/30 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="bg-purple-500/20 text-purple-300 text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-lg border border-purple-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" /> {empId}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                ● ফুল অ্যাক্সেস
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight mt-1 truncate">{adminName}</h1>
            <p className="text-[11px] sm:text-xs text-zinc-300 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span>ইমেইল: {adminEmail}</span>
              <span className="hidden sm:inline">•</span>
              <span>ফোন: {adminPhone}</span>
            </p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={() => {
            soundManager.playChime('click');
            if (onOpenAuth) onOpenAuth();
          }}
          className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Edit3 className="w-3.5 h-3.5 text-purple-400" />
          <span>প্রোফাইল এডিট</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-zinc-400 truncate">{t.totalRevenue}</div>
            <div className="text-sm sm:text-xl font-extrabold text-white mt-0.5 truncate font-mono">
              {formatPrice(totalRevenue || 42.50, currency)}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-zinc-400 truncate">{t.activeDeliveries}</div>
            <div className="text-sm sm:text-xl font-extrabold text-white mt-0.5 truncate">
              {activeOrder ? '1 Live' : '0 Pending'}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-zinc-400 truncate">{t.totalPartners}</div>
            <div className="text-sm sm:text-xl font-extrabold text-white mt-0.5 truncate">
              {drivers.length} Riders
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Utensils className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-zinc-400 truncate">{t.totalMenuItems}</div>
            <div className="text-sm sm:text-xl font-extrabold text-white mt-0.5 truncate">
              {menuItems.length} Foods
            </div>
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex border-b border-zinc-800 overflow-x-auto gap-1 sm:gap-2 no-scrollbar scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'menu'
              ? 'border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-xl'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{t.tabMenu}</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'orders'
              ? 'border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-xl'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{t.tabOrders}</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'drivers'
              ? 'border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-xl'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{t.tabPartners}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'settings'
              ? 'border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-xl'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{t.tabSettings}</span>
        </button>
      </div>

      {/* Tab 1: Menu Items & Price Manager */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900 p-3.5 sm:p-4 rounded-2xl border border-zinc-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="খাবার খুঁজুন (Search food)..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              onClick={() => {
                setEditingItem({
                  name: '',
                  description: '',
                  price: 2.50,
                  category: 'burgers',
                  calories: 500,
                  prepTimeMinutes: 10,
                  image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
                });
                setIsAddModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewItem}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredMenuItems.map((item) => {
              const isOut = !!outOfStockIds[item.id];
              return (
                <div
                  key={item.id}
                  className={`bg-zinc-900 border rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3 transition-all ${
                    isOut ? 'border-red-900/50 opacity-60' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-zinc-800"
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono text-orange-400 font-extrabold uppercase truncate">
                          {item.category}
                        </span>
                        <button
                          onClick={() => toggleStock(item.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            isOut
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOut ? t.outOfStock : t.inStock}
                        </button>
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-white truncate">{item.name}</h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                    <div className="font-extrabold text-orange-400 text-sm sm:text-base font-mono">
                      {formatPrice(item.price, currency)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsAddModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        title={t.editItem}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete ${item.name}?`)) {
                            onDeleteMenuItem(item.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-400 transition-colors"
                        title={t.deleteItem}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Live Orders Control */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {!activeOrder && orders.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-400 space-y-2">
              <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold">No orders in system currently</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrder && (
                <div className="bg-zinc-900 border border-orange-500/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <span className="bg-orange-500/20 text-orange-400 text-xs font-mono font-bold px-2 py-0.5 rounded border border-orange-500/30">
                        LIVE ACTIVE ORDER #{activeOrder.orderNumber}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">
                        Customer: {activeOrder.customerName} ({activeOrder.customerPhone})
                      </h3>
                      <p className="text-xs text-zinc-400">{activeOrder.deliveryAddress}</p>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-lg sm:text-xl font-extrabold text-orange-400 font-mono">
                        {formatPrice(activeOrder.totalAmount, currency)}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        Status: <span className="text-amber-400 font-bold uppercase">{activeOrder.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Force Status Controls */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase">
                      Admin Force Status Control:
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {(['confirmed', 'preparing', 'ready_for_pickup', 'on_the_way', 'delivered', 'cancelled'] as OrderStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => onForceOrderStatus(activeOrder.id, st, `Admin force updated status to ${st}`)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                            activeOrder.status === st
                              ? 'bg-orange-600 text-white shadow-md'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {st.replace('_', ' ').toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Driver Assign Control */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <span className="text-xs font-bold text-zinc-400 uppercase">
                      Assigned Courier: <span className="text-white">{activeOrder.driver.name}</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {drivers.map((drv) => (
                        <button
                          key={drv.id}
                          onClick={() => onAssignDriver(activeOrder.id, drv)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                            activeOrder.driver.id === drv.id
                              ? 'bg-amber-600 text-white border-amber-500'
                              : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                          }`}
                        >
                          <img src={drv.photo} className="w-4 h-4 rounded-full object-cover" />
                          <span>{drv.name} ({drv.vehiclePlate})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Delivery Partners */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {drivers.map((drv) => (
            <div key={drv.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-3">
                <img src={drv.photo} alt={drv.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-zinc-700" />
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">{drv.name}</h3>
                  <p className="text-xs text-zinc-400 font-mono">{drv.vehiclePlate}</p>
                  <div className="text-[11px] text-amber-400 font-bold mt-0.5">
                    ★ {drv.rating} • {drv.tripsCompleted} Trips Done
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Vehicle:</span>
                  <span className="text-white font-bold uppercase">{drv.vehicleType}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Phone:</span>
                  <span className="text-white font-mono">{drv.phone}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Battery Level:</span>
                  <span className="text-emerald-400 font-bold">{drv.batteryLevel || 90}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: System & Region Settings */}
      {activeTab === 'settings' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 text-white space-y-6 max-w-2xl">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-orange-400" />
            Regional & Currency Configuration
          </h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold block">App Language (ভাষা):</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => onSelectLang('bn')}
                  className={`p-3 rounded-xl font-bold border transition-all text-center ${
                    lang === 'bn'
                      ? 'bg-orange-600 text-white border-orange-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  🇧🇩 🇮🇳 বাংলা (Bengali)
                </button>
                <button
                  onClick={() => onSelectLang('en')}
                  className={`p-3 rounded-xl font-bold border transition-all text-center ${
                    lang === 'en'
                      ? 'bg-orange-600 text-white border-orange-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  🌐 English
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold block">Default Currency (মুদ্রা):</label>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                <button
                  onClick={() => onSelectCurrency('INR')}
                  className="p-3 rounded-xl font-bold border transition-all text-center bg-amber-600 text-white border-amber-500"
                >
                  ₹ Indian Rupee (INR)
                </button>
              </div>
            </div>

            {/* Multi-App APK Build Section */}
            {onOpenApkModal && (
              <div className="pt-6 border-t border-zinc-800 space-y-3">
                <h3 className="text-orange-400 font-bold flex items-center gap-2 text-sm">
                  <Smartphone className="w-4 h-4 text-orange-400" />
                  Android APK Multi-App Build Generator
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  কাস্টমার, কিচেন কেডিএস, রাইডার পার্টনার এবং এডমিন - ৪টি আলাদা নাম, প্যাকেজ আইডি ও আলাদা আইকন সহ স্বতন্ত্র APK প্রস্তুত করুন।
                </p>
                <button
                  onClick={() => {
                    soundManager.playChime('click');
                    onOpenApkModal();
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>📱 4-in-1 APK Build Config & Capacitor Exporter Open</span>
                </button>
              </div>
            )}

            {/* Danger Zone / Master Reset */}
            <div className="pt-6 border-t border-zinc-800">
              <h3 className="text-red-400 font-bold flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4" />
                Advanced Settings (Danger Zone)
              </h3>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                If you are experiencing state issues or want to wipe all local data and Firestore orders, use the master reset button below.
              </p>
              <button
                onClick={() => {
                  soundManager.playChime('click');
                  setIsResetWarningModalOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg shadow-red-950/30"
              >
                <RefreshCw className="w-4 h-4 text-red-400" />
                <span>Master System Reset (Clear All Data)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {isAddModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 max-w-lg w-full text-white space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-extrabold flex items-center justify-between border-b border-zinc-800 pb-3">
              <span>{editingItem.id ? t.editItem : t.addNewItem}</span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </h2>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">{t.itemName}</label>
                <input
                  type="text"
                  required
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  placeholder="যেমন: পার্ক স্ট্রিট খাসির কাচ্চি বিরিয়ানি"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">{t.itemDesc}</label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white resize-none"
                  placeholder="বিবরণ লিখুন..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">{t.price}</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={editingItem.price || 2.50}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">{t.category}</label>
                  <select
                    value={editingItem.category || 'burgers'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as FoodCategory })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  >
                    <option value="biryani">বিরিয়ানি ও ভাত</option>
                    <option value="burgers">বার্গার</option>
                    <option value="pizza">পিজ্জা</option>
                    <option value="chicken">চিকেন ও রোল</option>
                    <option value="sides">স্ন্যাক্স ও ফ্রাইজ</option>
                    <option value="drinks">লসি ও ড্রিংকস</option>
                    <option value="desserts">মিষ্টি ও ডেসার্ট</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">{t.imageUrl}</label>
                <input
                  type="text"
                  value={editingItem.image || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingItem.isPopular}
                    onChange={(e) => setEditingItem({ ...editingItem, isPopular: e.target.checked })}
                  />
                  <span>{TRANSLATIONS[lang].menu.popular}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingItem.isSpicy}
                    onChange={(e) => setEditingItem({ ...editingItem, isSpicy: e.target.checked })}
                  />
                  <span>{TRANSLATIONS[lang].menu.spicy}</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master System Reset Warning & Confirmation Modal */}
      {isResetWarningModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-900 border-2 border-red-500/60 rounded-3xl p-5 sm:p-7 max-w-lg w-full text-white space-y-5 shadow-2xl shadow-red-950/60 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30">
                  <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">সিস্টেম রিসেট সতর্কতা (Master Reset)</h2>
                  <p className="text-xs text-red-400 font-semibold">বিপদজনক কাজ • Data Wipe Warning</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetWarningModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Warning Alert Banner */}
            <div className="bg-gradient-to-r from-red-950/90 to-red-900/40 border border-red-500/50 p-4 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>গুরুত্বপূর্ণ সতর্কতা (Critical Warning):</span>
              </div>
              <p className="text-xs text-red-200/90 leading-relaxed">
                মাস্টার সিস্টেম রিসেট বাটনে ক্লিক করলে সমস্ত স্থানীয় ও ক্লাউড ডেটা চিরতরে মুছে ফেলা হবে। এই পদক্ষেপটি অনুলঙ্ঘনীয় এবং পরবর্তীতে এটি আর ফিরিয়ে আনা সম্ভব নয়!
              </p>
            </div>

            {/* Detailed Consequences List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">রিসেট সম্পন্ন হলে যা যা ঘটে যাবে:</h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <span className="text-base shrink-0">🗑️</span>
                  <div>
                    <p className="font-bold text-zinc-200">১. লোকাল স্টোরেজ ও সেশন ক্লিয়ার (Clear Local Storage)</p>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      আপনার সমস্ত লগইন সেশন, প্রোফাইল ডাটা, কারেন্ট রোল এবং লোকাল পুশ নোটিফিকেশন সিস্টেম প্রারম্ভিক অবস্থায় রিসেট হবে।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <span className="text-base shrink-0">☁️</span>
                  <div>
                    <p className="font-bold text-zinc-200">২. ক্লাউড ফায়ারস্টোর ডাটাবেস রিসেট (Firestore Orders Clean)</p>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      ফায়ারস্টোর ক্লাউডে জমা থাকা সমস্ত সক্রিয় অর্ডার এবং অর্ডার হিস্ট্রি স্থায়ীভাবে মুছে ডিলিট হয়ে যাবে।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <span className="text-base shrink-0">🔄</span>
                  <div>
                    <p className="font-bold text-zinc-200">৩. কাস্টম স্টেট ও কনফিগারেশন রিসেট (Reset Defaults)</p>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      রেস্তোরাঁর খাদ্য তালিকা, রাইডার তালিকা এবং এডমিনের সমস্ত পরিবর্তনকৃত মান ডিফল্ট অবস্থায় ফিরে আসবে।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <span className="text-base shrink-0">⚡</span>
                  <div>
                    <p className="font-bold text-zinc-200">৪. অ্যাপ্লিকেশন অটোমেটিক রিলোড (App Reload)</p>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      ডেটা মোছার কাজ শেষ হওয়া মাত্রই পুরো অ্যাপটি ফ্রেশভাবে পুনরায় রিলোড হবে।
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetWarningModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all text-center"
              >
                বাতিল করুন (Cancel)
              </button>

              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  soundManager.playChime('click');
                  if (onMasterReset) {
                    await onMasterReset();
                  }
                  setIsResetting(false);
                  setIsResetWarningModalOpen(false);
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>রিসেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>হ্যাঁ, নিশ্চিতভাবে রিসেট করুন</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
