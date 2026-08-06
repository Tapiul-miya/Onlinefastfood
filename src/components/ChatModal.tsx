import React, { useState } from 'react';
import { X, Send, Phone, Bike, Sparkles, MessageSquare } from 'lucide-react';
import { Driver, ChatMessage } from '../types';
import { soundManager } from '../utils/audio';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  driver,
  messages,
  onSendMessage,
}) => {
  if (!isOpen) return null;

  const [input, setInput] = useState<string>('');

  const PRESET_CHIPS = [
    'Leave order at front doorstep 🚪',
    'Gate code is #1234 🔑',
    'I am waiting in the building lobby 🏢',
    'Ring the doorbell when you arrive 🔔',
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;
    soundManager.playChime('click');
    onSendMessage(text);
    if (!textToSend) setInput('');
  };

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
                src={driver.photo}
                alt={driver.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-orange-500"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <span>{driver.name}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded">
                  ★ {driver.rating}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Courier • {driver.vehicleType} ({driver.vehiclePlate})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${driver.phone}`}
              onClick={() => soundManager.playChime('click')}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 transition-colors border border-zinc-700/60"
              title="Call Driver"
            >
              <Phone className="w-4 h-4" />
            </a>
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
              <p>No messages yet. Send a note to courier {driver.name}!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender === 'customer';
              return (
                <div
                  key={`${msg.id || 'msg'}_${idx}`}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-orange-600 text-white rounded-br-none shadow-md'
                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-[9px] mt-1 text-right font-mono ${isMe ? 'text-orange-200' : 'text-zinc-500'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            })
          )}
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
            placeholder="Type message to courier..."
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
