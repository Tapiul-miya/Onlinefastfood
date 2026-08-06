import React from 'react';
import { Utensils, Clock, CheckCircle2, Flame, Package, AlertCircle, RefreshCw, Edit3, User } from 'lucide-react';
import { Order, OrderStatus, UserProfile } from '../types';
import { soundManager } from '../utils/audio';

interface KitchenViewProps {
  order: Order | null;
  onUpdateStatus: (nextStatus: OrderStatus, logMessage: string, detail?: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  order,
  onUpdateStatus,
  currentUser,
  onOpenAuth,
}) => {
  const chefName = currentUser?.name || 'শেফ তৌফিক আহমেদ (Chef Toufiq Ahmed)';
  const chefPhone = currentUser?.phone || '+91 98300-11223';
  const stationId = currentUser?.employeeId || 'KITCHEN-KOL-01';
  const restaurantName = currentUser?.restaurantId || 'ফাস্টবাইট এক্সপ্রেস কলকাতা (Park Street HQ)';
  const chefPhoto = currentUser?.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=300';
  if (!order) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-white space-y-4 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-3xl">
          🍳
        </div>
        <h2 className="text-xl font-bold">Kitchen Display Screen (KDS) Idle</h2>
        <p className="text-xs text-zinc-400">
          No pending orders in kitchen ticket queue. Switch to Customer view to place an order!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Kitchen Top Header */}
      <div className="bg-gradient-to-r from-rose-600 via-orange-600 to-zinc-900 rounded-3xl p-6 text-white border border-rose-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={chefPhoto}
            alt={chefName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg ring-2 ring-rose-400/30"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-black/40 text-rose-200 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border border-rose-500/30">
                🍳 কিচেন প্রফাইল • {stationId}
              </span>
              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                ● টিকিট কিউ অ্যাক্টিভ
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">{chefName}</h1>
            <p className="text-xs text-rose-100 flex items-center gap-2 mt-0.5">
              <span>{restaurantName}</span>
              <span>•</span>
              <span>ফোন: {chefPhone}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playChime('click');
              if (onOpenAuth) onOpenAuth();
            }}
            className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-rose-400/40 text-rose-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Edit3 className="w-4 h-4 text-rose-400" />
            <span>কিচেন প্রোফাইল এডিট</span>
          </button>

          <div className="bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs space-y-1">
            <div className="text-rose-200 font-semibold">লাইভ টিকিট</div>
            <div className="text-white font-mono text-sm font-extrabold">
              অর্ডার #{order.orderNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Main Order Ticket Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-white space-y-6 shadow-2xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-lg font-mono font-extrabold text-sm">
                Ticket #{order.orderNumber}
              </span>
              <span className="text-xs text-zinc-400">Target Time: {order.estimatedDeliveryMinutes}m</span>
            </div>
            <h2 className="text-lg font-bold mt-1 text-white">Customer: {order.customerName}</h2>
          </div>

          {/* Quick Stage Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            <button
              id="btn-kds-confirm"
              onClick={() => {
                soundManager.playChime('kitchen_ready');
                onUpdateStatus('confirmed', 'Kitchen confirmed ticket', 'Order ticket assigned to Chef Marko');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                order.status === 'confirmed'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              1. Accept Ticket {order.status === 'confirmed' && '✓'}
            </button>

            <button
              id="btn-kds-start-cook"
              onClick={() => {
                soundManager.playChime('click');
                onUpdateStatus('preparing', 'Chef Marko started grilling Angus patties & loaded fries', 'Est 8 min cook time');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                order.status === 'preparing'
                  ? 'bg-orange-500 border-orange-300 text-black font-extrabold shadow-lg ring-2 ring-orange-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              2. Start Cooking 🔥 {order.status === 'preparing' && '✓'}
            </button>

            <button
              id="btn-kds-ready-pickup"
              onClick={() => {
                soundManager.playChime('kitchen_ready');
                onUpdateStatus('ready_for_pickup', 'Food ready! Sealed in insulated thermal box at pickup counter', 'Awaiting courier Alex');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                order.status === 'ready_for_pickup'
                  ? 'bg-emerald-500 border-emerald-300 text-black font-extrabold shadow-lg ring-2 ring-emerald-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              3. Ready for Courier 📦 {order.status === 'ready_for_pickup' && '✓'}
            </button>

          </div>
        </div>

        {/* Itemized Order Breakdown */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <Utensils className="w-4 h-4" /> Item Preparation Specs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.items.map((cartItem, idx) => (
              <div
                key={cartItem.cartItemId}
                className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-2xl space-y-2 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 font-extrabold text-xs flex items-center justify-center font-mono">
                      {cartItem.quantity}x
                    </span>
                    <h4 className="font-bold text-sm text-white">{cartItem.menuItem.name}</h4>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">${cartItem.itemTotalPrice.toFixed(2)}</span>
                </div>

                {/* Options list */}
                {cartItem.selectedOptions.length > 0 && (
                  <div className="bg-zinc-900/80 p-2.5 rounded-xl text-xs space-y-1 text-zinc-300 border border-zinc-800">
                    <div className="text-[10px] uppercase font-bold text-zinc-500">Customization:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                      {cartItem.selectedOptions.map((opt, i) => (
                        <li key={i}>
                          <span className="font-semibold text-orange-300">{opt.groupTitle}:</span> {opt.choiceName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cartItem.specialInstructions && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-xs text-rose-300 font-medium">
                    ⚠️ Note: "{cartItem.specialInstructions}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
