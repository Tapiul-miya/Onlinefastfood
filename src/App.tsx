import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  MenuItem, SelectedOption, CartItem, Order, OrderStatus, 
  UserRole, ChatMessage, Driver, UserProfile, GeoPoint 
} from './types';
import { 
  MENU_ITEMS, INITIAL_RESTAURANT, INITIAL_CUSTOMER_LOCATION, 
  DEFAULT_DRIVER, INITIAL_DRIVERS_LIST, SAMPLE_ROUTE_COORDINATES, INITIAL_PRESET_LOGS,
  REGIONAL_PRESET_LOCATIONS
} from './data/mockData';
import { Language, Currency, formatPrice, TRANSLATIONS } from './utils/i18n';
import { soundManager } from './utils/audio';

import { Header } from './components/Header';
import { MenuSection } from './components/MenuSection';
import { FoodDetailModal } from './components/FoodDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { RealtimeTracker } from './components/RealtimeTracker';
import { DriverView } from './components/DriverView';
import { KitchenView } from './components/KitchenView';
import { AdminView } from './components/AdminView';
import { ChatModal } from './components/ChatModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { AuthModal } from './components/AuthModal';

import { Flame, History, Sparkles } from 'lucide-react';

export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('fastbite_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      id: 'usr_default',
      name: 'অর্ণব ব্যানার্জী (Arnab Banerjee)',
      phone: '+91 98301-88220',
      role: 'customer',
      email: 'arnab.kolkata@example.com',
      address: 'সল্টলেক সেক্টর ৫, ইলেকট্রনিক্স কমপ্লেক্স, কলকাতা (Salt Lake Sector V, Kolkata)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      isLoggedIn: true,
    };
  });
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Localization State (Default to INR currency for Kolkata)
  const [lang, setLang] = useState<Language>('bn');
  const [currency, setCurrency] = useState<Currency>('INR');

  const [role, setRole] = useState<UserRole>('customer');
  const [selectedAddress, setSelectedAddress] = useState<string>(
    currentUser?.address || INITIAL_CUSTOMER_LOCATION.address || 'সল্টলেক সেক্টর ৫, ইলেকট্রনিক্স কমপ্লেক্স, কলকাতা (Salt Lake Sector V, Kolkata)'
  );

  // Sync selectedAddress when currentUser updates address or logs in
  useEffect(() => {
    if (currentUser?.address) {
      setSelectedAddress(currentUser.address);
      
      // If there's an active order, update its delivery location in real-time
      setActiveOrder((prev) => {
        if (!prev) return null;
        const newCustomerLoc = parseLocationCoordinates(currentUser.address);
        const newRoute = generateDynamicRoute(INITIAL_RESTAURANT.location, newCustomerLoc, 7);
        return {
          ...prev,
          deliveryAddress: currentUser.address,
          customerLocation: newCustomerLoc,
          routeCoordinates: newRoute,
        };
      });
    }
  }, [currentUser?.address]);

  // Generate realistic route waypoints from Restaurant to Customer location
  const generateDynamicRoute = (start: GeoPoint, end: GeoPoint, steps = 7): GeoPoint[] => {
    const points: GeoPoint[] = [];
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      // Add a slight realistic curve for roads
      const curveFactor = Math.sin(ratio * Math.PI) * 0.003;
      const lat = start.lat + (end.lat - start.lat) * ratio + curveFactor;
      const lng = start.lng + (end.lng - start.lng) * ratio - curveFactor * 0.5;
      points.push({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        address: ratio === 1 ? end.address : ratio === 0 ? start.address : 'ইন ট্রানজিট (In Transit)',
      });
    }
    return points;
  };

  // Parse GPS coordinates from address string if present
  const parseLocationCoordinates = (addressStr: string): GeoPoint => {
    if (!addressStr) return INITIAL_CUSTOMER_LOCATION;

    // Check if matching preset location
    const preset = REGIONAL_PRESET_LOCATIONS.find(
      (p) => p.address === addressStr || p.name === addressStr
    );
    if (preset) {
      return {
        ...preset.geo,
        address: addressStr,
      };
    }

    // Check GPS pattern: e.g. "GPS: 22.5726° N, 88.4331° E" or "22.5726, 88.4331"
    const gpsMatch = addressStr.match(/GPS:\s*([\d.]+)[^\d]+([\d.]+)/i) || addressStr.match(/([\d.]+)[,\s]+([\d.]+)/);
    if (gpsMatch) {
      const lat = parseFloat(gpsMatch[1]);
      const lng = parseFloat(gpsMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          lat,
          lng,
          address: addressStr,
        };
      }
    }

    // Deterministic offset based on address text for custom text addresses
    let hash = 0;
    for (let i = 0; i < addressStr.length; i++) {
      hash = (hash << 5) - hash + addressStr.charCodeAt(i);
      hash |= 0;
    }
    const latOffset = ((Math.abs(hash) % 80) - 40) * 0.0001;
    const lngOffset = ((Math.abs(hash >> 2) % 80) - 40) * 0.0001;

    return {
      lat: Number((INITIAL_CUSTOMER_LOCATION.lat + latOffset).toFixed(6)),
      lng: Number((INITIAL_CUSTOMER_LOCATION.lng + lngOffset).toFixed(6)),
      address: addressStr,
    };
  };

  // Dynamic Food Menu list (Editable by Admin)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);

  // Delivery Drivers list (Editable by Admin)
  const [driversList, setDriversList] = useState<Driver[]>(INITIAL_DRIVERS_LIST);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active Live Order
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Real-time GPS Simulation State
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isSimPaused, setIsSimPaused] = useState<boolean>(false);
  const [routeProgressIdx, setRouteProgressIdx] = useState<number>(0);

  // Live Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'driver',
      text: "নমস্কার! আমি রূপম ব্যানার্জী, আপনার ফাস্টবাইট থার্মাল ব্যাগ নিয়ে আপনার স্পেশাল খাবারের ডেলিভারিতে প্রস্তুত আছি।",
      timestamp: '১২:৩২ PM',
    },
  ]);

  // Default state starts clean without any active order, so user places their own order!
  // If user wants to quickly test live tracking, they can also trigger a demo order.
  const handleLoadDemoOrder = () => {
    const demoItems: CartItem[] = [
      {
        cartItemId: 'demo_1',
        menuItem: MENU_ITEMS[0], // Kolkata Special Mutton Biryani
        quantity: 1,
        selectedOptions: [
          { groupId: 'portion', groupTitle: 'Portion Size', choiceId: 'p2', choiceName: 'ফুল প্লেট (১ পিস আলু + ২ পিস খাসির মাংস + ১ ডিম)', price: 1.50 },
          { groupId: 'extras', groupTitle: 'Side', choiceId: 'e1', choiceName: 'ঠান্ডা মালাই লসি / রায়তা (২৫০ মি.লি.)', price: 0.60 },
        ],
        specialInstructions: 'একটু গরম গরম বিরিয়ানি আর লসি খুব ঠান্ডা দিবেন প্লিজ!',
        itemTotalPrice: 5.90,
      },
    ];

    const demoLoc = parseLocationCoordinates(selectedAddress);
    const demoRoute = generateDynamicRoute(INITIAL_RESTAURANT.location, demoLoc, 7);

    const demoOrder: Order = {
      id: `ord_demo_${Date.now()}`,
      orderNumber: 'FD-8921',
      items: demoItems,
      subtotal: 5.90,
      deliveryFee: 0.50,
      tip: 0.50,
      discount: 0,
      totalAmount: 6.90,
      status: 'on_the_way',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedDeliveryMinutes: 15,
      etaTimestamp: new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: currentUser?.name || 'অর্ণব ব্যানার্জী (Arnab Banerjee)',
      customerPhone: currentUser?.phone || '+91 98301-88220',
      deliveryAddress: selectedAddress,
      deliveryNotes: 'বাসার গেটে বা গার্ডের সিকিউরিটিতে দিয়ে দেবেন।',
      restaurant: INITIAL_RESTAURANT,
      customerLocation: demoLoc,
      driver: DEFAULT_DRIVER,
      currentDriverLocation: demoRoute[1] || demoRoute[0],
      routeCoordinates: demoRoute,
      progressPercentage: 25,
      orderLogs: [
        ...INITIAL_PRESET_LOGS,
        {
          id: `l4_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'ready_for_pickup',
          message: 'কলকাতা বিরিয়ানি ও মালাই লসি থার্মাল বক্সে প্যাকড সম্পন্ন',
          detail: 'রাইডার রূপম খাবার গ্রহণ করেছেন',
          actor: 'driver',
        },
      ],
      driverDistanceKm: 1.2,
      driverSpeedKmh: 28,
    };

    setActiveOrder(demoOrder);
    soundManager.playChime('order_placed');
  };

  // Real-time GPS Movement Animation Loop
  useEffect(() => {
    if (!activeOrder || isSimPaused) return;
    if (activeOrder.status !== 'on_the_way' && activeOrder.status !== 'arriving') return;

    const route = activeOrder.routeCoordinates && activeOrder.routeCoordinates.length > 0 
      ? activeOrder.routeCoordinates 
      : SAMPLE_ROUTE_COORDINATES;

    const intervalMs = 2000 / simSpeed;

    const interval = setInterval(() => {
      setRouteProgressIdx((prevIdx) => {
        const totalWaypoints = route.length;
        const nextIdx = prevIdx + 1;

        if (nextIdx < totalWaypoints) {
          const nextLocation = route[nextIdx];
          const progressPct = Math.round((nextIdx / (totalWaypoints - 1)) * 100);
          const remainingMinutes = Math.max(1, Math.round((1 - nextIdx / totalWaypoints) * 6));

          // Update active order location
          setActiveOrder((prev) => {
            if (!prev) return null;
            const isNear = nextIdx >= totalWaypoints - 2;
            const newStatus: OrderStatus = isNear ? 'arriving' : 'on_the_way';

            if (prev.status === 'on_the_way' && newStatus === 'arriving') {
              soundManager.playChime('nearby');
            }

            return {
              ...prev,
              currentDriverLocation: nextLocation,
              progressPercentage: progressPct,
              estimatedDeliveryMinutes: remainingMinutes,
              status: newStatus,
              driverDistanceKm: Math.max(0.1, (1 - nextIdx / totalWaypoints) * 1.5),
              driverSpeedKmh: Math.floor(22 + Math.random() * 12),
            };
          });

          return nextIdx;
        } else {
          // Reached Destination!
          clearInterval(interval);
          handleDeliveryComplete();
          return prevIdx;
        }
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [activeOrder?.status, activeOrder?.routeCoordinates, isSimPaused, simSpeed]);

  // Handle Complete Delivery
  const handleDeliveryComplete = () => {
    soundManager.playChime('delivered');
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch {}

    setActiveOrder((prev) => {
      if (!prev) return null;
      const updatedLogs = [
        ...prev.orderLogs,
        {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: 'delivered' as const,
          message: '🎉 কাস্টমারের নিকট খাবার সফলভাবে পৌঁছে দেওয়া হয়েছে!',
          detail: 'ডেলিভারি সম্পন্ন',
          actor: 'driver' as const,
        },
      ];

      const completedOrder: Order = {
        ...prev,
        status: 'delivered',
        progressPercentage: 100,
        estimatedDeliveryMinutes: 0,
        orderLogs: updatedLogs,
        currentDriverLocation: SAMPLE_ROUTE_COORDINATES[SAMPLE_ROUTE_COORDINATES.length - 1],
      };

      setOrderHistory((h) => [completedOrder, ...h]);
      return completedOrder;
    });
  };

  // Cart Handlers
  const handleAddToCart = (
    menuItem: MenuItem,
    quantity: number,
    selectedOptions: SelectedOption[],
    specialInstructions: string
  ) => {
    soundManager.playChime('click');
    const optionsPrice = selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
    const itemTotalPrice = (menuItem.price + optionsPrice) * quantity;

    const newItem: CartItem = {
      cartItemId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      menuItem,
      quantity,
      selectedOptions,
      specialInstructions,
      itemTotalPrice,
    };

    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const handleQuickAdd = (menuItem: MenuItem) => {
    handleAddToCart(menuItem, 1, [], '');
  };

  const handleUpdateCartQty = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    soundManager.playChime('click');
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const unitPrice = item.itemTotalPrice / item.quantity;
          return {
            ...item,
            quantity: newQty,
            itemTotalPrice: unitPrice * newQty,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    soundManager.playChime('click');
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Admin Item Management
  const handleAddMenuItem = (newItem: MenuItem) => {
    setMenuItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLoginUser = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role) {
      setRole(user.role);
    }
    try {
      localStorage.setItem('fastbite_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoutUser = () => {
    const loggedOutUser: UserProfile = {
      id: '',
      name: 'গেস্ট কাস্টমার',
      phone: '',
      role: 'customer',
      isLoggedIn: false,
    };
    setCurrentUser(loggedOutUser);
    setRole('customer');
    try {
      localStorage.removeItem('fastbite_user');
    } catch (e) {
      console.error(e);
    }
  };

  // Checkout & Place New Order
  const handleCheckout = (
    subtotal: number, 
    deliveryFee: number, 
    tip: number, 
    discount: number,
    addressToUse: string
  ) => {
    const orderNum = Math.floor(1000 + Math.random() * 9000).toString();
    const customerLocation = parseLocationCoordinates(addressToUse);

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      orderNumber: `FD-${orderNum}`,
      items: [...cartItems],
      subtotal,
      deliveryFee,
      tip,
      discount,
      totalAmount: Math.max(0, subtotal - discount + deliveryFee + tip),
      status: 'placed',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedDeliveryMinutes: 20,
      etaTimestamp: new Date(Date.now() + 20 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: currentUser?.isLoggedIn && currentUser.name ? currentUser.name : 'অর্ণব ব্যানার্জী',
      customerPhone: currentUser?.isLoggedIn && currentUser.phone ? currentUser.phone : '+91 98301-88220',
      deliveryAddress: addressToUse,
      deliveryNotes: 'কল করুন বা গেটে রাখুন।',
      restaurant: INITIAL_RESTAURANT,
      customerLocation,
      driver: driversList[0] || DEFAULT_DRIVER,
      currentDriverLocation: SAMPLE_ROUTE_COORDINATES[0],
      routeCoordinates: SAMPLE_ROUTE_COORDINATES,
      progressPercentage: 5,
      orderLogs: [
        {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: 'placed',
          message: `অর্ডার #FD-${orderNum} রিসিভ হয়েছে`,
          detail: `ডেলিভারি ঠিকানা: ${addressToUse}`,
          actor: 'system',
        },
      ],
      driverDistanceKm: 2.1,
      driverSpeedKmh: 0,
    };

    setActiveOrder(newOrder);
    setCartItems([]);
    setRouteProgressIdx(0);
    setIsSimPaused(false);
  };

  // Update order status from Driver or Kitchen or Admin View
  const handleManualStatusUpdate = (nextStatus: OrderStatus, logMessage: string, detail?: string) => {
    if (!activeOrder) return;
    
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: nowStr,
      status: nextStatus,
      message: logMessage,
      detail,
      actor: role === 'kitchen' ? ('kitchen' as const) : role === 'admin' ? ('system' as const) : ('driver' as const),
    };

    setActiveOrder((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: nextStatus,
        orderLogs: [...prev.orderLogs, newLog],
      };
    });
  };

  const handleAssignDriver = (orderId: string, driver: Driver) => {
    if (!activeOrder) return;
    setActiveOrder((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        driver,
        orderLogs: [
          ...prev.orderLogs,
          {
            id: `log_drv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: prev.status,
            message: `রাইডার পুনঃনির্ধারণ: ${driver.name}`,
            actor: 'system',
          },
        ],
      };
    });
  };

  // Chat message send handler
  const handleSendChatMessage = (text: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      sender: 'customer',
      text,
      timestamp: nowStr,
    };

    setChatMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      const replies = [
        "ধন্যবাদ ভাই, আমি দেখতেছি 👍",
        "জ্বী ভাই, ২ মিনিটের মধ্যে পৌঁছাচ্ছি 🛵",
        "গেটে রিসিভ করুন প্লিজ!",
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg_reply_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          sender: 'driver',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      soundManager.playChime('click');
    }, 1800);
  };

  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-orange-500 selection:text-white flex flex-col">
      
      {/* Top Header Navigation */}
      <Header
        role={role}
        onSelectRole={setRole}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        activeOrder={activeOrder}
        onOpenTracking={() => {
          soundManager.playChime('click');
          setRole('customer');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          soundManager.setEnabled(next);
        }}
        lang={lang}
        onSelectLang={setLang}
        currency={currency}
        onSelectCurrency={setCurrency}
        selectedAddress={selectedAddress}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Page Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Customer Role View */}
        {role === 'customer' && (
          <div className="space-y-8">
            
            {/* Live Realtime Tracker Bar */}
            {activeOrder && (
              <RealtimeTracker
                order={activeOrder}
                onOpenChat={() => setIsChatOpen(true)}
                onSimulateProgress={(nextStatus, customMsg) => {
                  handleManualStatusUpdate(nextStatus, customMsg || `অর্ডার আপডেট: ${nextStatus}`);
                }}
                onTriggerDelay={() => {
                  soundManager.playChime('click');
                  setActiveOrder((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      estimatedDeliveryMinutes: prev.estimatedDeliveryMinutes + 3,
                      orderLogs: [
                        ...prev.orderLogs,
                        {
                          id: `log_delay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          status: prev.status,
                          message: '⚠️ ট্রাফিক সিগন্যালে সামান্য বিলম্ব (+৩ মিনিট)',
                          actor: 'driver',
                        },
                      ],
                    };
                  });
                }}
                isPaused={isSimPaused}
                onTogglePause={() => setIsSimPaused((p) => !p)}
                simSpeed={simSpeed}
                onChangeSimSpeed={setSimSpeed}
                onCompleteDelivery={handleDeliveryComplete}
                lang={lang}
                currency={currency}
              />
            )}

            {/* Main Menu & Ordering Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                    {t.menu.title}
                  </h2>
                  <p className="text-xs text-zinc-400">{t.menu.subtitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!activeOrder && (
                    <button
                      onClick={handleLoadDemoOrder}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-semibold border border-orange-500/30 transition-all"
                      title="ডেমো ট্র্যাকিং দেখার জন্য ক্লিক করুন"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>স্যাম্পল অর্ডার টেস্ট</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors"
                  >
                    <History className="w-4 h-4 text-orange-400" />
                    <span>অর্ডার হিস্ট্রি ({orderHistory.length})</span>
                  </button>
                </div>
              </div>

              <MenuSection
                onSelectItem={setSelectedMenuItem}
                onQuickAdd={handleQuickAdd}
                lang={lang}
                currency={currency}
                menuItems={menuItems}
              />
            </div>

          </div>
        )}

        {/* Driver Role View */}
        {role === 'driver' && (
          <DriverView
            order={activeOrder}
            onUpdateStatus={handleManualStatusUpdate}
            onSendMessage={handleSendChatMessage}
            onOpenChat={() => setIsChatOpen(true)}
            lang={lang}
            currency={currency}
          />
        )}

        {/* Kitchen KDS Role View */}
        {role === 'kitchen' && (
          <KitchenView
            order={activeOrder}
            onUpdateStatus={handleManualStatusUpdate}
          />
        )}

        {/* Admin Role View */}
        {role === 'admin' && (
          <AdminView
            lang={lang}
            currency={currency}
            onSelectCurrency={setCurrency}
            onSelectLang={setLang}
            menuItems={menuItems}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            orders={orderHistory}
            activeOrder={activeOrder}
            onForceOrderStatus={handleManualStatusUpdate}
            drivers={driversList}
            onAssignDriver={handleAssignDriver}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500 space-y-2">
        <div className="flex items-center justify-center gap-2 text-zinc-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>ফাস্টবাইট এক্সপ্রেস - বাংলাদেশ ও ভারত ফাস্টফুড প্ল্যাটফর্ম</span>
          <span>• ৩টি অ্যাপস একত্রে (কাস্টমার, ডেলিভারি রাইডার ও এডমিন)</span>
        </div>
        <p className="text-[11px] text-zinc-600">
          রিয়েল-টাইম জিপিএস ট্র্যাকিং, ভয়েস কম্বো চেইম ও বাংলা সাপোর্ট সহ সার্বিক ব্যাকএন্ড সিস্টেম।
        </p>
      </footer>

      {/* Modals & Slide-overs */}
      <FoodDetailModal
        item={selectedMenuItem}
        onClose={() => setSelectedMenuItem(null)}
        onAddToCart={handleAddToCart}
        lang={lang}
        currency={currency}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
        lang={lang}
        currency={currency}
        selectedAddress={selectedAddress}
        onSelectAddress={setSelectedAddress}
      />

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        driver={activeOrder?.driver || DEFAULT_DRIVER}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
      />

      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orderHistory={orderHistory}
        onReorder={(oldOrder) => {
          setCartItems(oldOrder.items);
          setIsCartOpen(true);
        }}
        onSubmitRating={(orderId, foodRating, driverRating, feedback) => {
          setOrderHistory((prev) =>
            prev.map((o) => {
              if (o.id === orderId) {
                return {
                  ...o,
                  ratingSubmitted: { foodRating, driverRating, feedback },
                };
              }
              return o;
            })
          );
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLoginUser}
        onLogout={handleLogoutUser}
        targetRole={role}
      />

    </div>
  );
}
