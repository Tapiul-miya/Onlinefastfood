import React, { useState } from 'react';
import { Share2, X, Copy, Check, QrCode, Globe, ExternalLink, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
}

type ShareableRole = 'customer' | 'kitchen' | 'driver';

interface RoleConfig {
  title: string;
  subtitle: string;
  defaultFirebaseDomain: string;
  badge: string;
  icon: string;
}

const ROLE_INFO: Record<ShareableRole, RoleConfig> = {
  customer: {
    title: 'Customer Food Ordering App',
    subtitle: 'Customer menu, food ordering, cart & live order tracking',
    defaultFirebaseDomain: 'https://fastbite-customer.web.app',
    badge: 'Customer App',
    icon: '🍔',
  },
  kitchen: {
    title: 'Kitchen Order Display (KDS)',
    subtitle: 'Kitchen staff app for live order tickets & cooking status',
    defaultFirebaseDomain: 'https://fastbite-kitchen.web.app',
    badge: 'Kitchen Display',
    icon: '👨‍🍳',
  },
  driver: {
    title: 'Rider / Delivery Partner App',
    subtitle: 'Rider GPS navigation, order pickup & live drop-off portal',
    defaultFirebaseDomain: 'https://fastbite-rider.web.app',
    badge: 'Rider Portal',
    icon: '🛵',
  },
};

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose, currentRole }) => {
  // If current role is admin, admin can switch between all 3 operational apps (customer, kitchen, driver)
  // For other 3 apps (customer, kitchen, driver), only customer app is shareable
  const isAdmin = currentRole === 'admin';
  const initialRole: ShareableRole = (isAdmin && (currentRole === 'kitchen' || currentRole === 'driver')) 
    ? (currentRole as ShareableRole) 
    : 'customer';

  const [selectedRole, setSelectedRole] = useState<ShareableRole>(initialRole);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // For non-admin apps, force selected role to always be 'customer'
  const activeRole: ShareableRole = isAdmin ? selectedRole : 'customer';
  const targetInfo = ROLE_INFO[activeRole];
  const appUrl = targetInfo.defaultFirebaseDomain;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(appUrl)}&margin=10`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(appUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = appUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FastBite - ${targetInfo.title}`,
          text: `Open FastBite ${targetInfo.badge}: ${targetInfo.subtitle} at ${appUrl}`,
          url: appUrl,
        });
      } catch {
        console.log('User cancelled share');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs text-white text-xl flex items-center justify-center">
              {targetInfo.icon}
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white inline-block mb-1">
                {targetInfo.badge}
              </span>
              <h3 className="text-lg font-bold leading-tight">
                {isAdmin ? 'Share Apps & QR Codes' : 'Share Customer App'}
              </h3>
            </div>
          </div>
        </div>

        {/* Tab switcher: ONLY visible for Admin */}
        {isAdmin ? (
          <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                Admin Panel: Select App to Share
              </label>
              <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                3 Operational Sites
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-200/80 rounded-xl">
              {(['customer', 'kitchen', 'driver'] as ShareableRole[]).map((r) => {
                const isActive = activeRole === r;
                const info = ROLE_INFO[r];
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRole(r);
                      setCopied(false);
                    }}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all truncate flex flex-col items-center gap-0.5 ${
                      isActive 
                        ? 'bg-white text-gray-900 shadow-xs' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-sm">{info.icon}</span>
                    <span className="capitalize">{r === 'driver' ? 'Rider' : r}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-5 py-3 bg-orange-50/60 border-b border-orange-100 flex items-center gap-2 text-xs text-orange-800">
            <span className="text-base">🍔</span>
            <p className="font-medium">
              Share FastBite ordering app link & QR code with customers!
            </p>
          </div>
        )}

        {/* Body content */}
        <div className="p-5 space-y-4">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
            <div className="relative p-2 bg-white rounded-xl shadow-xs border border-gray-100">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-44 h-44 object-contain rounded-lg"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-black/10 rounded-lg">
                <QrCode className="w-8 h-8 text-gray-800" />
              </div>
            </div>
            <p className="mt-2.5 text-xs text-gray-600 font-semibold text-center flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-orange-500" />
              Scan with phone to open {targetInfo.badge}
            </p>
          </div>

          {/* Direct Link Input */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              Direct Live URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded-xl text-gray-800 focus:outline-hidden select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Link
            </button>

            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
