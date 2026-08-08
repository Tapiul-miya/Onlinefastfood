import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  MenuItem, SelectedOption, CartItem, Order, OrderStatus, 
  UserRole, ChatMessage, Driver, UserProfile, GeoPoint 
} from './types';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';
import { MENU_ITEMS } from './data/mockData';
import { 
  INITIAL_RESTAURANT, INITIAL_CUSTOMER_LOCATION, 
  DEFAULT_DRIVER, INITIAL_DRIVERS_LIST, SAMPLE_ROUTE_COORDINATES, INITIAL_PRESET_LOGS,
  REGIONAL_PRESET_LOCATIONS
} from './data/constants';
import { Language, Currency, formatPrice, TRANSLATIONS } from './utils/i18n';
import { soundManager, SoundEventKey } from './utils/audio';
import { db } from './lib/firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, deleteDoc, getDocs } from 'firebase/firestore';

import { Header } from './components/Header';
import { MenuSection } from './components/MenuSection';
import { FoodDetailModal } from './components/FoodDetailModal';
import { RealtimeTracker } from './components/RealtimeTracker';
import { DriverView } from './components/DriverView';
import { KitchenView } from './components/KitchenView';
import { AdminView } from './components/AdminView';
import { ChatModal } from './components/ChatModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { AuthModal } from './components/AuthModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { CancelledOrderModal } from './components/CancelledOrderModal';
import { ApkBuildModal } from './components/ApkBuildModal';
import { SplashScreen } from './components/SplashScreen';
import { updateAppTitleAndIcon } from './utils/apkConfigs';

import { 
  Flame, History, Sparkles, ShoppingBag, ArrowRight, Utensils, Bike, MapPin, Compass, ShieldCheck, Lock, AlertTriangle,
  Wifi, WifiOff
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
    id: 'drv_01',
    name: 'তাপিওল বান্দেগী (Rider Tapiul Bandegi)',
    phone: '+91 98310-99482',
    role: 'driver',
    email: 'tapiul.bandegi@gmail.com',
    address: 'সল্টলেক বাস ডিপো, কলকাতা',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    vehicleNumber: 'WB-02-AK-4819',
    employeeId: 'RIDER-KOL-102',
    assignedHub: 'সল্টলেক হাব',
    rating: 4.95,
    tripsCompleted: 1840,
    isDutyActive: true,
    isLoggedIn: true,
  },
  kitchen: {
    id: 'KITCHEN-01',
    name: 'শেফ রাজিব রায় (Chef Rajib Roy)',
    phone: '+91 98300-11223',
    role: 'kitchen',
    email: 'chef.kolkata@fastbite.in',
    restaurantId: 'KITCHEN-KOL-01',
    employeeId: 'KITCHEN-KOL-01',
    address: 'পার্ক স্ট্রিট কিচেন হাব, কলকাতা',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=300',
    isLoggedIn: true,
  },
  admin: {
    id: 'ADM-2026',
    name: 'সুপার এডমিন রানা ব্যানার্জী (Super Admin)',
    phone: '+91 98300-00100',
    role: 'admin',
    email: 'admin.fastbite@foodexpress.in',
    employeeId: 'ADMIN-SYS-2026',
    address: 'সল্টলেক সেক্টর ৫, কলকাতা',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    securityKey: '',
    isLoggedIn: true,
  },
};

export default function App() {
  // App Role Profiles (Separate dedicated profile for each app role)
  const [roleProfiles, setRoleProfiles] = useState<Record<UserRole, UserProfile>>(() => {
    try {
      const saved = localStorage.getItem('fastbite_role_profiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_ROLE_PROFILES,
          ...parsed,
          kitchen: {
            ...INITIAL_ROLE_PROFILES.kitchen,
            ...(parsed.kitchen || {}),
            isLoggedIn: parsed.kitchen?.isLoggedIn !== false,
          },
          driver: {
            ...INITIAL_ROLE_PROFILES.driver,
            ...(parsed.driver || {}),
            isLoggedIn: parsed.driver?.isLoggedIn !== false,
          },
        };
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ROLE_PROFILES;
  });

  const [role, setRole] = useState<UserRole>('customer');
  const [isRoleLocked, setIsRoleLocked] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    // Hide native Capacitor splash screen as soon as React app loads
    try {
      CapSplashScreen.hide();
    } catch (e) {
      // Ignore if not running on native android
    }

    const detectFlavor = async () => {
      try {
        const info = await CapApp.getInfo();
        const appId = info.id;
        
        if (appId.includes('.customer')) {
          setRole('customer');
          setIsRoleLocked(true);
        } else if (appId.includes('.kitchen')) {
          setRole('kitchen');
          setIsRoleLocked(true);
        } else if (appId.includes('.rider')) {
          setRole('driver');
          setIsRoleLocked(true);
        } else if (appId.includes('.admin')) {
          setRole('admin');
          setIsRoleLocked(true);
        }
      } catch (e) {
        console.log('Not running on Android/Capacitor or Info plugin missing');
      }
    };
    detectFlavor();
  }, []);

  const [customerTab, setCustomerTab] = useState<'menu' | 'tracking' | 'home'>('menu');

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

  // Order Cancellation Modal state
  const [cancelledModalOrder, setCancelledModalOrder] = useState<Order | null>(null);

  // APK Builder Modal state
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);

  // Dynamically update page title & favicon when role changes
  useEffect(() => {
    updateAppTitleAndIcon(role);
  }, [role]);

  // Localization State (Default to INR currency for Kolkata)
  const [lang, setLang] = useState<Language>('bn');
  const [currency, setCurrency] = useState<Currency>('INR');

  const [selectedAddress, setSelectedAddress] = useState<string>(
    roleProfiles.customer?.address || INITIAL_CUSTOMER_LOCATION.address || 'সল্টলেক সেক্টর ৫, ইলেকট্রনিক্স কমপ্লেক্স, কলকাতা (Salt Lake Sector V, Kolkata)'
  );

  // Switch App Role Handler - automatically switches active profile
  const handleSelectRole = (newRole: UserRole) => {
    if (isRoleLocked) return;
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

    if (roleToLogout === 'customer') {
      if (activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled') {
         const cancelledOrder: Order = {
            ...activeOrder,
            status: 'cancelled',
            orderLogs: [
              ...activeOrder.orderLogs,
              {
                id: `cancel_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'cancelled',
                message: 'অর্ডার ক্যানসেল করা হয়েছে',
                detail: 'কাস্টমার লগআউট করার কারণে অর্ডার বাতিল করা হয়েছে।',
                actor: 'system'
              }
            ]
         };
         syncOrderToFirebase(cancelledOrder);
         setOrderHistory(h => [cancelledOrder, ...h]);
      }
      setActiveOrder(null);
      setCustomerTab('home');
    }
  };

  // Master System Reset - Clears local data and attempts to clear orders from Firestore
  const handleMasterReset = async () => {
    soundManager.playChime('click');

    try {
      // 1. Clear Local Storage
      localStorage.removeItem('fastbite_role_profiles');
      localStorage.removeItem('fastbite_push_dict');
      localStorage.removeItem('fastbite_push_enabled');
      
      // 2. Reset Local State
      setRoleProfiles(INITIAL_ROLE_PROFILES);
      setOrderHistory([]);
      setActiveOrder(null);
      setPushNotificationsDict({
        customer: [],
        admin: [],
        kitchen: [],
        driver: []
      });
      
      // 3. Clear Firestore Orders
      const q = query(collection(db, "orders"));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      alert('সিস্টেম রিসেট সফল হয়েছে! সমস্ত ডাটা এবং অর্ডারের তথ্য মুছে ফেলা হয়েছে।');
      window.location.reload(); 
    } catch (e) {
      console.error("Master Reset Error:", e);
      alert('রিসেট সফলভাবে প্রসেস করা হয়েছে। পৃষ্ঠাটি রিফ্রেশ করা হচ্ছে...');
      window.location.reload();
    }
  };

  const handleClearOrderHistory = async () => {
    try {
      const q = query(collection(db, "orders"));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.status === 'delivered' || data.status === 'cancelled';
        })
        .map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setOrderHistory(prev => prev.filter(o => o.status !== 'delivered' && o.status !== 'cancelled'));
    } catch (e) {
      console.error("Clear Order History Error:", e);
    }
  };

  const handleCancelOrder = (reason?: string) => {
    if (activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled') {
      const cancelDetail = reason || 'কাস্টমার নিজে অর্ডার বাতিল করেছেন।';
      const cancelledOrder: Order = {
        ...activeOrder,
        status: 'cancelled',
        orderLogs: [
          ...activeOrder.orderLogs,
          {
            id: `cancel_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'cancelled',
            message: 'অর্ডার ক্যানসেল করা হয়েছে (Order Cancelled)',
            detail: cancelDetail,
            actor: 'customer'
          }
        ]
      };
      syncOrderToFirebase(cancelledOrder);
      setOrderHistory(h => [cancelledOrder, ...h]);
      setActiveOrder(null);
      setCancelledModalOrder(cancelledOrder);

      triggerPushNotification(
        `🛑 অর্ডার #${cancelledOrder.orderNumber} ক্যানসেল করা হয়েছে`,
        `বাতিলের কারণ: ${cancelDetail}. ১০০% টাকা রিফান্ড প্রসেস করা হচ্ছে।`,
        ['customer']
      );
      soundManager.playChime('click');
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
      name: driverProfile.name || 'তাপিওল বান্দেগী (Rider Tapiul Bandegi)',
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
      if (
        prev.driver?.name === updatedDriverObj.name &&
        prev.driver?.vehiclePlate === updatedDriverObj.vehiclePlate &&
        prev.driver?.photo === updatedDriverObj.photo &&
        prev.driver?.phone === updatedDriverObj.phone
      ) {
        return prev;
      }
      const updated = {
        ...prev,
        driver: updatedDriverObj,
      };
      if (role === 'driver') {
        syncOrderToFirebase(updated);
      }
      return updated;
    });
  }, [roleProfiles.driver?.name, roleProfiles.driver?.vehicleNumber, roleProfiles.driver?.avatar, roleProfiles.driver?.phone, role]);

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

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
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

  const [pushNotificationsDict, setPushNotificationsDict] = useState<Record<UserRole, Array<{
    id: string;
    title: string;
    body: string;
    time: string;
    read: boolean;
  }>>>(() => {
    try {
      const saved = localStorage.getItem('fastbite_push_dict');
      if (saved) return JSON.parse(saved);
    } catch {}
    
    const initPush = {
        id: 'p_init_1',
        title: 'ফাস্টবাইট পুশ নোটিফিকেশন সিস্টেম চালু আছে',
        body: 'আপনার অর্ডারের লাইভ আপডেট ও ডেলিভারি অ্যালার্ট সরাসরি পুশ নোটিফিকেশনে পাওয়া যাবে।',
        time: 'এখনই',
        read: false,
    };
    
    return {
      customer: [initPush],
      admin: [initPush],
      kitchen: [initPush],
      driver: [initPush]
    };
  });

  const [activePushToast, setActivePushToast] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('fastbite_push_dict', JSON.stringify(pushNotificationsDict));
    } catch {}
  }, [pushNotificationsDict]);

  const triggerPushNotification = (
    title: string, 
    body: string, 
    targetRoles: UserRole[] = ['customer', 'admin', 'kitchen', 'driver'],
    soundType?: SoundEventKey
  ) => {
    const newPush = {
      id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      body,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setPushNotificationsDict(prev => {
      const next = { ...prev };
      for (const tRole of targetRoles) {
        next[tRole] = [newPush, ...(next[tRole] || [])].slice(0, 20);
      }
      return next;
    });

    // Only show toast/chime if the current role is in targetRoles and push is enabled
    if (targetRoles.includes(role) && pushEnabled) {
      if (soundEnabled) {
        soundManager.playChime(soundType || 'push_notification');
      }
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
      triggerPushNotification('পুশ নোটিফিকেশন চালু করা হয়েছে', 'এখন থেকে সমস্ত অর্ডারের লাইভ আপডেট তাৎক্ষণিকভাবে পুশ নোটিফিকেশনে পাবেন।', [role]);
    }
  };

  const handleClearPush = () => {
    soundManager.playChime('click');
    setPushNotificationsDict(prev => ({ ...prev, [role]: [] }));
  };

  // Active Live Order
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderHistoryState, setOrderHistory] = useState<Order[]>([]);

  // Internet connection monitoring states
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isSlowConnection, setIsSlowConnection] = useState<boolean>(false);
  
  // Simulated connection status for testing
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [simulatedSlow, setSimulatedSlow] = useState<boolean>(false);

  // Connection monitoring effect
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      try {
        soundManager.playChime('push_notification');
      } catch {}
      triggerPushNotification(
        'ইন্টারনেট সংযুক্ত (Connected)', 
        'আপনার ইন্টারনেট কানেকশন পুনরায় সচল হয়েছে। আপনার লাইভ আপডেট সফলভাবে সিনক্রোনাইজড হচ্ছে।', 
        ['customer', 'driver', 'kitchen', 'admin']
      );
    };

    const handleOffline = () => {
      setIsOffline(true);
      try {
        soundManager.playChime('push_notification');
      } catch {}
      triggerPushNotification(
        'ইন্টারনেট বিচ্ছিন্ন (Offline)', 
        'আপনার ইন্টারনেট কানেকশন বিচ্ছিন্ন হয়েছে! লাইভ আপডেট পেতে ইন্টারনেট সচল করুন।', 
        ['customer', 'driver', 'kitchen', 'admin']
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const checkConnectionSpeed = () => {
      if (conn) {
        const slowTypes = ['slow-2g', '2g', '3g'];
        if (slowTypes.includes(conn.effectiveType) || (conn.rtt && conn.rtt > 800)) {
          setIsSlowConnection(true);
        } else {
          setIsSlowConnection(false);
        }
      }
    };

    if (conn) {
      conn.addEventListener('change', checkConnectionSpeed);
      checkConnectionSpeed();
    }

    const interval = setInterval(() => {
      setIsOffline(!navigator.onLine);
      if (conn) {
        checkConnectionSpeed();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) {
        conn.removeEventListener('change', checkConnectionSpeed);
      }
      clearInterval(interval);
    };
  }, []);

  const orderHistory = useMemo(() => {
    const seen = new Set<string>();
    return orderHistoryState.filter(order => {
      if (!order || !order.id) return false;
      if (seen.has(order.id)) return false;
      seen.add(order.id);
      return true;
    });
  }, [orderHistoryState]);

  // Determine if the internet (real-time connection) is actively needed.
  // It is needed if we have simulated a status (for testing), if the user has an active/pending order, 
  // or if the user is in driver/kitchen/admin roles where they must see and update live orders in real-time.
  const isInternetNeeded = useMemo(() => {
    if (simulatedOffline || simulatedSlow) {
      return true;
    }
    if (role !== 'customer') {
      return true;
    }
    if (activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled') {
      return true;
    }
    const hasPending = orderHistory.some(o => o.status !== 'delivered' && o.status !== 'cancelled');
    if (hasPending) {
      return true;
    }
    return false;
  }, [activeOrder, orderHistory, role, simulatedOffline, simulatedSlow]);

  const syncOrderToFirebase = async (order: Order | null) => {
    if (!order) return;
    try {
      await setDoc(doc(db, "orders", order.id), order);
    } catch (e) {
      console.error("Firebase sync error:", e);
    }
  };

  // Keep refs for any variables used inside onSnapshot callbacks to avoid stale closures
  const roleRef = useRef(role);
  const triggerPushNotificationRef = useRef(triggerPushNotification);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    triggerPushNotificationRef.current = triggerPushNotification;
  }, [triggerPushNotification]);

  // Sync sound settings in real-time from Firestore across all apps/devices
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "settings", "sound_configs"), (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          if (remoteData && typeof remoteData === 'object') {
            soundManager.saveConfigs(remoteData as any);
          }
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn("Realtime sound config sync error:", e);
    }
  }, []);

  // Keep track of the last known statuses of orders
  const lastKnownStatusesRef = useRef<Record<string, OrderStatus>>({});
  const isInitialSnapshotRef = useRef(true);

  // Real-time Firestore sync across devices and Android app instances
  useEffect(() => {
    try {
      const q = query(collection(db, "orders"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Build the current list of all orders to keep orderHistory synchronized in real-time!
        const allOrders: Order[] = [];
        snapshot.forEach((doc) => {
          allOrders.push(doc.data() as Order);
        });
        // Sort by id descending (newest first)
        allOrders.sort((a, b) => b.id.localeCompare(a.id));
        setOrderHistory(allOrders);

        // If it's the initial snapshot (on app load/mount), we populate the last known statuses and don't notify
        if (isInitialSnapshotRef.current) {
          snapshot.forEach((doc) => {
            const o = doc.data() as Order;
            lastKnownStatusesRef.current[o.id] = o.status;
          });
          isInitialSnapshotRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          const orderData = change.doc.data() as Order;
          
          if (change.type === 'added') {
            // New order added after initial load
            const oldStatus = lastKnownStatusesRef.current[orderData.id];
            if (!oldStatus) {
              lastKnownStatusesRef.current[orderData.id] = orderData.status;
              
              // Only notify if it's a genuinely new order placed
              if (orderData.status === 'placed') {
                let soundToPlay: SoundEventKey = 'kitchen_new_order';
                if (roleRef.current === 'driver') {
                  soundToPlay = 'driver_new_order';
                } else if (roleRef.current === 'customer') {
                  soundToPlay = 'order_placed';
                }

                triggerPushNotificationRef.current(
                  `🛎️ ক্লাউড অর্ডার অ্যালার্ট: #${orderData.orderNumber}`,
                  `অন্য ডিভাইস থেকে নতুন অর্ডার এসেছে (${orderData.items.length}টি আইটেম)। গ্রাহক: ${orderData.customerName}`,
                  ['admin', 'kitchen', 'driver', 'customer'],
                  soundToPlay
                );
              }
            }
          } else if (change.type === 'modified') {
            const oldStatus = lastKnownStatusesRef.current[orderData.id];

            // ALWAYS update the activeOrder state if this order is our currently tracked active order
            setActiveOrder((current) => {
              if (current && current.id === orderData.id) {
                // If there's a new message, play a sound!
                const currentMsgsLength = current.chatMessages?.length || 0;
                const newMsgsLength = orderData.chatMessages?.length || 0;
                if (newMsgsLength > currentMsgsLength) {
                  const lastMsg = orderData.chatMessages?.[newMsgsLength - 1];
                  if (lastMsg && lastMsg.sender !== roleRef.current) {
                    try {
                      soundManager.playChime('push_notification');
                    } catch (soundError) {
                      console.warn("Could not play chat notification chime:", soundError);
                    }
                  }
                }
                return orderData;
              }
              return current;
            });
            
            if (oldStatus && oldStatus !== orderData.status) {
              // Status of an order changed!
              lastKnownStatusesRef.current[orderData.id] = orderData.status;
              
              let targets: UserRole[] = ['customer', 'admin', 'kitchen', 'driver'];

              // Determine role-appropriate sound based on status and current app role
              let statusSound: SoundEventKey = 'push_notification';
              if (orderData.status === 'placed') {
                statusSound = roleRef.current === 'driver' ? 'driver_new_order' : roleRef.current === 'kitchen' ? 'kitchen_new_order' : 'order_placed';
              } else if (orderData.status === 'confirmed' || orderData.status === 'preparing') {
                statusSound = roleRef.current === 'kitchen' ? 'kitchen_new_order' : 'push_notification';
              } else if (orderData.status === 'ready_for_pickup') {
                statusSound = roleRef.current === 'driver' ? 'driver_new_order' : 'kitchen_ready';
              } else if (orderData.status === 'on_the_way') {
                statusSound = 'driver_pickup';
              } else if (orderData.status === 'delivered') {
                statusSound = 'delivered';
              } else if (orderData.status === 'cancelled') {
                statusSound = 'cancelled';
              }

              // Translate status to Bengali beautifully
              let statusBn = orderData.status as string;
              if (orderData.status === 'placed') statusBn = 'অর্ডার গ্রহণ করা হয়েছে (Placed)';
              else if (orderData.status === 'confirmed') statusBn = 'অর্ডার নিশ্চিত করা হয়েছে (Confirmed)';
              else if (orderData.status === 'preparing') statusBn = 'খাবার প্রস্তুত হচ্ছে (Preparing)';
              else if (orderData.status === 'ready_for_pickup') statusBn = 'ডেলিভারির জন্য প্রস্তুত (Ready for Pickup)';
              else if (orderData.status === 'on_the_way') statusBn = 'রাইডার ডেলিভারির জন্য রওনা দিয়েছেন (On the Way)';
              else if (orderData.status === 'delivered') statusBn = 'খাবার সফলভাবে ডেলিভারি করা হয়েছে 🎉 (Delivered)';
              else if (orderData.status === 'cancelled') statusBn = 'দুঃখিত, অর্ডারটি বাতিল করা হয়েছে (Cancelled)';

              // Trigger push notification with the translated status and the respective sound
              triggerPushNotificationRef.current(
                `📦 অর্ডার আপডেট (#${orderData.orderNumber})`,
                `আপনার অর্ডারের বর্তমান অবস্থা: ${statusBn}`,
                targets,
                statusSound
              );
            }
          }
        });
      }, (err) => {
        console.error("Firestore snapshot error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Auto-clear customer tracking screen when order is delivered, and return to food menu
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'delivered' && role === 'customer') {
      const timer = setTimeout(() => {
        setCustomerTab('menu');
        setActiveOrder(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeOrder?.status, role]);

  // Real-time GPS Simulation State
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isSimPaused, setIsSimPaused] = useState<boolean>(false);
  const [routeProgressIdx, setRouteProgressIdx] = useState<number>(0);

  // Live Chat Messages derived from activeOrder on Firestore
  const chatMessages = useMemo(() => {
    const driverRawName = activeOrder?.driver?.name || roleProfiles.driver?.name || 'তাপিওল বান্দেগী';
    const driverCleanName = driverRawName.split('(')[0].replace(/rider/i, '').trim();

    if (activeOrder?.chatMessages && activeOrder.chatMessages.length > 0) {
      return activeOrder.chatMessages.map(msg => {
        if (msg.sender === 'driver' && (msg.text.includes('রুপম ব্যানার্জী') || msg.text.includes('রূপম ব্যানার্জী') || msg.text.includes('Rupam Banerjee'))) {
          const updatedText = msg.text
            .replace(/রুপম ব্যানার্জী/g, driverCleanName)
            .replace(/রূপম ব্যানার্জী/g, driverCleanName)
            .replace(/Rupam Banerjee/g, driverCleanName);
          return { ...msg, text: updatedText };
        }
        return msg;
      });
    }

    return [
      {
        id: 'm1',
        sender: 'driver',
        text: `নমস্কার! আমি ${driverCleanName}, আপনার ফাস্টবাইট থার্মাল ব্যাগ নিয়ে আপনার স্পেশাল খাবারের ডেলিভারিতে প্রস্তুত আছি।`,
        timestamp: '১২:৩২ PM',
      },
    ];
  }, [activeOrder?.chatMessages, activeOrder?.driver?.name, roleProfiles.driver?.name]);

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
      name: roleProfiles.driver?.name || 'তাপিওল বান্দেগী (Rider Tapiul Bandegi)',
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
    syncOrderToFirebase(demoOrder);
    setCustomerTab('tracking');
    soundManager.playChime('push_notification');
    triggerPushNotification(
      `🛎️ পার্টনার অ্যালার্ট: নতুন অর্ডার #${demoOrder.orderNumber}`,
      `রেস্তোরাঁ কিচেন ও রাইডারের কাছে নতুন অর্ডার সফলভাবে পাঠানো হয়েছে।`,
      ['admin', 'kitchen', 'driver']
    );
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
      syncOrderToFirebase(completedOrder);
      return completedOrder;
    });
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
    items: CartItem[],
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
      name: roleProfiles.driver?.name || 'তাপিওল বান্দেগী (Rider Tapiul Bandegi)',
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
      items,
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
    syncOrderToFirebase(newOrder);
    setRouteProgressIdx(0);
    setIsSimPaused(false);

    triggerPushNotification(
      `🍽️ নতুন অর্ডার প্লেস হয়েছে! (${newOrder.orderNumber})`,
      `আপনার অর্ডার সফলভাবে প্লেস করা হয়েছে। মোট মূল্য: ${formatPrice(newOrder.totalAmount, currency)}।`,
      ['customer']
    );

    triggerPushNotification(
      `🛎️ রেস্তোরাঁ ও পার্টনার অ্যালার্ট: নতুন অর্ডার #${newOrder.orderNumber}`,
      `কিচেনে নতুন অর্ডার এসেছে (${newOrder.items.length}টি আইটেম)। গ্রাহক: ${newOrder.customerName}।`,
      ['admin', 'kitchen', 'driver'],
      'kitchen_new_order'
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
      const updated = {
        ...prev,
        status: nextStatus,
        orderLogs: [...prev.orderLogs, newLog],
      };
      syncOrderToFirebase(updated);
      if (nextStatus === 'cancelled') {
        if (role === 'customer') {
          setCancelledModalOrder(updated);
        }
        setOrderHistory(h => [updated, ...h]);
        triggerPushNotification(
          `🛑 অর্ডার #${updated.orderNumber} ক্যানসেল করা হয়েছে`,
          `${logMessage}: ${detail || '১০০% রিফান্ড প্রসেস করা হয়েছে'}`,
          ['customer']
        );
      }
      return updated;
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
    if (!activeOrder) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderRole = role === 'driver' ? 'driver' : 'customer';
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      sender: senderRole,
      text,
      timestamp: nowStr,
    };

    const driverRawName = activeOrder?.driver?.name || roleProfiles.driver?.name || 'তাপিওল বান্দেগী';
    const driverCleanName = driverRawName.split('(')[0].replace(/rider/i, '').trim();

    const currentMessages = activeOrder.chatMessages || [
      {
        id: 'm1',
        sender: 'driver',
        text: `নমস্কার! আমি ${driverCleanName}, আপনার ফাস্টবাইট থার্মাল ব্যাগ নিয়ে আপনার স্পেশাল খাবারের ডেলিভারিতে প্রস্তুত আছি।`,
        timestamp: '১২:৩২ PM',
      },
    ];

    const updatedMessages = [...currentMessages, newMsg];

    setActiveOrder((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        chatMessages: updatedMessages,
      };
      syncOrderToFirebase(updated);
      return updated;
    });

    // Determine targets and sender name for push notifications
    const targetRoles: UserRole[] = role === 'driver' ? ['customer', 'admin'] : ['driver', 'admin'];
    const senderName = role === 'driver' ? 'রাইডার (Rider)' : 'গ্রাহক (Customer)';

    triggerPushNotification(
      `💬 চ্যাট মেসেজ: ${senderName}`,
      text,
      targetRoles,
      'push_notification'
    );
  };

  const t = TRANSLATIONS[lang];

  const isDriverLoggedIn = roleProfiles.driver?.isLoggedIn === true;
  const isKitchenLoggedIn = roleProfiles.kitchen?.isLoggedIn === true;
  
  let partnerAvailabilityError = '';
  if (!isDriverLoggedIn && !isKitchenLoggedIn) {
     partnerAvailabilityError = 'দুঃখিত, কোনো ডেলিভারি পার্টনার (রাইডার) এবং রেস্টুরেন্ট এই মুহূর্তে অনলাইনে লগইন নেই। অর্ডার সার্ভিস বন্ধ রয়েছে।';
  } else if (!isDriverLoggedIn) {
     partnerAvailabilityError = 'দুঃখিত, কোনো ডেলিভারি পার্টনার (রাইডার) এই মুহূর্তে অনলাইনে লগইন নেই। রাইডার ছাড়া নতুন অর্ডার গ্রহণ বন্ধ রয়েছে।';
  } else if (!isKitchenLoggedIn) {
     partnerAvailabilityError = 'দুঃখিত, রেস্টুরেন্ট কিচেন এই মুহূর্তে অফলাইনে আছে। অর্ডার গ্রহণ বন্ধ রয়েছে।';
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-orange-500 selection:text-white flex flex-col">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      {/* Top Header Navigation */}
      <Header
        role={role}
        isRoleLocked={isRoleLocked}
        onSelectRole={handleSelectRole}
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
        pushNotifications={pushNotificationsDict[role] || []}
        onClearPush={handleClearPush}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onTriggerSplash={() => setShowSplash(true)}
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

      {/* Network Connectivity Status Banner */}
      {isInternetNeeded && (isOffline || simulatedOffline || simulatedSlow) ? (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {isOffline || simulatedOffline ? (
            <div className="bg-red-950/90 border border-red-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white shadow-xl animate-bounce-subtle">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                  <WifiOff className="w-5 h-5 text-red-400 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-red-400 flex items-center gap-1.5">
                    ইন্টারনেট সংযোগ বিচ্ছিন্ন! (No Internet Connection)
                    {simulatedOffline && <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] uppercase font-bold tracking-wide">সিমুলেশন চালু</span>}
                  </div>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                    আপনার ডিভাইসটি অফলাইনে আছে। অনুগ্রহ করে আপনার ওয়াই-ফাই বা মোবাইল ডাটা চালু করুন। ইন্টারনেট ছাড়া রিয়েল-টাইম জিপিএস ও অর্ডারের আপডেট দেখা যাবে না।
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {simulatedOffline ? (
                  <button
                    onClick={() => {
                      soundManager.playChime('click');
                      setSimulatedOffline(false);
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer border border-zinc-700 shadow-sm"
                  >
                    সিমুলেশন বন্ধ করুন
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      soundManager.playChime('click');
                      setIsOffline(!navigator.onLine);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    পুনরায় চেষ্টা করুন (Retry)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white shadow-xl">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <Wifi className="w-5 h-5 text-amber-400 animate-pulse" style={{ animationDuration: '3s' }} />
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-amber-400 flex items-center gap-1.5">
                    ধীরগতির ইন্টারনেট সনাক্ত হয়েছে! (Slow Internet Speed)
                    {simulatedSlow && <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] uppercase font-bold tracking-wide">সিমুলেশন চালু</span>}
                  </div>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                    আপনার ইন্টারনেট সংযোগ দুর্বল বা ধীরগতি সম্পন্ন। লাইভ ট্র্যাকিং ম্যাপ বা অর্ডারের স্থিতি আপডেট হতে সাধারণের চেয়ে বেশি সময় লাগতে পারে।
                  </p>
                </div>
              </div>
              {simulatedSlow && (
                <div className="self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => {
                      soundManager.playChime('click');
                      setSimulatedSlow(false);
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer border border-zinc-700 shadow-sm"
                  >
                    সিমুলেশন বন্ধ করুন
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Small developer/tester connection helper when everything is online */
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 text-right">
          <div className="inline-flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-2.5 py-1 rounded-full text-[10px] text-zinc-400">
            <span className="flex h-1.5 w-1.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-zinc-300">ইন্টারনেট: সক্রিয় (Online)</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">টেস্ট করুন:</span>
            <button
              onClick={() => {
                soundManager.playChime('click');
                setSimulatedOffline(true);
              }}
              className="text-red-400/80 hover:text-red-400 hover:underline cursor-pointer font-medium"
            >
              অফলাইন
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => {
                soundManager.playChime('click');
                setSimulatedSlow(true);
              }}
              className="text-amber-400/80 hover:text-amber-400 hover:underline cursor-pointer font-medium"
            >
              ধীরগতি
            </button>
          </div>
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

              <div className="flex items-center gap-2">
                <button
                  id="btn-customer-my-order-list"
                  onClick={() => {
                    soundManager.playChime('click');
                    setIsHistoryOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-extrabold border border-zinc-700/60 transition-all shadow-sm active:scale-95"
                >
                  <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                  <span className="hidden sm:inline">আমার অর্ডার তালিকা ({orderHistory.length})</span>
                  <span className="sm:hidden">অর্ডার তালিকা ({orderHistory.length})</span>
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

                {/* Partner Offline Notice Banner */}
                {partnerAvailabilityError && (
                  <div className="bg-gradient-to-r from-red-950/90 via-red-900/60 to-zinc-900 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3 text-white shadow-xl">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>অর্ডার সার্ভিস বন্ধ (Service Unavailable)</span>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      </h4>
                      <p className="text-xs text-red-200/90 font-medium">
                        {partnerAvailabilityError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Menu Section */}
                <MenuSection
                  onSelectItem={setSelectedMenuItem}
                  lang={lang}
                  currency={currency}
                  menuItems={menuItems}
                />
              </div>
            )}

            {/* TAB 2: DEDICATED GPS LIVE TRACKING PAGE */}
            {customerTab === 'tracking' && (
              <div className="space-y-6">
                {activeOrder ? (
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
                    onCancelOrder={handleCancelOrder}
                    onViewCancelMessage={() => setCancelledModalOrder(activeOrder)}
                    onClearActiveOrder={() => {
                      setActiveOrder(null);
                      setCustomerTab('menu');
                    }}
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

                    <div className="flex justify-center items-center pt-2">
                      <button
                        onClick={() => {
                          soundManager.playChime('click');
                          setCustomerTab('menu');
                        }}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Utensils className="w-4 h-4 text-orange-200" />
                        <span>মেনু দেখুন (View Menu)</span>
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

        {/* Partner Login Gate */}
        {role !== 'customer' && role !== 'admin' && !currentUser?.isLoggedIn ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-5">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center text-zinc-400">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">অ্যাক্সেস সংরক্ষিত</h2>
              <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                {role === 'driver' ? 'রাইডার' : role === 'kitchen' ? 'কিচেন' : 'এডমিন'} প্যানেল দেখতে আপনাকে প্রথমে লগইন করতে হবে।
              </p>
            </div>
            <button
              onClick={() => {
                soundManager.playChime('click');
                setIsAuthOpen(true);
              }}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-orange-900/20"
            >
              লগইন করুন
            </button>
          </div>
        ) : (
          <>
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
                onMasterReset={handleMasterReset}
                onOpenApkModal={() => setIsApkModalOpen(true)}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500 space-y-2">
        <div className="flex items-center justify-center gap-2 text-zinc-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>ফাস্টবাইট এক্সপ্রেস - ভারত ফাস্টফুড প্ল্যাটফর্ম</span>
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
        lang={lang}
        currency={currency}
        onPlaceOrder={(cartItem) => {
          setSelectedMenuItem(null);
          handleCheckout(
            [cartItem],
            cartItem.itemTotalPrice,
            0.50, // Delivery Fee
            0.0, // Tip
            0.0, // Discount
            selectedAddress
          );
        }}
        isPartnerOffline={partnerAvailabilityError !== ''}
        offlineReason={partnerAvailabilityError}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
      />

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        driver={activeOrder?.driver || DEFAULT_DRIVER}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
        activeRole={role}
        customerName={activeOrder?.customerName}
        customerPhone={activeOrder?.customerPhone}
      />

      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orderHistory={orderHistory}
        onTrackOrder={(ord) => {
          setActiveOrder(ord);
          setRole('customer');
          setCustomerTab('tracking');
          setIsHistoryOpen(false);
        }}
        onReorder={(ord) => {
          if (ord.items.length > 0) {
            setSelectedMenuItem(ord.items[0].menuItem);
          }
        }}
        onViewCancelledOrder={(ord) => {
          setCancelledModalOrder(ord);
        }}
        onClearHistory={handleClearOrderHistory}
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

      <CancelledOrderModal
        order={cancelledModalOrder}
        isOpen={!!cancelledModalOrder}
        onClose={() => setCancelledModalOrder(null)}
        onReorder={(ord) => {
          setCancelledModalOrder(null);
          if (ord.items.length > 0) {
            setSelectedMenuItem(ord.items[0].menuItem);
          }
        }}
        onOk={() => {
          setCancelledModalOrder(null);
          setActiveOrder(null);
          setCustomerTab('menu');
        }}
        currency={currency}
      />

      <ApkBuildModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        activeRole={role}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLoginUser}
        onLogout={handleLogoutUser}
        targetRole={role}
        isRoleLocked={isRoleLocked}
        lang={lang}
        onSelectLang={setLang}
        currency={currency}
        onSelectCurrency={setCurrency}
        activeOrder={activeOrder}
        onCancelOrder={handleCancelOrder}
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

    </div>
  );
}
