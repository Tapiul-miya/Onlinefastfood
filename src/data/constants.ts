import { Driver, GeoPoint } from '../types';

export const INITIAL_RESTAURANT = {
  name: "ফাস্টবাইট এক্সপ্রেস কলকাতা (FastBite Express Kolkata HQ)",
  address: "৭৭ পার্ক স্ট্রিট, পার্ক স্ট্রিট মোড়, কলকাতা ৭০০০১৬ (77 Park Street, Kolkata)",
  phone: "+91 98300-11223 / +91 98310-99482",
  location: { lat: 22.5539, lng: 88.3524 } as GeoPoint,
};

export const INITIAL_CUSTOMER_LOCATION: GeoPoint = {
  lat: 22.5726,
  lng: 88.4331,
  address: "সল্টলেক সেক্টর ৫, ইলেকট্রনিক্স কমপ্লেক্স, কলকাতা (Salt Lake Sector V, Kolkata)",
};

export const REGIONAL_PRESET_LOCATIONS: { name: string; address: string; geo: GeoPoint }[] = [
  {
    name: 'কলকাতা - সল্টলেক',
    address: 'সল্টলেক সেক্টর ৫, ইলেকট্রনিক্স কমপ্লেক্স, কলকাতা (Sector 5, Salt Lake)',
    geo: { lat: 22.5726, lng: 88.4331 },
  },
  {
    name: 'কলকাতা - পার্ক স্ট্রিট',
    address: '৭৭ পার্ক স্ট্রিট, কলকাতা ৭০০০১৬ (77 Park St, Kolkata)',
    geo: { lat: 22.5539, lng: 88.3524 },
  },
  {
    name: 'কলকাতা - নিউ টাউন',
    address: 'নিউ টাউন অ্যাকশন এরিয়া ১, কলকাতা (New Town Action Area 1, Kolkata)',
    geo: { lat: 22.5855, lng: 88.4720 },
  },
  {
    name: 'কলকাতা - হাওড়া',
    address: 'হাওড়া স্টেশন রোড, মল্লিক ফটক, হাওড়া (Howrah Station Rd, Howrah)',
    geo: { lat: 22.5830, lng: 88.3426 },
  },
  {
    name: 'শিলিগুড়ি - হিল কার্ট রোড',
    address: 'হিল কার্ট রোড, এয়ার ভিউ মোড়, শিলিগুড়ি (Hill Cart Rd, Siliguri)',
    geo: { lat: 26.7161, lng: 88.4236 },
  },
];

export const DEFAULT_DRIVER: Driver = {
  id: 'drv_01',
  name: 'তাপিওল বান্দেগী (Rider Tapiul Bandegi)',
  phone: '+91 98310-99482',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
  vehicleType: 'bike',
  vehiclePlate: 'WB-02-AK-4819',
  rating: 4.95,
  tripsCompleted: 1840,
  batteryLevel: 94,
};

export const INITIAL_DRIVERS_LIST: Driver[] = [
  DEFAULT_DRIVER,
  {
    id: 'drv_02',
    name: 'সুব্রত দাস (Subrata Das)',
    phone: '+91 98300-22119',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    vehicleType: 'scooter',
    vehiclePlate: 'WB-06-BM-7712',
    rating: 4.88,
    tripsCompleted: 1210,
    batteryLevel: 88,
  },
  {
    id: 'drv_03',
    name: 'অমিতাভ চট্টোপাধ্যায় (Amitabha)',
    phone: '+91 98366-55443',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    vehicleType: 'bike',
    vehiclePlate: 'WB-04-CR-9910',
    rating: 4.92,
    tripsCompleted: 1530,
    batteryLevel: 91,
  },
];

export const SAMPLE_ROUTE_COORDINATES: GeoPoint[] = [
  { lat: 22.5539, lng: 88.3524 }, // Park Street HQ
  { lat: 22.5580, lng: 88.3700 }, // Sealdah CIT Road
  { lat: 22.5630, lng: 88.3900 }, // E.M. Bypass
  { lat: 22.5680, lng: 88.4100 }, // Chingrighata / Nicco Park
  { lat: 22.5710, lng: 88.4250 }, // Wipro Circle Salt Lake
  { lat: 22.5726, lng: 88.4331 }, // Salt Lake Sec V Customer
];

export const INITIAL_PRESET_LOGS = [
  {
    id: 'l1',
    timestamp: '১২:৩০:১০ PM',
    status: 'placed' as const,
    message: 'অর্ডার #FD-8921 পার্ক স্ট্রিট কিচেনে রিসিভ হয়েছে',
    detail: 'পেমেন্ট ভেরিফাইড (UPI/GPay/COD)',
    actor: 'system' as const,
  },
  {
    id: 'l2',
    timestamp: '১২:৩১:৪৫ PM',
    status: 'confirmed' as const,
    message: 'শেফ অর্ডারটি কনফার্ম করেছেন',
    detail: 'আনুমানিক প্রস্তুতির সময়: ১০ মিনিট',
    actor: 'kitchen' as const,
  },
  {
    id: 'l3',
    timestamp: '১২:৩৩:০২ PM',
    status: 'preparing' as const,
    message: 'কলকাতা বিরিয়ানি ও রোল প্যাক করা হচ্ছে',
    detail: 'ইনসুলেটেড থার্মাল ব্যাগে প্যাকড সম্পন্ন',
    actor: 'kitchen' as const,
  },
];
