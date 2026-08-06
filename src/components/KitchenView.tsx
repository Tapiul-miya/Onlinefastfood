import React from 'react';
import { Utensils, Clock, CheckCircle2, Flame, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { soundManager } from '../utils/audio';

interface KitchenViewProps {
  order: Order | null;
  onUpdateStatus: (nextStatus: OrderStatus, logMessage: string, detail?: string) => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  order,
  onUpdateStatus,
}) => {
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
          <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center text-3xl">
            🍳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-black/40 text-rose-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                KDS Station #01 • Sizzle & Grill HQ
              </span>
              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                ● Ticket Queue Active
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">Kitchen Display System</h1>
            <p className="text-xs text-rose-100">
              Live Order Ticket #{order.orderNumber} • {order.items.length} items
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs space-y-1">
          <div className="text-rose-200 font-semibold">Kitchen Stage</div>
          <div className="text-white font-mono text-sm font-extrabold">
            Status: <span className="uppercase text-amber-300">{order.status.replace('_', ' ')}</span>
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
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors border border-zinc-700"
            >
              1. Accept Ticket
            </button>

            <button
              id="btn-kds-start-cook"
              onClick={() => {
                soundManager.playChime('click');
                onUpdateStatus('preparing', 'Chef Marko started grilling Angus patties & loaded fries', 'Est 8 min cook time');
              }}
              className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors shadow-md"
            >
              2. Start Cooking 🔥
            </button>

            <button
              id="btn-kds-ready-pickup"
              onClick={() => {
                soundManager.playChime('kitchen_ready');
                onUpdateStatus('ready_for_pickup', 'Food ready! Sealed in insulated thermal box at pickup counter', 'Awaiting courier Alex');
              }}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md"
            >
              3. Ready for Courier 📦
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
