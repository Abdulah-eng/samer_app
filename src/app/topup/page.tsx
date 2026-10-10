'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Coins,
  CheckCircle2,
  FileText,
  ShoppingCart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  Key,
  ShieldCheck,
  Clock,
  Headphones,
  Send,
  AlertCircle,
  HelpCircle,
  Grid,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TermsModal } from '@/components/TermsModal';
import { LiveChatWidget } from '@/components/LiveChatWidget';
import {
  getOrderDetails,
  submitTopUpRequest,
  getStoreSettings,
  verifyAndRedeemCode,
  sendChatMessage,
} from '@/lib/store';
import { StoreSettings, Order } from '@/lib/types';

function TopUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code') || '';

  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'IMOSTRADA',
    merchantName: 'imostrada',
    isOnline: true,
    noticeText: 'Digital products are delivered between 1 hour to 24 hours.',
  });

  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  // Form Fields
  const [code, setCode] = useState(codeParam);
  const [productName, setProductName] = useState('Fortnite 800 V-Bucks Top Up');
  const [orderNumber, setOrderNumber] = useState('');
  const [platform, setPlatform] = useState<'GAMIVO' | 'G2A' | 'Driffle' | 'Other'>('GAMIVO');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getStoreSettings().then(setSettings);

    const init = async () => {
      if (!codeParam) {
        setLoading(false);
        return;
      }

      try {
        const foundOrder = await getOrderDetails(codeParam);
        if (foundOrder) {
          setOrder(foundOrder);
          setProductName(foundOrder.productName || 'Top-Up Service');
          if (foundOrder.topUpOrderNumber) setOrderNumber(foundOrder.topUpOrderNumber);
          if (foundOrder.topUpPlatform) setPlatform(foundOrder.topUpPlatform as any);
          if (foundOrder.topUpAccountEmail) setAccountEmail(foundOrder.topUpAccountEmail);
          if (foundOrder.topUpAccountPassword) setAccountPassword(foundOrder.topUpAccountPassword);
          if (foundOrder.topUpNotes) setAdditionalNotes(foundOrder.topUpNotes);
        } else {
          // If code was entered directly, verify it
          const res = await verifyAndRedeemCode(codeParam);
          if (res.order) {
            setOrder(res.order);
            setProductName(res.order.productName || 'Top-Up Service');
          }
        }
      } catch (e) {
        console.error('Error fetching order for topup', e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [codeParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!orderNumber.trim()) {
      setErrorMsg('Please enter your marketplace order number (e.g. #123456).');
      return;
    }

    if (!accountEmail.trim()) {
      setErrorMsg('Please enter your account email.');
      return;
    }

    if (!accountPassword.trim()) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setSubmitting(true);
    try {
      const targetIdentifier = order ? order.id : code.trim();
      const updated = await submitTopUpRequest(targetIdentifier, {
        topUpOrderNumber: orderNumber.trim(),
        topUpPlatform: platform,
        topUpAccountEmail: accountEmail.trim(),
        topUpAccountPassword: accountPassword.trim(),
        topUpNotes: additionalNotes.trim() || undefined,
      });

      // Dispatch auto-notification in live chat so client and agent know immediately
      try {
        await sendChatMessage({
          sender: 'user',
          text: `[Top-Up Request Submitted] Order #${orderNumber.trim()} on ${platform} for ${productName}. Email: ${accountEmail.trim()}`,
          orderNumber: orderNumber.trim(),
        });
      } catch {
        // non-blocking
      }

      // Open live chat automatically to guide user to next step
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('imostrada_open_chat'));
      }

      // Route customer to status page
      router.push(`/status?code=${encodeURIComponent(updated.code)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting top-up request.';
      setErrorMsg(msg);
      setSubmitting(false);
    }
  };

  const handleOpenLiveChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('imostrada_open_chat'));
    }
    const chatBtn = document.querySelector('button[class*="LIVE CHAT SUPPORT"]') as HTMLButtonElement;
    if (chatBtn) chatBtn.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060a12] text-gray-100 font-sans selection:bg-amber-400 selection:text-black">
      <Header settings={settings} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* STEPPER BAR (Matching Screenshot 2) */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
            {/* Step 1: Completed */}
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-400">
                ✓
              </div>
              <span>Redeem Code</span>
            </div>

            <div className="flex-1 h-0.5 mx-3 bg-gradient-to-r from-emerald-500 to-amber-500" />

            {/* Step 2: Active */}
            <div className="flex items-center gap-2 text-amber-400">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-gray-950 flex items-center justify-center font-extrabold text-xs shadow-md shadow-amber-500/40">
                2
              </div>
              <span className="font-bold">Fill Information</span>
            </div>

            <div className="flex-1 h-0.5 mx-3 bg-gray-800" />

            {/* Step 3: Pending */}
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-6 h-6 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <span>Submit Request</span>
            </div>
          </div>
        </div>

        {/* SECTION HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>TOP UP REQUEST</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-1">
            Complete Your <span className="text-amber-400">Top Up Request</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1.5">
            Please fill in the required information below so we can complete your top up as soon as possible.
          </p>
        </div>

        {/* 2-COLUMN LAYOUT: Form on Left, Sidebars on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* LEFT FORM CARD */}
          <div className="lg:col-span-2 bg-[#09111d] border border-gray-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Card Title */}
            <div className="flex items-start gap-3.5 pb-5 border-b border-gray-800/80">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Top Up Information</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Make sure to enter the correct details. Our team will process your request manually.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Box */}
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Product</label>
                <div className="bg-[#060b13] border border-gray-800 rounded-xl p-3.5 text-sm sm:text-base font-bold text-amber-400">
                  {productName}
                </div>
              </div>

              {/* Row 1: Order Number & Platform */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Order Number */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Order Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Enter your order number (e.g. #123456)"
                      className="w-full bg-[#060b13] border border-gray-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 text-xs sm:text-sm text-gray-100 rounded-xl py-3 pl-10 pr-3 outline-none transition font-sans"
                      required
                    />
                    <ShoppingCart className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Platform Purchased From */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Platform Purchased From <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {/* GAMIVO */}
                    <button
                      type="button"
                      onClick={() => setPlatform('GAMIVO')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        platform === 'GAMIVO'
                          ? 'border-amber-400 bg-[#16150e] shadow-md shadow-amber-400/10'
                          : 'border-gray-800 bg-[#060b13] hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      <span className="text-[11px] font-black text-[#ff8000]">GAMIVO</span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          platform === 'GAMIVO'
                            ? 'border-amber-400 bg-amber-400'
                            : 'border-gray-600 bg-transparent'
                        }`}
                      >
                        {platform === 'GAMIVO' && <div className="w-1.5 h-1.5 rounded-full bg-gray-950" />}
                      </div>
                    </button>

                    {/* G2A */}
                    <button
                      type="button"
                      onClick={() => setPlatform('G2A')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        platform === 'G2A'
                          ? 'border-amber-400 bg-[#16150e] shadow-md shadow-amber-400/10'
                          : 'border-gray-800 bg-[#060b13] hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      <span className="text-[11px] font-black text-[#00a8ff]">G2A</span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          platform === 'G2A'
                            ? 'border-amber-400 bg-amber-400'
                            : 'border-gray-600 bg-transparent'
                        }`}
                      >
                        {platform === 'G2A' && <div className="w-1.5 h-1.5 rounded-full bg-gray-950" />}
                      </div>
                    </button>

                    {/* Driffle */}
                    <button
                      type="button"
                      onClick={() => setPlatform('Driffle')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        platform === 'Driffle'
                          ? 'border-amber-400 bg-[#16150e] shadow-md shadow-amber-400/10'
                          : 'border-gray-800 bg-[#060b13] hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      <span className="text-[11px] font-black text-[#b33939] text-purple-400">Driffle</span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          platform === 'Driffle'
                            ? 'border-amber-400 bg-amber-400'
                            : 'border-gray-600 bg-transparent'
                        }`}
                      >
                        {platform === 'Driffle' && <div className="w-1.5 h-1.5 rounded-full bg-gray-950" />}
                      </div>
                    </button>

                    {/* Other */}
                    <button
                      type="button"
                      onClick={() => setPlatform('Other')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        platform === 'Other'
                          ? 'border-amber-400 bg-[#16150e] shadow-md shadow-amber-400/10'
                          : 'border-gray-800 bg-[#060b13] hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-0.5 text-gray-300">
                        <Grid className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold">Other</span>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          platform === 'Other'
                            ? 'border-amber-400 bg-amber-400'
                            : 'border-gray-600 bg-transparent'
                        }`}
                      >
                        {platform === 'Other' && <div className="w-1.5 h-1.5 rounded-full bg-gray-950" />}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Account Email & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Email */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Account Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      placeholder="Enter your account email"
                      className="w-full bg-[#060b13] border border-gray-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 text-xs sm:text-sm text-cyan-300 rounded-xl py-3 pl-10 pr-3 outline-none transition font-sans"
                      required
                    />
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Account Password */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Account Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full bg-[#060b13] border border-gray-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 text-xs sm:text-sm text-amber-300 rounded-xl py-3 pl-10 pr-10 outline-none transition font-mono"
                      required
                    />
                    <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Additional Information (Optional)
                </label>
                <div className="relative">
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) setAdditionalNotes(e.target.value);
                    }}
                    rows={3}
                    placeholder="Any additional details that may help us process your top up request."
                    className="w-full bg-[#060b13] border border-gray-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 text-xs sm:text-sm text-gray-200 rounded-xl py-3 pl-10 pr-3 outline-none transition font-sans"
                  />
                  <MessageSquare className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <span className="absolute right-3 bottom-3 text-[10px] text-gray-500 font-mono">
                    {additionalNotes.length}/500
                  </span>
                </div>
              </div>

              {/* Alert: Contact Live Chat */}
              <div className="bg-[#0b1b30] border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3.5 text-xs text-cyan-200">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Next Step: Contact Live Chat</h4>
                  <p className="text-cyan-200/80 mt-0.5 leading-relaxed">
                    After submitting this form, please contact our Live Chat immediately to confirm your top up.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-gray-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-gray-950" />
                <span>{submitting ? 'SUBMITTING REQUEST...' : 'SUBMIT REQUEST →'}</span>
              </button>
            </form>
          </div>

          {/* RIGHT SIDEBAR (3 Cards matching Screenshot 2) */}
          <div className="space-y-5">
            {/* CARD 1: Your Code */}
            <div className="bg-[#09111d] border border-gray-800/90 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Your Code</span>
              </div>
              <div className="bg-[#060b13] border border-gray-800 rounded-xl p-3 flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-cyan-300 select-all">
                  {code || 'IMOS-ABCD-1234'}
                </span>
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>✓</span> Valid Code
                </span>
              </div>
            </div>

            {/* CARD 2: Important Notes */}
            <div className="bg-[#09111d] border border-gray-800/90 rounded-2xl p-5 shadow-xl space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Important Notes</span>
              </div>
              <ul className="space-y-3 text-xs text-gray-300">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Make sure all information is correct.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Processing time is usually 5–30 minutes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Your information is safe and encrypted.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Contact our Live Chat after submitting.</span>
                </li>
              </ul>
            </div>

            {/* CARD 3: Need Help? Open Live Chat */}
            <div className="bg-[#09111d] border border-gray-800/90 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <Headphones className="w-4 h-4 text-cyan-400" />
                <span>Need Help?</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                If you have any questions or issues, please contact our support team.
              </p>
              <button
                type="button"
                onClick={handleOpenLiveChat}
                className="w-full py-2.5 rounded-xl border border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Open Live Chat</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenTerms={() => setIsTermsOpen(true)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <LiveChatWidget />
    </div>
  );
}

export default function TopUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060a12] flex items-center justify-center text-amber-400 text-sm">
          Loading Top Up Request Portal...
        </div>
      }
    >
      <TopUpContent />
    </Suspense>
  );
}
