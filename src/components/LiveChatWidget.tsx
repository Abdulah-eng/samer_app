'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Headphones, Moon } from 'lucide-react';
import { getChatMessages, sendChatMessage, getStoreSettings } from '@/lib/store';
import { ChatMessage, StoreSettings } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Load store settings
    getStoreSettings().then(setSettings);

    // Persistent customer session ID
    let sid = typeof window !== 'undefined' ? localStorage.getItem('imostrada_chat_session_id') : null;
    if (!sid) {
      sid = 'cust_' + Math.random().toString(36).substring(2, 10);
      if (typeof window !== 'undefined') {
        localStorage.setItem('imostrada_chat_session_id', sid);
      }
    }
    setSessionId(sid);

    // Initial fetch for this customer session
    getChatMessages(sid).then(setMessages);

    // Cross-device Polling Interval (every 2.5s)
    const interval = setInterval(() => {
      getChatMessages(sid).then((latest) => {
        setMessages((prev) => {
          if (latest.length !== prev.length || (latest.length > 0 && prev.length > 0 && latest[latest.length - 1]?.id !== prev[prev.length - 1]?.id)) {
            return latest;
          }
          return prev;
        });
      });
      getStoreSettings().then(setSettings);
    }, 2500);

    // Supabase Realtime channel
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        channel = supabase
          .channel(`customer_chat_${sid}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
            getChatMessages(sid).then(setMessages);
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription error', err);
      }
    }

    // Event listener for chat updates
    const handleChatUpdate = (e: any) => {
      const updatedMsg = e?.detail;
      if (!updatedMsg || updatedMsg.sessionId === sid || updatedMsg.sessionId === 'general') {
        getChatMessages(sid).then(setMessages);
      }
    };

    // Event listener to open chat from any button on page
    const handleOpenChat = () => {
      setIsOpen(true);
    };

    window.addEventListener('imostrada_chat_update', handleChatUpdate);
    window.addEventListener('imostrada_open_chat', handleOpenChat);

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('imostrada_chat_update', handleChatUpdate);
      window.removeEventListener('imostrada_open_chat', handleOpenChat);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputMessage.trim();
    if (!cleanText || !sessionId) return;

    setInputMessage('');

    // Check if on order page or topup page with order # or code
    let activeOrderParam: string | undefined;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      activeOrderParam = params.get('code') || params.get('order') || undefined;
    }

    try {
      await sendChatMessage({
        sessionId,
        sender: 'user',
        text: cleanText,
        orderNumber: activeOrderParam,
        customerLabel: activeOrderParam ? `Code: ${activeOrderParam}` : `Customer #${sessionId.slice(-4).toUpperCase()}`,
      });
      const updated = await getChatMessages(sessionId);
      setMessages(updated);
    } catch (err) {
      console.error('Error sending chat message', err);
    }
  };

  const isSleeping = settings?.onlineStatus === 'sleeping';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Live Chat Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] bg-[#09111d] border border-gray-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-fade-in text-gray-100">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-[#0d1829] to-[#12213a] p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                  isSleeping ? 'bg-gradient-to-tr from-amber-600 to-indigo-700' : 'bg-gradient-to-tr from-cyan-500 to-blue-600'
                }`}>
                  {isSleeping ? <Moon className="w-5 h-5 text-amber-300" /> : <Headphones className="w-5 h-5 text-white" />}
                </div>
                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#0d1829] rounded-full ${
                  isSleeping ? 'bg-amber-400' : 'bg-emerald-500'
                }`} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white leading-tight">
                  {settings?.storeName || 'IMOSTRADA'} Live Support
                </h4>
                {isSleeping ? (
                  <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 font-semibold mt-0.5">
                    <span>🌙 Currently Sleeping • Back soon</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-semibold mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>Agent Online • Typically replies in 5m</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Connect Actions */}
          <div className="bg-[#070e1a] px-3 py-2 border-b border-gray-800/80 flex items-center justify-around text-[11px] font-semibold text-gray-300">
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 hover:text-emerald-400 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>WhatsApp Live</span>
            </a>
            <span className="text-gray-700">•</span>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 hover:text-cyan-400 transition"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span>Telegram Support</span>
            </a>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 max-h-[300px] min-h-[220px] overflow-y-auto space-y-3 bg-[#060a12] text-xs">
            {isSleeping && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200 flex items-start gap-2 animate-fade-in">
                <span className="text-base shrink-0">🌙</span>
                <div className="leading-relaxed">
                  <strong>Support is currently sleeping.</strong> You can leave your order number or question here, and our team will answer as soon as we wake up!
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 ${
                  msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-gray-950'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[75%] space-y-1`}>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-gray-950 font-medium rounded-tr-none'
                        : 'bg-[#0d1829] border border-gray-800 text-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div
                    className={`text-[9px] text-gray-500 px-1 ${
                      msg.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#0a111e] border-t border-gray-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isSleeping ? "Support is sleeping. Leave a message..." : "Type your message here..."}
              className="flex-1 bg-[#060a12] border border-gray-700 text-xs text-gray-100 rounded-xl py-2.5 px-3 focus:outline-none focus:border-amber-400 font-sans"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold disabled:opacity-40 transition shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 px-4 py-3 rounded-full shadow-2xl shadow-amber-500/20 font-extrabold text-xs tracking-wider transition-all duration-300 hover:scale-105 cursor-pointer"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 text-gray-950" />
          <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-amber-500 ${
            isSleeping ? 'bg-amber-300' : 'bg-emerald-500'
          }`} />
        </div>
        <span className="hidden sm:inline-block">
          {isSleeping ? 'LIVE CHAT (SLEEPING)' : 'LIVE CHAT SUPPORT'}
        </span>
      </button>
    </div>
  );
};
