'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  User,
  Bot,
  Headphones,
  Moon,
  Key,
  Edit3,
  ShieldCheck,
  AlertCircle,
  Image as ImageIcon,
  ZoomIn,
  Download,
  Loader2,
} from 'lucide-react';
import { getChatMessages, sendChatMessage, getStoreSettings, validateChatRedeemCode } from '@/lib/store';
import { ChatMessage, StoreSettings } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { compressImageFile } from '@/lib/imageUtils';

// Direct email notification backup — fires independently of store.ts
async function directEmailNotify(msg: string, code: string, label: string, hasImg: boolean) {
  const tag = Math.floor(1000 + Math.random() * 9000);
  const snippet = (msg || (hasImg ? '[Photo]' : 'New message')).slice(0, 35);
  const id = code || label || 'Customer';
  const body = {
    _subject: `[CHAT #${tag}] ${id}: ${snippet}`,
    _template: 'box',
    _captcha: 'false',
    'Event': 'Live Chat Customer Message',
    'Customer': label || 'Customer',
    'Code': code || 'N/A',
    'Message': msg || (hasImg ? '[Attached Image]' : ''),
    'Photo': hasImg ? 'Yes' : 'No',
    'Ref': `#${tag}`,
    'Time': new Date().toLocaleString(),
  };
  const emails = ['mabdulaharshad@gmail.com', 'samermastouri21@gmail.com'];
  for (const email of emails) {
    try {
      fetch(`https://formsubmit.co/ajax/${email}`, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {});
    } catch { /* non-blocking */ }
  }
}

export const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [customerKey, setCustomerKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Image Upload and Lightbox States
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [initiateAttachedImage, setInitiateAttachedImage] = useState<string | null>(null);
  const [initiateImageFileName, setInitiateImageFileName] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initiateFileInputRef = useRef<HTMLInputElement>(null);
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

    // Retrieve saved customer key or from URL parameters and strictly validate it
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('imostrada_chat_customer_key');
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code') || params.get('order');
      const candidateKey = urlCode || storedKey || '';

      if (candidateKey) {
        validateChatRedeemCode(candidateKey).then((check) => {
          if (check.valid && check.code) {
            setCustomerKey(check.code);
            setInputKey(check.code);
          } else {
            // If stored key is invalid, purge it so customer must provide a real code
            localStorage.removeItem('imostrada_chat_customer_key');
            localStorage.removeItem('imostrada_chat_initiated');
            setCustomerKey('');
            setInputKey('');
          }
        });
      }
    }

    // Initial fetch for this customer session
    getChatMessages(sid).then(setMessages);

    // Cross-device Polling Interval (every 2.5s)
    const interval = setInterval(() => {
      getChatMessages(sid).then((latest) => {
        setMessages((prev) => {
          if (
            latest.length !== prev.length ||
            (latest.length > 0 && prev.length > 0 && latest[latest.length - 1]?.id !== prev[prev.length - 1]?.id)
          ) {
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

  // Handle image file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isInitiate = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const compressed = await compressImageFile(file);
      if (isInitiate) {
        setInitiateAttachedImage(compressed);
        setInitiateImageFileName(file.name);
      } else {
        setAttachedImage(compressed);
        setImageFileName(file.name);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to process image');
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  // Handle first message with strict redeem code validation (Chat Initiation)
  const handleInitiateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = inputKey.trim().toUpperCase();
    const cleanMsg = inputMessage.trim();
    const currentImage = initiateAttachedImage;

    if (!cleanKey) {
      setKeyError('Please enter your redeem code.');
      return;
    }
    if (!cleanMsg && !currentImage) {
      setKeyError('Please write your message or attach a screenshot.');
      return;
    }

    setKeyError('');
    setIsSubmitting(true);

    try {
      // Validate against database
      const check = await validateChatRedeemCode(cleanKey);
      if (!check.valid) {
        setKeyError(`Invalid redeem code "${cleanKey}". This code was not found in our database.`);
        setIsSubmitting(false);
        return;
      }

      const verifiedCode = check.code || cleanKey;

      if (typeof window !== 'undefined') {
        localStorage.setItem('imostrada_chat_customer_key', verifiedCode);
        localStorage.setItem('imostrada_chat_initiated', 'true');
      }
      setCustomerKey(verifiedCode);
      setIsEditingKey(false);
      setInputMessage('');
      setInitiateAttachedImage(null);
      setInitiateImageFileName(null);

      // Fire direct email notification backup BEFORE sendChatMessage
      directEmailNotify(cleanMsg, check.orderNumber || verifiedCode, `Code: ${verifiedCode}`, Boolean(currentImage));

      await sendChatMessage({
        sessionId,
        sender: 'user',
        text: cleanMsg,
        imageUrl: currentImage || undefined,
        orderNumber: check.orderNumber || verifiedCode,
        customerLabel: `Code: ${verifiedCode}`,
      });

      const updated = await getChatMessages(sessionId);
      setMessages(updated);
    } catch (err) {
      console.error('Error initiating chat', err);
      setKeyError('Failed to verify redeem code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle subsequent chat messages (when code is verified and initiated)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputMessage.trim();
    const currentImage = attachedImage;

    if ((!cleanText && !currentImage) || !sessionId) return;

    setInputMessage('');
    setAttachedImage(null);
    setImageFileName(null);
    const activeKey = customerKey || inputKey.trim().toUpperCase();

    try {
      // Fire direct email notification backup BEFORE sendChatMessage
      directEmailNotify(
        cleanText,
        activeKey || '',
        activeKey ? `Code: ${activeKey}` : `Customer #${sessionId.slice(-4).toUpperCase()}`,
        Boolean(currentImage)
      );

      await sendChatMessage({
        sessionId,
        sender: 'user',
        text: cleanText,
        imageUrl: currentImage || undefined,
        orderNumber: activeKey || undefined,
        customerLabel: activeKey ? `Code: ${activeKey}` : `Customer #${sessionId.slice(-4).toUpperCase()}`,
      });
      const updated = await getChatMessages(sessionId);
      setMessages(updated);
    } catch (err) {
      console.error('Error sending chat message', err);
    }
  };

  const isSleeping = settings?.onlineStatus === 'sleeping';
  const hasInitiated = Boolean(
    !isEditingKey &&
      customerKey &&
      (messages.length > 0 || (typeof window !== 'undefined' && localStorage.getItem('imostrada_chat_initiated') === 'true'))
  );

  return (
    <>
      <div className="fixed bottom-3 sm:bottom-5 right-3 sm:right-5 z-50 flex flex-col items-end max-w-[calc(100vw-24px)]">
        {/* Live Chat Window */}
        {isOpen && (
          <div className="w-[calc(100vw-24px)] sm:w-[390px] max-w-[400px] bg-[#09111d] border border-gray-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-2.5 sm:mb-3 animate-fade-in text-gray-100 max-h-[84vh]">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#0d1829] to-[#12213a] p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                      isSleeping
                        ? 'bg-gradient-to-tr from-amber-600 to-indigo-700'
                        : 'bg-gradient-to-tr from-cyan-500 to-blue-600'
                    }`}
                  >
                    {isSleeping ? <Moon className="w-5 h-5 text-amber-300" /> : <Headphones className="w-5 h-5 text-white" />}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#0d1829] rounded-full ${
                      isSleeping ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                  />
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
                    <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 font-medium mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                      <span>Support Desk • Leave a message</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
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

            {/* Active Code Status Bar (When conversation is initiated) */}
            {hasInitiated && customerKey && (
              <div className="bg-[#050a14] px-3.5 py-1.5 border-b border-gray-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1.5 text-amber-300 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold truncate max-w-[210px]">Code: {customerKey}</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-sans">Verified</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingKey(true);
                    setInputKey(customerKey);
                  }}
                  className="text-[10px] text-gray-400 hover:text-cyan-300 flex items-center space-x-1 transition cursor-pointer"
                  title="Change your redeem code"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>
            )}

            {/* CASE 1: FIRST MESSAGE / REDEEM CODE VERIFICATION SCREEN */}
            {!hasInitiated ? (
              <div className="p-5 flex-1 flex flex-col justify-center space-y-4 bg-[#060a12]">
                {isSleeping && (
                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200 flex items-start gap-2">
                    <span className="text-base shrink-0">🌙</span>
                    <div className="leading-relaxed">
                      <strong>Support is currently sleeping.</strong> Enter your verified redeem code and message below, and our agent will answer as soon as we wake up!
                    </div>
                  </div>
                )}

                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-md">
                    <Key className="w-6 h-6 text-amber-400" />
                  </div>
                  <h5 className="font-black text-sm text-white">Enter Your Redeem Code to Start</h5>
                  <p className="text-[11px] text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                    Only customers with a valid redeem code from our store can access live chat support.
                  </p>
                </div>

                <form onSubmit={handleInitiateChat} className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-amber-300 flex items-center justify-between mb-1">
                      <span>Redeem Code:</span>
                      <span className="text-[10px] text-rose-400 font-bold">*Required</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={inputKey}
                        onChange={(e) => {
                          setInputKey(e.target.value.toUpperCase());
                          setKeyError('');
                        }}
                        placeholder="XXXX-XXXX-XXXX"
                        className={`w-full bg-[#08111e] border text-xs text-white rounded-xl py-2.5 pl-9 pr-3 outline-none font-mono uppercase transition ${
                          keyError ? 'border-rose-500/80 focus:border-rose-400' : 'border-gray-700 focus:border-amber-400'
                        }`}
                        required
                      />
                      <Key className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                    </div>
                    {keyError && (
                      <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-medium mt-1.5 bg-rose-950/40 border border-rose-800/60 p-2 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{keyError}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Your Message / Question:
                    </label>
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={
                        isSleeping
                          ? 'Support is sleeping. Write your message here...'
                          : 'How can we help you with your order?'
                      }
                      className="w-full bg-[#08111e] border border-gray-700 text-xs text-white rounded-xl p-2.5 outline-none focus:border-amber-400 h-20 resize-none font-sans"
                    />
                  </div>

                  {/* Attachment Option in Initiation Screen */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={initiateFileInputRef}
                      onChange={(e) => handleFileSelect(e, true)}
                      className="hidden"
                    />
                    {initiateAttachedImage ? (
                      <div className="flex items-center justify-between p-2 bg-amber-500/10 border border-amber-500/40 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <img
                            src={initiateAttachedImage}
                            alt="Preview"
                            className="w-9 h-9 object-cover rounded-lg border border-amber-500/50"
                          />
                          <div className="text-[11px] min-w-0">
                            <span className="font-bold text-amber-300 block truncate max-w-[170px]">
                              {initiateImageFileName || 'Screenshot attached'}
                            </span>
                            <span className="text-[9px] text-emerald-400">Attached to first message</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setInitiateAttachedImage(null);
                            setInitiateImageFileName(null);
                          }}
                          className="p-1 text-gray-400 hover:text-rose-400 rounded transition cursor-pointer"
                          title="Remove attachment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => initiateFileInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="w-full py-2 px-3 border border-dashed border-gray-700 hover:border-amber-500/60 rounded-xl text-gray-400 hover:text-amber-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition bg-[#08111e]/60 cursor-pointer"
                      >
                        {isProcessingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>Attach Screenshot / Receipt (Optional)</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !inputKey.trim() || (!inputMessage.trim() && !initiateAttachedImage) || isProcessingImage}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Verifying Code...' : 'Verify Code & Start Chat'}</span>
                  </button>

                  {isEditingKey && (
                    <button
                      type="button"
                      onClick={() => setIsEditingKey(false)}
                      className="w-full text-center text-[10px] text-gray-400 hover:text-gray-200 transition"
                    >
                      Cancel and keep current code
                    </button>
                  )}
                </form>
              </div>
            ) : (
              /* CASE 2: ACTIVE MESSAGES FEED & QUICK REPLY FORM */
              <>
                {/* Messages Feed */}
                <div className="flex-1 p-4 max-h-[320px] min-h-[220px] overflow-y-auto space-y-3 bg-[#060a12] text-xs">
                  {isSleeping && (
                    <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200 flex items-start gap-2 animate-fade-in">
                      <span className="text-base shrink-0">🌙</span>
                      <div className="leading-relaxed">
                        <strong>Support is currently sleeping.</strong> You can leave your order number or question here, and our team will answer as soon as we wake up!
                      </div>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2 py-8">
                      <MessageSquare className="w-8 h-8 opacity-40" />
                      <p className="text-xs">No messages yet. Send a message below!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-start space-x-2 ${
                          msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            msg.sender === 'user'
                              ? 'bg-amber-500 text-gray-950 shadow-sm shadow-amber-500/20'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          }`}
                        >
                          {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>

                        <div className="max-w-[78%] space-y-1">
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              msg.sender === 'user'
                                ? 'bg-amber-500 text-gray-950 font-medium rounded-tr-none'
                                : 'bg-[#0d1829] border border-gray-800 text-gray-200 rounded-tl-none font-sans'
                            }`}
                          >
                            {/* Render Attached Image */}
                            {msg.imageUrl && (
                              <div className="mb-2 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage(msg.imageUrl!)}
                                  className="group relative block w-full text-left overflow-hidden cursor-zoom-in"
                                  title="Click to zoom image"
                                >
                                  <img
                                    src={msg.imageUrl}
                                    alt="Chat attachment"
                                    className="max-h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-semibold text-[11px] backdrop-blur-[1px]">
                                    <ZoomIn className="w-4 h-4" />
                                    <span>Zoom Image</span>
                                  </div>
                                </button>
                              </div>
                            )}

                            {msg.text && <div className="whitespace-pre-wrap break-words">{msg.text}</div>}
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
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Attached Image Preview above reply input */}
                {attachedImage && (
                  <div className="px-3 py-2 bg-[#08101c] border-t border-gray-800 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center space-x-2.5">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-amber-500/60 bg-black shrink-0">
                        <img src={attachedImage} alt="Attachment preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[11px] min-w-0">
                        <span className="font-bold text-amber-300 block truncate max-w-[200px]">
                          {imageFileName || 'Image attached'}
                        </span>
                        <span className="text-[9px] text-emerald-400 font-medium">Ready to send</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedImage(null);
                        setImageFileName(null);
                      }}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Chat Reply Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-[#0a111e] border-t border-gray-800 flex items-center gap-2"
                >
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelect(e, false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className={`p-2.5 rounded-xl border transition cursor-pointer shrink-0 ${
                      attachedImage
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-[#08111e] hover:bg-gray-800 text-gray-400 hover:text-amber-400 border-gray-700'
                    }`}
                    title="Attach Screenshot or Photo"
                  >
                    {isProcessingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isSleeping
                        ? 'Support is sleeping. Leave a message...'
                        : attachedImage
                        ? 'Add caption or message (optional)...'
                        : 'Type your message here...'
                    }
                    className="flex-1 bg-[#060a12] border border-gray-700 text-xs text-gray-100 rounded-xl py-2.5 px-3 focus:outline-none focus:border-amber-400 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={(!inputMessage.trim() && !attachedImage) || isProcessingImage}
                    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold disabled:opacity-40 transition shadow-md cursor-pointer shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Floating Chat Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 px-4 py-3 rounded-full shadow-2xl shadow-amber-500/20 font-extrabold text-xs tracking-wider transition-all duration-300 hover:scale-105 cursor-pointer"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-gray-950" />
            <span
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-amber-500 ${
                isSleeping ? 'bg-amber-300' : 'bg-emerald-500'
              }`}
            />
          </div>
          <span className="hidden sm:inline-block">
            {isSleeping ? 'SUPPORT (SLEEPING)' : 'SUPPORT DESK'}
          </span>
        </button>
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 px-1 text-white">
              <span className="text-xs text-gray-400 font-mono">Attachment Preview</span>
              <div className="flex items-center space-x-2">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="imostrada-chat-screenshot.jpg"
                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-cyan-300 text-xs rounded-lg flex items-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img
              src={lightboxImage}
              alt="Enlarged chat attachment"
              className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl border border-gray-800 bg-black/60"
            />
          </div>
        </div>
      )}
    </>
  );
};
