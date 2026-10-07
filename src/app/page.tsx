'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TermsModal } from '@/components/TermsModal';
import { getStoreSettings, verifyAndRedeemCode } from '@/lib/store';
import { StoreSettings, Order } from '@/lib/types';
import {
  KeyRound,
  Search,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  ShieldCheck,
  Headphones,
  Lock,
  Clock,
  ChevronDown,
  ArrowRight,
  Package,
  Truck,
  RotateCcw,
  Wrench,
  XCircle,
  ShoppingCart,
  Settings,
  ChevronRight,
} from 'lucide-react';

const HOME_FAQS = [
  {
    icon: Truck,
    q: 'HOW WE DELIVER ACCOUNTS',
    a: 'Once your redeem code is verified, our fulfillment team manually prepares your product details (Email, Password, Key & Instructions). Delivery usually completes within 1 hour to 24 hours.',
  },
  {
    icon: KeyRound,
    q: 'WHAT TO DO AFTER RECEIVING THE ACCOUNT',
    a: 'Log in using the provided account credentials on your console/device. Follow the step-by-step setup guide provided on your Order Details page.',
  },
  {
    icon: XCircle,
    q: 'HOW TO CANCEL AN ORDER',
    a: 'Redeem codes are single-use keys. Once submitted and processing starts, cancellations are subject to review. Contact support via the FAQ page for assistance.',
  },
  {
    icon: RotateCcw,
    q: 'RETURN / REFUND POLICY',
    a: 'If credentials are valid and delivered, digital products are non-refundable. If an invalid account issue occurs, our support team will replace it immediately.',
  },
  {
    icon: Wrench,
    q: 'RESOLVE AN ISSUE',
    a: 'If you encounter any login or activation errors, check your Order Status page for notes or submit a support inquiry with your Order Number.',
  },
  {
    icon: ShieldCheck,
    q: 'PRIVACY POLICY',
    a: 'We strictly protect all customer data. Your redemption information is encrypted and never shared with third parties.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'IMOSTRADA',
    merchantName: 'imostrada',
    isOnline: true,
    noticeText: 'Delivery time starts after the redeem request is submitted. Products are typically delivered within 1 hour to 24 hours.',
  });

  const [code, setCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [redeemedOrder, setRedeemedOrder] = useState<Order | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    getStoreSettings().then(setSettings);
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim()) {
      setErrorMsg('Please enter your redeem code.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg('You must accept the Terms & Conditions to proceed.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyAndRedeemCode(code);
      if (!result.success) {
        setErrorMsg(result.message);
      } else if (result.order) {
        setRedeemedOrder(result.order);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060a12] text-gray-100 selection:bg-amber-400 selection:text-black" style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
      <Header settings={settings} />

      {/* ─────────────────────────────────────────────────
          HERO SECTION — exact match to image.png
          Full-width dark background with game art collage overlay
      ───────────────────────────────────────────────── */}
      <section
        className="relative w-full overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 10, 18, 0.94) 0%, rgba(6, 10, 18, 0.80) 45%, rgba(6, 10, 18, 0.50) 80%, rgba(6, 10, 18, 0.70) 100%), url('/background.png')`,
          minHeight: '480px',
        }}
      >
        {/* Ambient glow effect overlay */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 65% 50%, rgba(99,102,241,0.12) 0%, transparent 60%),
              radial-gradient(circle at 85% 20%, rgba(234,179,8,0.10) 0%, transparent 40%)
            `,
          }}
        />

        {/* Bottom fade to dark background color */}
        <div className="absolute bottom-0 left-0 right-0 h-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #060a12)' }} />

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-20 flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16">

          {/* LEFT: Hero Text + Feature Row */}
          <div className="flex-1 space-y-6 max-w-xl">
            {/* Section label — "DIGITAL PRODUCTS DELIVERY" with colored letters */}
            <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 flex items-center gap-1">
              <span>DIGITAL PRO</span>
              <span className="text-amber-400">D</span>
              <span>UCTS DELIVERY</span>
            </div>

            {/* Big hero heading */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black leading-[1.1] tracking-tight text-white">
                Redeem Your Code
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black leading-[1.1] tracking-tight text-amber-400">
                Get Your Account / Key
              </h1>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed max-w-xs">
              Enter your redeem code below to receive your digital product. Fast, secure and easy delivery.
            </p>

            {/* 3 horizontal feature badges below text — matching image.png exactly */}
            <div className="flex items-start gap-6 pt-4 border-t border-white/10">
              {/* Fast Delivery */}
              <div className="flex flex-col items-start gap-1.5">
                <div className="w-10 h-10 rounded-full border-2 border-amber-400/60 bg-amber-400/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Fast Delivery</div>
                  <div className="text-[11px] text-gray-400">Usually 1h – 24h</div>
                </div>
              </div>

              {/* Secure & Safe */}
              <div className="flex flex-col items-start gap-1.5">
                <div className="w-10 h-10 rounded-full border-2 border-amber-400/60 bg-amber-400/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Secure & Safe</div>
                  <div className="text-[11px] text-gray-400">Your data is protected</div>
                </div>
              </div>

              {/* 24/7 Support */}
              <div className="flex flex-col items-start gap-1.5">
                <div className="w-10 h-10 rounded-full border-2 border-amber-400/60 bg-amber-400/10 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">24/7 Support</div>
                  <div className="text-[11px] text-gray-400">We are here to help</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Floating Redeem Card — matching image.png */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-[#0d1526]/95 backdrop-blur-md border border-gray-700/80 rounded-2xl shadow-2xl shadow-black/60 p-6 sm:p-7">

              {/* Card header */}
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white">Enter Your Redeem Code</h3>
              </div>
              <p className="text-xs text-gray-400 mb-5 pl-10">
                Enter the unique code you received from GAMIVO, G2A or Driffle.
              </p>

              {!redeemedOrder ? (
                <form onSubmit={handleRedeem} className="space-y-4">
                  {/* Code input */}
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setErrorMsg(''); }}
                    placeholder="IMOS-ABCD-1234"
                    className="w-full bg-[#07101e] border border-gray-700 hover:border-gray-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl py-3 px-4 text-sm font-mono text-gray-200 placeholder-gray-600 outline-none transition-all uppercase tracking-widest"
                    disabled={loading}
                    maxLength={30}
                  />

                  {errorMsg && (
                    <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Terms checkbox */}
                  <div className="flex items-center gap-2.5 text-xs">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-[#07101e] text-amber-400 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-gray-300 cursor-pointer select-none leading-relaxed">
                      I accept the{' '}
                      <button type="button" onClick={() => setIsTermsOpen(true)} className="text-cyan-400 hover:underline font-medium">
                        Terms & Conditions
                      </button>
                    </label>
                  </div>

                  {/* Golden REDEEM CODE button — exact match to image */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-gray-900 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
                    style={{
                      background: loading ? '#ca8a04' : 'linear-gradient(90deg, #facc15 0%, #f59e0b 100%)',
                      boxShadow: '0 4px 20px rgba(234,179,8,0.3)',
                    }}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></>
                    ) : (
                      <><span>REDEEM CODE</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  {/* OR divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-700/80" />
                    <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest">OR</span>
                    <div className="flex-1 h-px bg-gray-700/80" />
                  </div>

                  {/* CHECK ORDER STATUS button — dark with package icon */}
                  <button
                    type="button"
                    onClick={() => router.push('/status')}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider border border-gray-600/80 bg-[#0d1829] hover:bg-[#111e33] text-gray-200 hover:text-white flex items-center justify-center gap-2.5 transition-all"
                  >
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>CHECK ORDER STATUS</span>
                  </button>

                  {/* FAQ link */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => router.push('/faq')}
                      className="text-xs text-gray-400 hover:text-amber-400 transition inline-flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>FAQ</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Success state */
                <div className="space-y-4 text-center animate-fade-in">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-400">Code Redeemed Successfully!</h4>
                  <div className="bg-[#07101e] rounded-xl border border-gray-800 p-4 text-left space-y-2 text-xs text-gray-300">
                    <div className="flex justify-between pb-2 border-b border-gray-800">
                      <span className="text-gray-500">Order #:</span>
                      <span className="font-mono font-bold text-amber-400">{redeemedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-gray-800">
                      <span className="text-gray-500">Product:</span>
                      <span className="font-semibold text-white">{redeemedOrder.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="flex items-center gap-1.5 font-bold text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                        Processing
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/status?code=${encodeURIComponent(redeemedOrder.code)}`)}
                    className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-gray-900 transition"
                    style={{ background: 'linear-gradient(90deg, #facc15, #f59e0b)' }}
                  >
                    View Delivery Status
                  </button>
                  <button
                    onClick={() => { setRedeemedOrder(null); setCode(''); setAcceptedTerms(false); }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition"
                  >
                    Redeem another code
                  </button>
                </div>
              )}

              {/* Demo codes */}
              <div className="mt-5 pt-4 border-t border-gray-800/80 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Demo Codes:</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['GAMIVO-XBOX-9981', 'GAMIVO-PSN-4412', 'KINGUIN-DEMO-0001'].map((dc) => (
                    <button
                      key={dc}
                      onClick={() => { setCode(dc); setAcceptedTerms(true); setErrorMsg(''); }}
                      className="text-[10px] bg-[#07101e] hover:bg-gray-800 border border-gray-700 text-cyan-400 px-2 py-0.5 rounded font-mono transition"
                    >
                      {dc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          HOW IT WORKS 4-STEP TIMELINE — matching user screenshot
      ───────────────────────────────────────────────── */}
      <section className="py-10 px-5 sm:px-8 bg-[#060a12] border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto bg-[#09111d] border border-gray-800/80 rounded-2xl p-5 sm:p-7 shadow-2xl">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800/60">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              How It Works
            </h2>
            <button
              onClick={() => router.push('/faq')}
              className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
            >
              <span>Learn more</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Single-line 4-Step Horizontal Row */}
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="flex items-start justify-between min-w-[680px] lg:min-w-0 gap-3 sm:gap-6">
              
              {/* Step 1 */}
              <div className="flex-1 flex flex-col gap-3.5 relative">
                <div className="flex items-center justify-between pr-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full border-2 border-orange-500 bg-orange-500/10 text-orange-400 font-black text-sm flex items-center justify-center shrink-0">
                      1
                    </div>
                    <ShoppingCart className="w-6 h-6 text-white stroke-[2.2]" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">Get Your Code</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[170px]">
                    Purchase from GAMIVO, G2A or Driffle and receive a code.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex-1 flex flex-col gap-3.5 relative">
                <div className="flex items-center justify-between pr-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full border-2 border-blue-500 bg-blue-500/10 text-blue-400 font-black text-sm flex items-center justify-center shrink-0">
                      2
                    </div>
                    <KeyRound className="w-6 h-6 text-blue-400 stroke-[2.2]" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">Redeem Code</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[170px]">
                    Enter your code on our website to create your order.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex-1 flex flex-col gap-3.5 relative">
                <div className="flex items-center justify-between pr-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full border-2 border-purple-500 bg-purple-500/10 text-purple-400 font-black text-sm flex items-center justify-center shrink-0">
                      3
                    </div>
                    <Settings className="w-6 h-6 text-white stroke-[2.2]" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">Processing</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[170px]">
                    Your order is being prepared. Usually 1 hour to 24 hours.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex-1 flex flex-col gap-3.5 relative">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-black text-sm flex items-center justify-center shrink-0">
                    4
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">Get Your Account / Key</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[170px]">
                    Check your order status and view your account or key details.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          3 FEATURE CARDS — exactly as in image.png
          Dark cards with large amber circle icons
      ───────────────────────────────────────────────── */}
      <section className="py-10 px-5 sm:px-8 bg-[#060a12] border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-800/40 rounded-2xl overflow-hidden border border-gray-800/60">
          {/* 100% Secure */}
          <div className="bg-[#09111d] p-7 sm:p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-amber-400/50 bg-amber-400/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1.5">100% Secure</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your information is safe with us. We use advanced security measures.
              </p>
            </div>
          </div>

          {/* Quick Delivery */}
          <div className="bg-[#09111d] p-7 sm:p-8 flex flex-col gap-4 border-l border-r border-gray-800/60">
            <div className="w-12 h-12 rounded-full border-2 border-amber-400/50 bg-amber-400/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1.5">Quick Delivery</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Most orders are delivered within 1 hour to 24 hours.
              </p>
            </div>
          </div>

          {/* 24/7 Support */}
          <div className="bg-[#09111d] p-7 sm:p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-amber-400/50 bg-amber-400/10 flex items-center justify-center">
              <Headphones className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1.5">24/7 Support</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                If you have any issues, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          FAQ SECTION — exactly as in image.png
          "Frequently Asked Questions" title in amber + white
          Accordion rows with amber icon squares on left
      ───────────────────────────────────────────────── */}
      <section className="py-14 px-5 sm:px-8 bg-[#060a12]">
        <div className="max-w-3xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              <span className="text-amber-400">Frequently Asked</span>
              <span className="text-white"> Questions</span>
            </h2>
            {/* Gold underline accent bar */}
            <div className="w-14 h-1 bg-amber-400 mx-auto mt-4 rounded-full" />
          </div>

          {/* FAQ Accordion Rows */}
          <div className="space-y-2.5">
            {HOME_FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              const Icon = faq.icon;
              return (
                <div
                  key={index}
                  className={`rounded-xl overflow-hidden border transition-colors ${
                    isOpen ? 'border-amber-500/40 bg-[#0d1526]' : 'border-gray-800/80 bg-[#0a1220]'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Amber square icon — matches image.png exactly */}
                      <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-200 tracking-wider uppercase group-hover:text-amber-400 transition-colors">
                        {faq.q}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-amber-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-sm text-gray-400 leading-relaxed border-t border-gray-800/60 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Terms Modal */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      {/* Footer */}
      <Footer onOpenTerms={() => setIsTermsOpen(true)} />
    </div>
  );
}
