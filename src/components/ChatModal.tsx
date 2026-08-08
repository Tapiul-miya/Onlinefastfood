import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Phone, Bike, Sparkles, MessageSquare } from 'lucide-react';
import { Driver, ChatMessage, UserRole } from '../types';
import { soundManager } from '../utils/audio';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  activeRole?: UserRole;
  customerName?: string;
  customerPhone?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  driver,
  messages,
  onSendMessage,
  activeRole = 'customer',
  customerName = 'গ্রাহক',
  customerPhone = '',
}) => {
  if (!isOpen) return null;

  const [input, setInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDriverView = activeRole === 'driver';

  // Contextual quick-reply preset chips based on role
  const PRESET_CHIPS = isDriverView
    ? [
        'আমি খাবার নিয়ে রওনা হয়েছি 🛵',
        'রাস্তায় অনেক জ্যাম, একটু দেরি হতে পারে 🚦',
        'আমি আপনার গেটে আছি, একটু বাইরে আসুন 🚪',
        'দয়া করে আমাকে কল করুন 📞',
        'ডেলিভারি সম্পন্ন হয়েছে, ধন্যবাদ! 🎉',
      ]
    : [
        'তাড়াতাড়ি আসবেন প্লিজ, ক্ষুধা লেগেছে! ⚡',
        'গেটের সিকিউরিটির কাছে রেখে দিন 👮',
        'কলিং বেল বাজাবেন না, দরজায় নক করুন 🔔',
        'ঠিকানায় পৌঁছাতে কোনো সমস্যা হচ্ছে? 📍',
        'অনেক ধন্যবাদ ভাই! 👍',
      ];

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;
    soundManager.playChime('click');
    onSendMessage(text);
    if (!textToSend) setInput('');
  };

  const chatPartnerName = isDriverView ? customerName : driver.name;
  const chatPartnerPhoto = isDriverView 
    ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" 
    : driver.photo;
  const chatPartnerSubtitle = isDriverView
    ? "ফাস্টবাইট সম্মানিত গ্রাহক (Customer)"
    : `রাইডার • ${driver.vehicleType === 'bike' ? 'মোটরসাইকেল' : 'বাইসাইকেল'} (${driver.vehiclePlate})`;
  const chatPartnerPhone = isDriverView ? customerPhone : driver.phone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[560px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={chatPartnerPhoto}
                alt={chatPartnerName}
                className="w-11 h-11 rounded-full object-cover border-2 border-orange-500"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <span>{chatPartnerName}</span>
                {!isDriverView && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded">
                    ★ {driver.rating}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">
                {chatPartnerSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {chatPartnerPhone && (
              <a
                href={`tel:${chatPartnerPhone}`}
                onClick={() => soundManager.playChime('click')}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 transition-colors border border-zinc-700/60"
                title={isDriverView ? "Call Customer" : "Call Driver"}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            <button
              id="btn-close-chat"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/40">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-zinc-600" />
              <p>কোনো মেসেজ নেই। {chatPartnerName}-কে মেসেজ পাঠান!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender === activeRole;
              return (
                <div
                  key={`${msg.id || 'msg'}_${idx}`}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-orange-600 text-white rounded-br-none shadow-md animate-scale-up'
                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-bl-none animate-scale-up'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <p className={`text-[9px] mt-1 text-right font-mono ${isMe ? 'text-orange-200' : 'text-zinc-500'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Presets */}
        <div className="px-4 py-2 bg-zinc-950/80 border-t border-zinc-800/60 overflow-x-auto flex gap-1.5 scrollbar-none">
          {PRESET_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-[11px] rounded-lg whitespace-nowrap transition-colors border border-zinc-700/50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isDriverView ? "গ্রাহককে মেসেজ পাঠান..." : "রাইডারকে মেসেজ পাঠান..."}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button
            id="btn-send-chat"
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-30 disabled:hover:bg-orange-600 transition-colors shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
