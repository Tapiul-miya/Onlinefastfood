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
import { OrderSuccessModal } from './components/OrderSuccessModal';

import { 
  Flame, History, Sparkles, ShoppingBag, ArrowRight, Utensils, Bike, MapPin, Compass, ShieldCheck 
} from 'lucide-react';

const INITIAL_ROLE_PROFILES: Record<UserRole, UserProfile> = {
  customer: {
    id: 'usr_customer_01',
    name: 'অর্ণব ব্যানার্জী (Arnab Banerjee)',
    phone: '+91 98301-88220',
    role: 'customer',
    email: 'arnab.kolkata@example.com',
    address: 'সল্টলেক সেক্টর ৫, ইলেকট্রনিক্স কমপ্লেক্স, কলকাতা (Salt Lake Sector V, Kolkata)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    isLoggedIn: true,
  },
  driver: {
    id: 'usr_driver_01',
    name: 'রুপম ব্যানার্জী (Rider Rupam Banerjee)',
    phone: '+91 98310-99482',
    role: 'driver',
    email: 'rider.rupam@fastbite.in',
    address: 'পার্ক স্ট্রিট সেন্ট্রাল হাব, কলকাতা',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    vehicleNumber: 'TVS Apache 160 (WB-02-AK-4819)',
    employeeId: 'DRV-KOL-9948',
    assignedHub: 'পার্ক স্ট্রিট সেন্ট্রাল হাব',
    rating: 4.95,
    tripsCompleted: 1840,
    isDutyActive: true,
    isLoggedIn: true,
  },
  kitchen: {
    id: 'usr_kitchen_01',
    name: 'শেফ তৌফিক আহমেদ (Chef Toufiq Ahmed)',
    phone: '+91 98300-11223',
    role: 'kitchen',
    email: 'kitchen.parkst@fastbite.in',
    restaurantId: 'ফাস্টবাইট এক্সপ্রেস কলকাতা (Park Street HQ)',
    employeeId: 'KITCHEN-KOL-01',
    address: '৭৭ পার্ক স্ট্রিট, কলকাতা ৭০০০১৬',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=300',
    isLoggedIn: true,
  },
  admin: {
    id: 'usr_admin_01',
    name: 'সুপার এডমিন রানা ব্যানার্জী (Super Admin Rana)',
    phone: '+91 98300-00100',
    role: 'admin',
    email: 'admin.fastbite@foodexpress.in',
    employeeId: 'ADMIN-SYS-2026',
    address: 'হেড অফিস, পার্ক স্ট্রিট মোড়, কলকাতা',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    securityKey: 'ADMIN-2026-KEY',
    isLoggedIn: true,
  },
};

export default function App() {
  // App Role Profiles (Separate dedicated profile for each app role)
  const [roleProfiles, setRoleProfiles] = useState<Record<UserRole, UserProfile>>(() => {
    try {
      const saved = localStorage.getItem('fastbite_role_profiles');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ROLE_PROFILES;
  });

  const [role, setRole] = useState<UserRole>('customer');
  const [customerTab, setCustomerTab] = useState<'menu' | 'tracking'>('menu');

  // Active Current User profile based on selected app role
  const currentUser = roleProfiles[role] || INITIAL_ROLE_PROFILES[role];

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Order Success Modal state
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState<boolean>(false);
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderNumber: string;
    totalAmount: number;
    deliveryAddress: string;
    estimatedMinutes: number;
  } | null>(null);

  // Localization State (Default to INR currency for Kolkata)
  const [lang, setLang] = useState<Language>('bn');
  const [currency, setCurrency] = useState<Currency>('INR');

  const [selectedAddress, setSelectedAddress] = useState<string>(
    roleProfiles.customer?.address || INITIAL_CUSTOMER_LOCATION.address || 'সল্টলেক সেক্টর ৫, ইলেকট্রনিক্স কমপ্লেক্স, কলকাতা (Salt Lake Sector V, Kolkata)'
  );

  // Switch App Role Handler - automatically switches active profile
  const handleSelectRole = (newRole: UserRole) => {
    soundManager.playChime('click');
    setRole(newRole);
    if (newRole === 'customer' && roleProfiles.customer?.address) {
      setSelectedAddress(roleProfiles.customer.address);
    }
  };

  // Update Profile or Login User Handler
  const handleLoginUser = (updatedUser: UserProfile) => {
    const targetRole = updatedUser.role || role;
    const newProfiles = {
      ...roleProfiles,
      [targetRole]: updatedUser,
    };
    setRoleProfiles(newProfiles);
    try {
      localStorage.setItem('fastbite_role_profiles', JSON.stringify(newProfiles));
    } catch (e) {
      console.error(e);
    }
  };

  // Logout User Handler for active or target role
  const handleLogoutUser = (targetRole?: UserRole) => {
    const roleToLogout = targetRole || role;
    const newProfiles = {
      ...roleProfiles,
      [roleToLogout]: {
        ...INITIAL_ROLE_PROFILES[roleToLogout],
        isLoggedIn: false,
      },
    };
    setRoleProfiles(newProfiles);
    try {
      localStorage.setItem('fastbite_role_profiles', JSON.stringify(newProfiles));
    } catch (e) {
      console.error(e);
    }
  };

  // Sync customer address to active order
  useEffect(() => {
    if (roleProfiles.customer?.address) {
      setSelectedAddress(roleProfiles.customer.address);
      
      // If there's an active order, update its customer delivery location in real-time
      setActiveOrder((prev) => {
        if (!prev) return null;
        const newCustomerLoc = parseLocationCoordinates(roleProfiles.customer.address);
        const newRoute = generateDynamicRoute(prev.currentDriverLocation || INITIAL_RESTAURANT.location, newCustomerLoc, 7);
        return {
          ...prev,
          deliveryAddress: roleProfiles.customer.address,
          customerLocation: newCustomerLoc,
          routeCoordinates: newRoute,
        };
      });
    }
  }, [roleProfiles.customer?.address]);

  // Sync delivery partner (driver) profile to live order and driver marker map
  useEffect(() => {
    const driverProfile = roleProfiles.driver;
    if (!driverProfile) return;

    const updatedDriverObj: Driver = {
      id: driverProfile.id || 'usr_driver_01',
      name: driverProfile.name || 'রুপম ব্যানার্জী (Rider Rupam Banerjee)',
      phone: driverProfile.phone || '+91 98310-99482',
      photo: driverProfile.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      vehicleType: 'bike',
      vehiclePlate: driverProfile.vehicleNumber || 'WB-02-AK-4819',
      rating: driverProfile.rating || 4.95,
      tripsCompleted: driverProfile.tripsCompleted || 1840,
      batteryLevel: 94,
    };

    setDriversList((prev) =>
      prev.map((d) => (d.id === updatedDriverObj.id || d.id === 'drv_01' ? { ...d, ...updatedDriverObj } : d))
    );

    setActiveOrder((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        driver: updatedDriverObj,
      };
    });
  }, [roleProfiles.driver?.name, roleProfiles.driver?.vehicleNumber, roleProfiles.driver?.avatar, roleProfiles.driver?.phone]);

  // Real device GPS driver location update handler
  const handleUpdateDriverLocation = (newLoc: GeoPoint, addressStr: string) => {
    setRoleProfiles((prev) => ({
      ...prev,
      driver: {
        ...prev.driver,
        address: addressStr,
      },
    }));

    setActiveOrder((prev) => {
      if (!prev) return null;
      // Only recalculate route if driver position moved significantly
      const prevLoc = prev.currentDriverLocation;
      if (prevLoc && Math.abs(prevLoc.lat - newLoc.lat) < 0.00001 && Math.abs(prevLoc.lng - newLoc.lng) < 0.00001) {
        return prev;
      }
      const updatedDriver: Driver = {
        ...prev.driver,
        name: roleProfiles.driver?.name || prev.driver.name,
      };
      const newRoute = generateDynamicRoute(newLoc, prev.customerLocation, 7);
      return {
        ...prev,
        driver: updatedDriver,
        currentDriverLocation: newLoc,
        routeCoordinates: newRoute,
      };
    });
  };

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

  // Push Notifications State
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fastbite_push_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [pushNotificationsList, setPushNotificationsList] = useState<Array<{
    id: string;
    title: string;
    body: string;
    time: string;
    read: boolean;
  }>>(() => {
    try {
      const saved = localStorage.getItem('fastbite_push_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'p_init_1',
        title: 'ফাস্টবাইট পুশ নোটিফিকেশন সিস্টেম চালু আছে',
        body: 'আপনার অর্ডারের লাইভ আপডেট ও ডেলিভারি অ্যালার্ট সরাসরি পুশ নোটিফিকেশনে পাওয়া যাবে।',
        time: 'এখনই',
        read: false,
      }
    ];
  });

  const [activePushToast, setActivePushToast] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('fastbite_push_list', JSON.stringify(pushNotificationsList));
    } catch {}
  }, [pushNotificationsList]);

  const triggerPushNotification = (title: string, body: string) => {
    if (!pushEnabled) return;

    if (soundEnabled) {
      soundManager.playChime('push_notification');
    }

    const newPush = {
      id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      body,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setPushNotificationsList(prev => [newPush, ...prev].slice(0, 20));
    setActivePushToast({ title, body });

    setTimeout(() => {
      setActivePushToast(prev => prev?.title === title ? null : prev);
    }, 5000);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=120'
          });
        } catch (e) {
          console.error(e);
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            try {
              new Notification(title, { body });
            } catch (e) {}
          }
        });
      }
    }
  };

  const handleTogglePush = () => {
    soundManager.playChime('click');
    const newState = !pushEnabled;
    setPushEnabled(newState);
    try {
      localStorage.setItem('fastbite_push_enabled', JSON.stringify(newState));
    } catch {}

    if (newState) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      triggerPushNotification('পুশ নোটিফিকেশন চালু করা হয়েছে', 'এখন থেকে সমস্ত অর্ডারের লাইভ আপডেট তাৎক্ষণিকভাবে পুশ নোটিফিকেশনে পাবেন।');
    }
  };

  const handleClearPush = () => {
    soundManager.playChime('click');
    setPushNotificationsList([]);
  };

  const handleTestPush = () => {
    soundManager.playChime('click');
    triggerPushNotification('🧪 টেস্ট পুশ নোটিফিকেশন', 'আপনার ফাস্টবাইট পুশ নোটিফিকেশন সিস্টেম সফলভাবে কাজ করছে!');
  };

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
    const driverAddressStr = roleProfiles.driver?.address || 'পার্ক স্ট্রিট সেন্ট্রাল হাব, কলকাতা';
    const driverLoc = parseLocationCoordinates(driverAddressStr);
    const activeDriverObj: Driver = {
      id: roleProfiles.driver?.id || 'usr_driver_01',
      name: roleProfiles.driver?.name || 'রুপম ব্যানার্জী (Rider Rupam Banerjee)',
      phone: roleProfiles.driver?.phone || '+91 98310-99482',
      photo: roleProfiles.driver?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      vehicleType: 'bike',
      vehiclePlate: roleProfiles.driver?.vehicleNumber || 'WB-02-AK-4819',
      rating: roleProfiles.driver?.rating || 4.95,
      tripsCompleted: roleProfiles.driver?.tripsCompleted || 1840,
      batteryLevel: 94,
    };
    const demoRoute = generateDynamicRoute(driverLoc, demoLoc, 7);

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
      driver: activeDriverObj,
      currentDriverLocation: driverLoc,
      routeCoordinates: demoRoute,
      progressPercentage: 25,
      orderLogs: [
        ...INITIAL_PRESET_LOGS,
        {
          id: `l4_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'ready_for_pickup',
          message: 'কলকাতা বিরিয়ানি ও মালাই লসি থার্মাল বক্সে প্যাকড সম্পন্ন',
          detail: `রাইডার ${activeDriverObj.name} খাবার গ্রহণ করেছেন`,
          actor: 'driver',
        },
      ],
      driverDistanceKm: 1.2,
      driverSpeedKmh: 28,
    };

    setActiveOrder(demoOrder);
    setCustomerTab('tracking');
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
    const driverAddressStr = roleProfiles.driver?.address || 'পার্ক স্ট্রিট সেন্ট্রাল হাব, কলকাতা';
    const driverLoc = parseLocationCoordinates(driverAddressStr);
    const activeDriverObj: Driver = {
      id: roleProfiles.driver?.id || 'usr_driver_01',
      name: roleProfiles.driver?.name || 'রুপম ব্যানার্জী (Rider Rupam Banerjee)',
      phone: roleProfiles.driver?.phone || '+91 98310-99482',
      photo: roleProfiles.driver?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      vehicleType: 'bike',
      vehiclePlate: roleProfiles.driver?.vehicleNumber || 'WB-02-AK-4819',
      rating: roleProfiles.driver?.rating || 4.95,
      tripsCompleted: roleProfiles.driver?.tripsCompleted || 1840,
      batteryLevel: 94,
    };
    const orderRoute = generateDynamicRoute(driverLoc, customerLocation, 7);

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
      customerName: roleProfiles.customer?.name || 'অর্ণব ব্যানার্জী',
      customerPhone: roleProfiles.customer?.phone || '+91 98301-88220',
      deliveryAddress: addressToUse,
      deliveryNotes: 'কল করুন বা গেটে রাখুন।',
      restaurant: INITIAL_RESTAURANT,
      customerLocation,
      driver: activeDriverObj,
      currentDriverLocation: driverLoc,
      routeCoordinates: orderRoute,
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

    triggerPushNotification(
      `🍽️ নতুন অর্ডার প্লেস হয়েছে! (${newOrder.orderNumber})`,
      `আপনার অর্ডার সফলভাবে প্লেস করা হয়েছে। মোট মূল্য: ${formatPrice(newOrder.totalAmount, currency)}।`
    );

    // Trigger Order Success Modal & Sound
    soundManager.playChime('order_placed');
    setOrderSuccessData({
      orderNumber: newOrder.orderNumber,
      totalAmount: newOrder.totalAmount,
      deliveryAddress: addressToUse,
      estimatedMinutes: newOrder.estimatedDeliveryMinutes,
    });
    setIsOrderSuccessModalOpen(true);
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
        onSelectRole={handleSelectRole}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        activeOrder={activeOrder}
        onOpenTracking={() => {
          soundManager.playChime('click');
          setRole('customer');
          setCustomerTab('tracking');
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
        pushEnabled={pushEnabled}
        onTogglePush={handleTogglePush}
        pushNotifications={pushNotificationsList}
        onClearPush={handleClearPush}
        onTestPush={handleTestPush}
      />

      {/* Floating Push Notification Toast Banner */}
      {activePushToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-zinc-900 border border-orange-500/60 rounded-2xl p-4 shadow-2xl text-white flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0 animate-pulse">
            <span className="text-lg">🔔</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-orange-400">{activePushToast.title}</div>
            <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">{activePushToast.body}</p>
          </div>
          <button
            onClick={() => setActivePushToast(null)}
            className="text-zinc-400 hover:text-white text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Page Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Customer Role View */}
        {role === 'customer' && (
          <div className="space-y-6">
            
            {/* Customer Navigation Tabs */}
            <div className="flex items-center justify-between bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 shadow-lg">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  id="btn-customer-tab-menu"
                  onClick={() => {
                    soundManager.playChime('click');
                    setCustomerTab('menu');
                  }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    customerTab === 'menu'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20 ring-2 ring-orange-500/40'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Utensils className="w-4 h-4 text-orange-400" />
                  <span>১. খাবার মেনু</span>
                </button>

                <button
                  id="btn-customer-tab-tracking"
                  onClick={() => {
                    soundManager.playChime('click');
                    setCustomerTab('tracking');
                  }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all relative ${
                    customerTab === 'tracking'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20 ring-2 ring-orange-500/40'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Bike className="w-4 h-4 text-amber-400" />
                  <span>২. জিপিএস লাইভ ট্র্যাকিং</span>
                  {activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled' && (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700/60 transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-orange-400" />
                  <span>হিস্ট্রি ({orderHistory.length})</span>
                </button>
              </div>
            </div>

            {/* TAB 1: FOOD MENU */}
            {customerTab === 'menu' && (
              <div className="space-y-6">
                {/* Active Order alert banner with blinking animation */}
                {activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled' && (
                  <div 
                    onClick={() => {
                      soundManager.playChime('click');
                      setCustomerTab('tracking');
                    }}
                    className="bg-gradient-to-r from-orange-950/90 via-zinc-900 to-amber-950/90 border border-orange-500/50 rounded-2xl p-4 flex items-center justify-between gap-3 text-white shadow-xl cursor-pointer hover:border-orange-500 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 text-orange-400 flex items-center justify-center shrink-0 animate-pulse">
                        <Bike className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-extrabold text-orange-400 uppercase animate-pulse">
                            🚨 আপনার খাবার আসতেছে! (#{activeOrder.orderNumber})
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 font-medium mt-0.5">
                          রাইডার {activeOrder.driver.name} আপনার খাবার নিয়ে রাস্তায় আছেন। লাইভ ট্র্যাকিং দেখতে ক্লিক করুন।
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 group-hover:translate-x-1 transition-transform shrink-0">
                      <span>লাইভ ম্যাপ</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* Main Menu Section */}
                <MenuSection
                  onSelectItem={setSelectedMenuItem}
                  onQuickAdd={handleQuickAdd}
                  lang={lang}
                  currency={currency}
                  menuItems={menuItems}
                />
              </div>
            )}

            {/* TAB 2: DEDICATED GPS LIVE TRACKING PAGE */}
            {customerTab === 'tracking' && (
              <div className="space-y-6">
                {activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled' ? (
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
                ) : (
                  /* Standby / Empty State for Live GPS Tracker Page */
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 text-center text-white space-y-6 shadow-2xl max-w-3xl mx-auto">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-xl shadow-orange-500/20">
                      <div className="w-full h-full bg-zinc-950 rounded-[22px] flex items-center justify-center text-orange-400">
                        <Bike className="w-10 h-10 animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                        বর্তমানে কোন লাইভ জিপিএস অর্ডার চলমান নেই
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                        মেনু থেকে পছন্দের খাবার অর্ডার করলে স্যাটেলাইট ম্যাপে রাইডারের লাইভ লোকেশন ও ট্র্যাকিং সরাসরি দেখতে পাবেন।
                      </p>
                    </div>

                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => {
                          soundManager.playChime('click');
                          setCustomerTab('menu');
                        }}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Utensils className="w-4 h-4 text-white" />
                        <span>খাবার মেনুতে যান</span>
                      </button>
                    </div>

                    {/* Past Orders Trackers */}
                    {orderHistory.length > 0 && (
                      <div className="pt-6 border-t border-zinc-800 text-left space-y-3">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                          <History className="w-4 h-4 text-orange-400" />
                          আপনার পূর্ববর্তী অর্ডারসমূহ:
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {orderHistory.slice(0, 4).map((ord) => (
                            <div key={ord.id} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3">
                              <div>
                                <div className="text-xs font-bold text-white font-mono">{ord.orderNumber}</div>
                                <div className="text-[11px] text-zinc-400">{ord.createdAt} • {formatPrice(ord.totalAmount, currency)}</div>
                              </div>
                              <button
                                onClick={() => {
                                  soundManager.playChime('click');
                                  setActiveOrder(ord);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-xs"
                              >
                                রি-ট্র্যাক
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onUpdateDriverLocation={handleUpdateDriverLocation}
          />
        )}

        {/* Kitchen KDS Role View */}
        {role === 'kitchen' && (
          <KitchenView
            order={activeOrder}
            onUpdateStatus={handleManualStatusUpdate}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
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
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
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
        lang={lang}
        onSelectLang={setLang}
        currency={currency}
        onSelectCurrency={setCurrency}
      />

      <OrderSuccessModal
        isOpen={isOrderSuccessModalOpen}
        onClose={() => setIsOrderSuccessModalOpen(false)}
        orderNumber={orderSuccessData?.orderNumber || 'FD-1001'}
        totalAmount={orderSuccessData?.totalAmount || 0}
        deliveryAddress={orderSuccessData?.deliveryAddress || ''}
        estimatedMinutes={orderSuccessData?.estimatedMinutes || 20}
        currency={currency}
        onTrackOrder={() => {
          setRole('customer');
          setCustomerTab('tracking');
        }}
      />

      {/* Persistent Floating Sticky Bottom Cart Bar for Customer View */}
      {role === 'customer' && cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 max-w-md w-full mx-auto z-40 animate-slide-up">
          <div 
            onClick={() => {
              soundManager.playChime('click');
              setIsCartOpen(true);
            }}
            className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-orange-600/40 border-2 border-orange-400/50 backdrop-blur-md flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 text-white group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-orange-100 flex items-center gap-1">
                  <span>খাবারের ঝুড়ি (Food Cart)</span>
                  <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-md text-amber-200">
                    {cartItems.length} টি আইটেম
                  </span>
                </p>
                <p className="text-sm font-extrabold text-white font-mono">
                  {formatPrice(cartItems.reduce((acc, item) => acc + item.itemTotalPrice, 0), currency)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-black/20 group-hover:bg-black/30 px-3 py-2 rounded-xl border border-white/20 text-xs font-extrabold text-white transition-colors">
              <span>কার্ট দেখুন (View Cart)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
