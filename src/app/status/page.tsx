'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TermsModal } from '@/components/TermsModal';
import { LiveChatWidget } from '@/components/LiveChatWidget';
import { getStoreSettings, getOrderDetails, submitTopUpRequest, sendChatMessage } from '@/lib/store';
import { StoreSettings, Order } from '@/lib/types';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Mail,
  Lock,
  FileText,
  Key,
  ExternalLink,
  Coins,
  MessageSquare,
  ShoppingCart,
  Send,
  Grid,
  AlertCircle,
  Edit3,
  Package,
  ShieldAlert,
} from 'lucide-react';

function OrderStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams?.get('code') || '';

  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'IMOSTRADA',
    merchantName: 'imostrada',
    isOnline: true,
    noticeText:
      'Delivery time starts after the redeem request is submitted. Products are delivered between 1 hour to 24 hours.',
  });

  const [searchQuery, setSearchQuery] = useState(initialCode);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Top-Up Form State (for embedded form)
  const [isEditingTopUp, setIsEditingTopUp] = useState(false);
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formPlatform, setFormPlatform] = useState<'GAMIVO' | 'G2A' | 'Driffle' | 'Other'>('GAMIVO');
  const [formAccountEmail, setFormAccountEmail] = useState('');
  const [formAccountPassword, setFormAccountPassword] = useState('');
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    getStoreSettings().then(setSettings);
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleSearch = async (queryToSearch?: string) => {
    const query = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!query) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await getOrderDetails(query);
      setOrder(data);
      if (data) {
        // Initialize Top-Up Form state if applicable
        setFormOrderNumber(data.topUpOrderNumber || '');
        setFormPlatform((data.topUpPlatform as any) || 'GAMIVO');
        setFormAccountEmail(data.topUpAccountEmail || '');
        setFormAccountPassword(data.topUpAccountPassword || '');
        setFormNotes(data.topUpNotes || '');
        // If it's a top-up product and customer has NOT submitted email yet, show the form!
        const isTopUp =
          data.deliveryType === 'topup' ||
          (data.productName || '').toLowerCase().includes('top') ||
          (data.productName || '').toLowerCase().includes('v-bucks') ||
          (data.productName || '').toLowerCase().includes('coins');

        if (isTopUp && !data.topUpAccountEmail) {
          setIsEditingTopUp(true);
        } else {
          setIsEditingTopUp(false);
        }
      }
    } catch (e) {
      console.error('Error fetching order', e);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setFormError('');

    if (!formOrderNumber.trim()) {
      setFormError('Please enter your marketplace order number (e.g. #123456).');
      return;
    }
    if (!formAccountEmail.trim()) {
      setFormError('Please enter your account email.');
      return;
    }
    if (!formAccountPassword.trim()) {
      setFormError('Please enter your account password.');
      return;
    }

    setFormSubmitting(true);
    try {
      const updated = await submitTopUpRequest(order.id, {
        topUpOrderNumber: formOrderNumber.trim(),
        topUpPlatform: formPlatform,
        topUpAccountEmail: formAccountEmail.trim(),
        topUpAccountPassword: formAccountPassword.trim(),
        topUpNotes: formNotes.trim() || undefined,
      });

      setOrder(updated);
      setIsEditingTopUp(false);

      // Notify in chat
      try {
        const sid = typeof window !== 'undefined' ? localStorage.getItem('imostrada_chat_session_id') || undefined : undefined;
        await sendChatMessage({
          sessionId: sid,
          sender: 'user',
          text: `[Top-Up Information Submitted] Order #${formOrderNumber.trim()} on ${formPlatform} for ${order.productName}. Email: ${formAccountEmail.trim()}`,
          orderNumber: formOrderNumber.trim(),
          customerLabel: `Order #${formOrderNumber.trim()}`,
        });
      } catch {
        // non-blocking
      }

      // Automatically open Live Chat to guide user
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('imostrada_open_chat'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting top-up request.';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenLiveChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('imostrada_open_chat'));
    }
    const chatBtn = document.querySelector('button[class*="LIVE CHAT SUPPORT"]') as HTMLButtonElement;
    if (chatBtn) chatBtn.click();
  };

  // Robust check to determine if this order is a Top-Up Service
  const isTopUpOrder = Boolean(
    order &&
      (order.deliveryType === 'topup' ||
        (order.productName || '').toLowerCase().includes('top') ||
        (order.productName || '').toLowerCase().includes('v-bucks') ||
        (order.productName || '').toLowerCase().includes('coins') ||
        (order.productName || '').toLowerCase().includes('points') ||
        order.topUpAccountEmail ||
        order.topUpOrderNumber)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#060a12] text-gray-100 font-sans selection:bg-amber-400 selection:text-black">
      <Header settings={settings} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-2">
            Check Order Status
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Enter your Redeem Code or Order ID below to check live delivery status
          </p>
        </div>

        {/* Search Box */}
        <div className="w-full max-w-xl bg-[#09111d] border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-2xl mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="e.g. GAMIVO-XBOX-9981 or ORD-98241"
                className="w-full bg-[#07101e] border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-cyan-300 font-mono text-sm sm:text-base rounded-xl py-3 pl-10 pr-4 outline-none transition uppercase"
              />
              <Search className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-xl text-gray-950 font-bold text-sm uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
              style={{ background: 'linear-gradient(90deg, #facc15, #f59e0b)' }}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-gray-950" /> : <span>Search Order</span>}
            </button>
          </form>
        </div>

        {/* Search Results Display */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="text-sm text-gray-400">Retrieving order status...</span>
          </div>
        )}

        {!loading && searched && !order && (
          <div className="w-full max-w-xl bg-rose-950/40 border border-rose-500/40 rounded-2xl p-6 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-rose-300">No Order Found</h3>
            <p className="text-xs text-gray-300">
              We couldn't find an order matching <span className="font-mono text-amber-300 font-bold">{searchQuery}</span>.
              Please verify your redeem code and ensure it was submitted on the home page.
            </p>
          </div>
        )}

        {!loading && order && (
          <div className="w-full max-w-2xl bg-[#09111d] border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            {/* Header / Order Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-800 gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4">
                {order.productImageUrl ? (
                  <img
                    src={order.productImageUrl}
                    alt={order.productName}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-amber-400/30 bg-black shrink-0 shadow-lg shadow-amber-500/10"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-gray-800 flex items-center justify-center text-amber-400 shrink-0">
                    <Package className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
                    Order Details
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">{order.productName}</h3>
                  <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1 font-mono">
                    <span>Order #: <strong className="text-amber-400">{order.orderNumber}</strong></span>
                    <span>•</span>
                    <span>Code: <strong className="text-cyan-400">{order.code}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {order.status === 'processing' && (
                  <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Processing</span>
                  </div>
                )}

                {order.status === 'completed' && (
                  <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================== */}
            {/* OPTION A: TOP-UP SERVICE WORKFLOW (Shows form if not submitted) */}
            {/* ============================================================== */}
            {isTopUpOrder ? (
              <div className="space-y-6">
                {/* 1. If customer needs to fill or edit the form: SHOW FORM! */}
                {isEditingTopUp || !order.topUpAccountEmail ? (
                  <div className="bg-[#07101e] border-2 border-amber-500/50 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl animate-fade-in">
                    {/* Stepper matching Screenshot 2 */}
                    <div className="flex items-center justify-between text-xs font-semibold pb-4 border-b border-gray-800">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center font-bold text-[10px]">
                          ✓
                        </div>
                        <span>Redeem Code</span>
                      </div>
                      <div className="flex-1 h-0.5 mx-3 bg-gradient-to-r from-emerald-500 to-amber-500" />
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-gray-950 flex items-center justify-center font-extrabold text-[10px]">
                          2
                        </div>
                        <span className="font-bold">Fill Information</span>
                      </div>
                      <div className="flex-1 h-0.5 mx-3 bg-gray-800" />
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <div className="w-5 h-5 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center font-bold text-[10px]">
                          3
                        </div>
                        <span>Submit Request</span>
                      </div>
                    </div>

                    {/* Form Title */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
                        <Coins className="w-4 h-4" />
                        <span>TOP UP REQUEST</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                        Complete Your <span className="text-amber-400">Top Up Request</span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Please fill in the required information below so we can complete your top up as soon as possible.
                      </p>
                    </div>

                    {formError && (
                      <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3.5 text-xs text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Interactive Form */}
                    <form onSubmit={handleSubmitTopUp} className="space-y-4 text-xs">
                      {/* Product */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 block mb-1">Product</label>
                        <div className="bg-[#050912] border border-gray-800 rounded-xl p-3 sm:p-3.5 flex items-center gap-3">
                          {order.productImageUrl ? (
                            <img
                              src={order.productImageUrl}
                              alt={order.productName}
                              className="w-12 h-12 rounded-lg object-cover border border-amber-400/30 bg-black shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-gray-800 flex items-center justify-center text-amber-400 shrink-0">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              TOP-UP SERVICE
                            </span>
                            <div className="text-xs sm:text-sm font-bold text-amber-400 truncate">
                              {order.productName}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 1: Order # and Platform */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                            Order Number <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formOrderNumber}
                              onChange={(e) => setFormOrderNumber(e.target.value)}
                              placeholder="Enter your order number (e.g. #123456)"
                              className="w-full bg-[#050912] border border-gray-700 focus:border-amber-400 text-xs text-white rounded-xl py-3 pl-10 pr-3 outline-none transition"
                              required
                            />
                            <ShoppingCart className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                            Platform Purchased From <span className="text-rose-400">*</span>
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['GAMIVO', 'G2A', 'Driffle', 'Other'] as const).map((plat) => (
                              <button
                                key={plat}
                                type="button"
                                onClick={() => setFormPlatform(plat)}
                                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                                  formPlatform === plat
                                    ? 'border-amber-400 bg-[#16150e]'
                                    : 'border-gray-800 bg-[#050912] text-gray-400 hover:border-gray-700'
                                }`}
                              >
                                <span className={`text-[10px] font-bold ${
                                  plat === 'GAMIVO' ? 'text-[#ff8000]' : plat === 'G2A' ? 'text-[#00a8ff]' : plat === 'Driffle' ? 'text-purple-400' : 'text-gray-300'
                                }`}>
                                  {plat}
                                </span>
                                <div
                                  className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                                    formPlatform === plat ? 'border-amber-400 bg-amber-400' : 'border-gray-600'
                                  }`}
                                >
                                  {formPlatform === plat && <div className="w-1 h-1 rounded-full bg-gray-950" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Supported Platforms Banner */}
                      <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#040810] p-2 sm:p-2.5 space-y-1">
                        <span className="text-[11px] font-semibold text-gray-400 px-1 block">
                          Platform Account (Email of the platform account you use):
                        </span>
                        <div className="w-full rounded-lg overflow-hidden border border-gray-800/80 bg-black/40 p-1 flex items-center justify-center">
                          <img
                            src="/platform-logos.png"
                            alt="Supported Platforms"
                            className="w-full max-h-12 sm:max-h-14 object-contain"
                          />
                        </div>
                      </div>

                      {/* Row 2: Account Email & Password */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                            Account Email <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={formAccountEmail}
                              onChange={(e) => setFormAccountEmail(e.target.value)}
                              placeholder="Enter your account email"
                              className="w-full bg-[#050912] border border-gray-700 focus:border-amber-400 text-xs text-cyan-300 rounded-xl py-3 pl-10 pr-3 outline-none transition font-sans"
                              required
                            />
                            <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                            Account Password <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={formShowPassword ? 'text' : 'password'}
                              value={formAccountPassword}
                              onChange={(e) => setFormAccountPassword(e.target.value)}
                              placeholder="Enter your account password"
                              className="w-full bg-[#050912] border border-gray-700 focus:border-amber-400 text-xs text-amber-300 rounded-xl py-3 pl-10 pr-10 outline-none transition font-mono"
                              required
                            />
                            <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                            <button
                              type="button"
                              onClick={() => setFormShowPassword(!formShowPassword)}
                              className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition cursor-pointer"
                            >
                              {formShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2FA Warning / Notice */}
                      <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
                        <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-bold text-amber-300">Fast Delivery Requirement:</div>
                          <p className="text-amber-200/90 leading-relaxed font-medium">
                            To ensure the fastest possible top-up, please temporarily disable 2FA on your platform account during this time.
                          </p>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                          Additional Information (Optional)
                        </label>
                        <div className="relative">
                          <textarea
                            value={formNotes}
                            onChange={(e) => {
                              if (e.target.value.length <= 500) setFormNotes(e.target.value);
                            }}
                            rows={2}
                            placeholder="Any additional details that may help us process your top up request."
                            className="w-full bg-[#050912] border border-gray-700 focus:border-amber-400 text-xs text-gray-200 rounded-xl py-2.5 pl-10 pr-3 outline-none transition font-sans"
                          />
                          <MessageSquare className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                          <span className="absolute right-3 bottom-2.5 text-[10px] text-gray-500 font-mono">
                            {formNotes.length}/500
                          </span>
                        </div>
                      </div>

                      {/* Alert Box */}
                      <div className="bg-[#0b1b30] border border-cyan-500/30 rounded-xl p-3.5 flex items-start gap-3 text-cyan-200">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">Next Step: Contact Live Chat</h4>
                          <p className="text-[11px] text-cyan-200/80 leading-relaxed">
                            After submitting this form, please contact our Live Chat immediately to confirm your top up.
                          </p>
                        </div>
                      </div>

                      {/* Submit button */}
                      <div className="flex gap-2 pt-2">
                        {order.topUpAccountEmail && (
                          <button
                            type="button"
                            onClick={() => setIsEditingTopUp(false)}
                            className="py-3 px-5 rounded-xl bg-gray-800 text-gray-300 font-semibold transition hover:bg-gray-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={formSubmitting}
                          className="flex-1 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-4 h-4 text-gray-950" />
                          <span>{formSubmitting ? 'Submitting Request...' : 'SUBMIT REQUEST →'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* 2. Customer has already submitted information: SHOW SUBMITTED SUMMARY! */
                  <div className="bg-[#07101e] border-2 border-amber-500/50 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
                      <div className="flex items-center space-x-2">
                        <Coins className="w-5 h-5 text-amber-400" />
                        <h3 className="text-xl font-black tracking-wider text-amber-400 uppercase">
                          TOP-UP REQUEST
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingTopUp(true)}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-cyan-300 px-3 py-1 rounded-lg border border-gray-700 flex items-center gap-1 cursor-pointer transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                            order.status === 'completed'
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                              : 'border-amber-500/40 bg-amber-500/10 text-amber-400 animate-pulse'
                          }`}
                        >
                          {order.status === 'completed' ? 'Completed' : 'Processing'}
                        </span>
                      </div>
                    </div>

                    {/* Submitted Details Card */}
                    <div className="bg-[#09111d] border border-gray-800 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-3.5 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 pb-2.5 border-b border-gray-800/80">
                        <span className="text-gray-400 font-semibold shrink-0">Service Product:</span>
                        <span className="font-bold text-white text-xs sm:text-sm break-words">{order.productName}</span>
                      </div>

                      {order.topUpOrderNumber && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 pb-2.5 border-b border-gray-800/80">
                          <span className="text-gray-400 font-semibold shrink-0">Order Number:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm whitespace-nowrap">
                              {order.topUpOrderNumber}
                            </span>
                            <button
                              onClick={() => copyToClipboard(order.topUpOrderNumber!, 'orderNo')}
                              className="p-1 text-gray-400 hover:text-white cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {order.topUpPlatform && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 pb-2.5 border-b border-gray-800/80">
                          <span className="text-gray-400 font-semibold shrink-0">Platform Purchased From:</span>
                          <span className="font-bold text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-800/60 w-fit">
                            {order.topUpPlatform}
                          </span>
                        </div>
                      )}

                      {order.topUpAccountEmail && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 pb-2.5 border-b border-gray-800/80">
                          <span className="text-gray-400 font-semibold shrink-0 whitespace-nowrap">Account Email:</span>
                          <div className="flex items-center justify-between sm:justify-end gap-2 bg-[#050b14] sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-gray-800/60 sm:border-0 min-w-0 max-w-full">
                            <span className="font-mono text-cyan-300 font-semibold whitespace-nowrap overflow-x-auto select-all text-xs sm:text-sm py-0.5 scrollbar-none min-w-0">
                              {order.topUpAccountEmail}
                            </span>
                            <button
                              onClick={() => copyToClipboard(order.topUpAccountEmail!, 'topup-email')}
                              className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-semibold border border-gray-700 shrink-0 cursor-pointer active:scale-95"
                            >
                              {copiedField === 'topup-email' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      )}

                      {order.topUpAccountPassword && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 pb-2.5 border-b border-gray-800/80">
                          <span className="text-gray-400 font-semibold shrink-0 whitespace-nowrap">Account Password:</span>
                          <div className="flex items-center justify-between sm:justify-end gap-2 bg-[#050b14] sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-gray-800/60 sm:border-0 min-w-0 max-w-full">
                            <span className="font-mono text-amber-300 font-semibold whitespace-nowrap overflow-x-auto select-all text-xs sm:text-sm py-0.5 tracking-wider scrollbar-none min-w-0">
                              {showPassword ? order.topUpAccountPassword : '••••••••••••'}
                            </span>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] border border-gray-700 cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => copyToClipboard(order.topUpAccountPassword!, 'topup-pass')}
                                className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-semibold border border-gray-700 shrink-0 cursor-pointer active:scale-95"
                              >
                                {copiedField === 'topup-pass' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {order.topUpNotes && (
                        <div className="pt-1">
                          <span className="text-gray-400 font-semibold block mb-1">Additional Notes:</span>
                          <div className="bg-[#050912] p-3 rounded-lg border border-gray-800 text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {order.topUpNotes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Alert to contact Live Chat immediately */}
                    {order.status === 'processing' && (
                      <div className="bg-[#081a2e] border-2 border-cyan-500/50 rounded-xl p-5 space-y-3 shadow-lg">
                        <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                          <MessageSquare className="w-5 h-5 text-cyan-400 shrink-0" />
                          <span>Next Step: Contact Live Chat</span>
                        </div>
                        <p className="text-xs sm:text-sm text-cyan-200/90 leading-relaxed">
                          Your top-up request has been registered in our queue. <strong>Please contact our Live Chat immediately</strong> to confirm your top-up details and let the agent begin processing your account.
                        </p>
                        <div className="pt-2 flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={handleOpenLiveChat}
                            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-gray-950" />
                            <span>Open Live Chat Now</span>
                          </button>
                          <button
                            onClick={() => setIsEditingTopUp(true)}
                            className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold text-xs flex items-center justify-center space-x-1.5 border border-gray-700 transition cursor-pointer"
                          >
                            <span>Edit Submitted Information</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Completed State */}
                    {order.status === 'completed' && (
                      <div className="bg-[#061e12] border-2 border-emerald-500/50 rounded-xl p-5 space-y-3">
                        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>Top-Up Successfully Completed!</span>
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                          Our fulfillment team has completed your top-up request. Please open your game or console to verify your added currency/items.
                        </p>
                        {order.instructions && (
                          <div className="bg-[#04120a] p-3.5 rounded-lg border border-emerald-900/60 text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {order.instructions}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Review Box */}
                    <div className="bg-gradient-to-r from-emerald-950/40 via-[#071424] to-cyan-950/40 border border-emerald-500/40 rounded-xl p-5 text-xs text-gray-200 space-y-2 shadow-lg">
                      <div className="font-bold text-amber-400 text-sm">
                        🎁 Thank You for Your Purchase! ❤️
                      </div>
                      <p className="text-gray-300 leading-relaxed font-medium">
                        We truly appreciate your trust and support! 🙏
                      </p>
                      <p className="text-gray-300 leading-relaxed font-medium">
                        If you are satisfied with your top-up order, we would be very grateful if you could leave us a positive review ⭐ on the platform where you purchased from.
                      </p>
                      <p className="text-emerald-400 font-bold leading-relaxed pt-1">
                        Your feedback means a lot to us and helps us grow and continue providing the best service! 💚
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ============================================================== */
              /* OPTION B: STANDARD ACCOUNT / KEY ORDER WORKFLOW                */
              /* ============================================================== */
              <div className="space-y-6">
                {/* STATUS: PROCESSING SCREEN (Account & Key Orders ONLY) */}
                {order.status === 'processing' && (
                  <div className="bg-[#07101e] border border-amber-500/30 rounded-xl p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                      <Clock className="w-8 h-8 animate-spin" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-amber-400">Order is being processed</h4>
                      <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-md mx-auto">
                        Our merchant team is manually setting up your digital product.
                      </p>
                    </div>

                    <div className="pt-4 max-w-md mx-auto text-left space-y-3">
                      <div className="flex items-center space-x-3 text-xs">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-gray-950 flex items-center justify-center font-bold text-[10px]">
                          ✓
                        </div>
                        <span className="text-gray-300">Code Verified & Order Placed</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs">
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-gray-950 flex items-center justify-center font-bold text-[10px] animate-pulse">
                          2
                        </div>
                        <span className="text-amber-400 font-semibold">Preparation In Progress</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs opacity-40">
                        <div className="w-5 h-5 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center font-bold text-[10px]">
                          3
                        </div>
                        <span className="text-gray-400">Credentials / Key Delivered</span>
                      </div>
                    </div>

                    <div className="pt-4 text-[11px] text-gray-400 border-t border-gray-800">
                      ⏱ Expected turnaround time: <strong>1 hour to 24 hours</strong>. You can bookmark or refresh this page anytime.
                    </div>

                    <button
                      onClick={() => handleSearch()}
                      className="inline-flex items-center space-x-2 text-xs bg-gray-800 hover:bg-gray-700 text-cyan-300 px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Status</span>
                    </button>
                  </div>
                )}

                {/* COMPLETED: ACCOUNT CREDENTIALS DELIVERY */}
                {order.status === 'completed' && order.deliveryType === 'account' && (
                  <div className="bg-[#07101e] border-2 border-emerald-500/50 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
                      <h3 className="text-xl font-black tracking-wider text-emerald-400 uppercase">
                        CREDENTIALS
                      </h3>
                      <span className="text-xs font-bold text-emerald-400 border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 rounded-full uppercase tracking-wider">
                        Delivery
                      </span>
                    </div>

                    {/* Account Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span>ACCOUNT EMAIL</span>
                      </label>
                      <div className="flex items-center bg-[#0b1626] border border-gray-700/80 rounded-xl p-3 sm:p-3.5 font-mono text-xs sm:text-sm text-cyan-300 justify-between gap-2 overflow-hidden">
                        <span className="select-all font-semibold whitespace-nowrap overflow-x-auto scrollbar-none min-w-0 flex-1 py-0.5">
                          {order.accountEmail || 'gamer.delivery.acc99@outlook.com'}
                        </span>
                        <button
                          onClick={() => order.accountEmail && copyToClipboard(order.accountEmail, 'email')}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold border border-gray-700 shrink-0 cursor-pointer active:scale-95"
                        >
                          {copiedField === 'email' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Account Password */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-cyan-400" />
                        <span>ACCOUNT PASSWORD</span>
                      </label>
                      <div className="flex items-center bg-[#0b1626] border border-gray-700/80 rounded-xl p-3 sm:p-3.5 font-mono text-xs sm:text-sm text-amber-300 justify-between gap-2 overflow-hidden">
                        <span className="select-all font-bold tracking-widest whitespace-nowrap overflow-x-auto scrollbar-none min-w-0 flex-1 py-0.5">
                          {showPassword ? order.accountPassword : '••••••••••••'}
                        </span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition border border-gray-700 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => order.accountPassword && copyToClipboard(order.accountPassword, 'pass')}
                            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold border border-gray-700 cursor-pointer active:scale-95"
                          >
                            {copiedField === 'pass' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2FA Key */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>2FA KEY</span>
                      </label>
                      <div className="flex items-center bg-[#0b1626] border border-gray-700/80 rounded-xl p-3 sm:p-3.5 font-mono text-xs sm:text-sm text-cyan-400 justify-between gap-2 overflow-hidden">
                        <span className="select-all font-semibold tracking-wider break-all min-w-0 flex-1">
                          {order.twoFactorKey || 'JBSWY3DPEHPK3PXP'}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order.twoFactorKey || 'JBSWY3DPEHPK3PXP', '2fa')}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold border border-gray-700 shrink-0 cursor-pointer"
                        >
                          {copiedField === '2fa' ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <div className="bg-[#181305] border border-amber-500/40 rounded-xl p-4 text-xs text-amber-300 space-y-1">
                        <div className="flex items-center space-x-2 font-bold text-amber-400 text-sm">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Important Note:</span>
                        </div>
                        <p className="text-amber-200/90 pl-6 leading-relaxed">
                          Add this 2FA key to <strong>Google Authenticator</strong> or any authenticator app or use this website:
                        </p>
                        <div className="pl-6 pt-1">
                          <a
                            href="https://2fa.co.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 text-cyan-400 hover:text-cyan-300 underline font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>https://2fa.co.com/</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>LOGIN INSTRUCTIONS & NOTES</span>
                      </label>
                      <div className="bg-[#040810] p-4 sm:p-5 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                        {order.instructions ||
                          '1. Open console or app.\n2. Add new account using the credentials above.\n3. Verify with 2FA key if required.\n4. Enjoy gaming!'}
                      </div>
                    </div>

                    {/* Review Box */}
                    <div className="bg-gradient-to-r from-emerald-950/40 via-[#071424] to-cyan-950/40 border border-emerald-500/40 rounded-xl p-5 text-xs text-gray-200 space-y-2 shadow-lg">
                      <div className="font-bold text-amber-400 text-sm">
                        🎁 Thank You for Your Purchase! ❤️
                      </div>
                      <p className="text-gray-300 leading-relaxed font-medium">
                        We truly appreciate your trust and support! 🙏
                      </p>
                      <p className="text-gray-300 leading-relaxed font-medium">
                        If you are satisfied with your order, we would be very grateful if you could leave us a positive review ⭐ on the platform where you purchased from.
                      </p>
                    </div>
                  </div>
                )}

                {/* COMPLETED: PRODUCT KEY DELIVERY */}
                {order.status === 'completed' && order.deliveryType === 'key' && (
                  <div className="bg-[#07101e] border-2 border-emerald-500/50 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
                      <h3 className="text-xl font-black tracking-wider text-emerald-400 uppercase">
                        PRODUCT KEY
                      </h3>
                      <span className="text-xs font-bold text-emerald-400 border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 rounded-full uppercase tracking-wider">
                        Delivery
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                        <Key className="w-4 h-4 text-emerald-400" />
                        <span>PRODUCT KEY</span>
                      </label>
                      <div className="flex items-center bg-[#0b1626] border border-gray-700/80 rounded-xl p-3.5 sm:p-4 font-mono text-base sm:text-lg text-cyan-300 justify-between gap-2">
                        <span className="select-all font-bold tracking-widest">
                          {order.productKey || 'JBSWY3DPEHPK3PXP'}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order.productKey || 'JBSWY3DPEHPK3PXP', 'key')}
                          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white transition flex items-center space-x-2 text-xs font-bold border border-gray-700 shrink-0 cursor-pointer"
                        >
                          {copiedField === 'key' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {order.instructions && (
                      <div className="bg-[#040810] p-4 rounded-xl border border-gray-800 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {order.instructions}
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-emerald-950/40 via-[#071424] to-cyan-950/40 border border-emerald-500/40 rounded-xl p-5 text-xs text-gray-200 space-y-2 shadow-lg">
                      <div className="font-bold text-amber-400 text-sm">
                        🎁 Thank You for Your Purchase! ❤️
                      </div>
                      <p className="text-gray-300 leading-relaxed font-medium">
                        We truly appreciate your trust and support! 🙏
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <Footer onOpenTerms={() => setIsTermsOpen(true)} />
      <LiveChatWidget />
    </div>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060a12] flex items-center justify-center text-amber-400 text-sm">
          Loading Order Status...
        </div>
      }
    >
      <OrderStatusContent />
    </Suspense>
  );
}
