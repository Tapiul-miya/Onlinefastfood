import { UserRole } from '../types';

export interface AppConfig {
  role: UserRole;
  appNameEn: string;
  appNameBn: string;
  appId: string;
  version: string;
  versionCode: number;
  primaryColor: string;
  secondaryColor: string;
  gradient: string;
  iconSymbol: string;
  iconBgClass: string;
  iconDataUri: string;
  descriptionEn: string;
  descriptionBn: string;
  capacitorConfig: {
    appId: string;
    appName: string;
    webDir: string;
    server: {
      androidScheme: string;
    };
    android: {
      allowMixedContent: boolean;
      backgroundColor: string;
    };
  };
}

export const APP_CONFIGS: Record<UserRole, AppConfig> = {
  customer: {
    role: 'customer',
    appNameEn: 'FastBite Food Delivery',
    appNameBn: 'ফাস্টবাইট ফুড ডেলিভারি',
    appId: 'com.fastbite.customer.app',
    version: '1.0.0',
    versionCode: 100,
    primaryColor: '#f97316',
    secondaryColor: '#f59e0b',
    gradient: 'from-orange-500 to-amber-500',
    iconSymbol: '🍔',
    iconBgClass: 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white',
    iconDataUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="22" fill="%23f97316"/><text x="50" y="65" font-size="50" text-anchor="middle">🍔</text></svg>',
    descriptionEn: 'Customer app for ordering food and live GPS delivery tracking.',
    descriptionBn: 'খাবার অর্ডার দেওয়া এবং রিয়েল-টাইম জিপিএস ট্র্যাকিংয়ের কাস্টমার অ্যাপ।',
    capacitorConfig: {
      appId: 'com.fastbite.customer.app',
      appName: 'FastBite Food Delivery',
      webDir: 'dist',
      server: { androidScheme: 'https' },
      android: { allowMixedContent: true, backgroundColor: '#09090b' }
    }
  },
  kitchen: {
    role: 'kitchen',
    appNameEn: 'FastBite Kitchen KDS',
    appNameBn: 'ফাস্টবাইট কিচেন কেডিএস',
    appId: 'com.fastbite.kitchen.kds',
    version: '1.0.0',
    versionCode: 100,
    primaryColor: '#e11d48',
    secondaryColor: '#f97316',
    gradient: 'from-rose-600 to-orange-600',
    iconSymbol: '🍳',
    iconBgClass: 'bg-gradient-to-tr from-rose-600 to-orange-500 text-white',
    iconDataUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="22" fill="%23e11d48"/><text x="50" y="65" font-size="50" text-anchor="middle">🍳</text></svg>',
    descriptionEn: 'Restaurant Kitchen Display System for managing food prep tickets.',
    descriptionBn: 'রেস্তোরাঁর কিচেন টিকিট ও অর্ডার প্রিপারেশন ম্যানেজমেন্ট অ্যাপ।',
    capacitorConfig: {
      appId: 'com.fastbite.kitchen.kds',
      appName: 'FastBite Kitchen KDS',
      webDir: 'dist',
      server: { androidScheme: 'https' },
      android: { allowMixedContent: true, backgroundColor: '#09090b' }
    }
  },
  driver: {
    role: 'driver',
    appNameEn: 'FastBite Rider Partner',
    appNameBn: 'ফাস্টবাইট রাইডার পার্টনার',
    appId: 'com.fastbite.rider.partner',
    version: '1.0.0',
    versionCode: 100,
    primaryColor: '#10b981',
    secondaryColor: '#f59e0b',
    gradient: 'from-emerald-600 to-amber-600',
    iconSymbol: '🛵',
    iconBgClass: 'bg-gradient-to-tr from-emerald-600 to-amber-500 text-white',
    iconDataUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="22" fill="%2310b981"/><text x="50" y="65" font-size="50" text-anchor="middle">🛵</text></svg>',
    descriptionEn: 'Delivery rider app for receiving order trips and turn-by-turn navigation.',
    descriptionBn: 'রাইডারদের জন্য অর্ডার একসেপ্ট এবং লাইভ রোড নেভিগেশন অ্যাপ।',
    capacitorConfig: {
      appId: 'com.fastbite.rider.partner',
      appName: 'FastBite Rider Partner',
      webDir: 'dist',
      server: { androidScheme: 'https' },
      android: { allowMixedContent: true, backgroundColor: '#09090b' }
    }
  },
  admin: {
    role: 'admin',
    appNameEn: 'FastBite Super Manager',
    appNameBn: 'ফাস্টবাইট সুপার এডমিন',
    appId: 'com.fastbite.admin.manager',
    version: '1.0.0',
    versionCode: 100,
    primaryColor: '#6366f1',
    secondaryColor: '#a855f7',
    gradient: 'from-indigo-600 to-purple-600',
    iconSymbol: '🛡️',
    iconBgClass: 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white',
    iconDataUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="22" fill="%236366f1"/><text x="50" y="65" font-size="50" text-anchor="middle">🛡️</text></svg>',
    descriptionEn: 'Super Admin app for store oversight, menu edits, and system configuration.',
    descriptionBn: 'সুপার এডমিন ও ম্যানেজারদের জন্য সমস্ত কন্ট্রোল এবং মেনু ম্যানেজমেন্ট অ্যাপ।',
    capacitorConfig: {
      appId: 'com.fastbite.admin.manager',
      appName: 'FastBite Super Manager',
      webDir: 'dist',
      server: { androidScheme: 'https' },
      android: { allowMixedContent: true, backgroundColor: '#09090b' }
    }
  }
};

/**
 * Dynamically updates document title and favicon based on selected role
 */
export function updateAppTitleAndIcon(role: UserRole) {
  const config = APP_CONFIGS[role];
  if (!config) return;

  // Update HTML Document Title
  document.title = `${config.appNameBn} (${config.appNameEn})`;

  // Update Favicon Link
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'shortcut icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = config.iconDataUri;
}
