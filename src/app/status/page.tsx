'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TermsModal } from '@/components/TermsModal';
import { getStoreSettings, getOrderDetails } from '@/lib/store';
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
} from 'lucide-react';

function OrderStatusContent() {
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
      const foundOrder = await getOrderDetails(query);
      setOrder(foundOrder);
    } catch (e) {
      console.error(e);
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

          {/* Quick Shortcuts */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-gray-400">
            <span>Try demo orders:</span>
            <button
              onClick={() => {
                setSearchQuery('KINGUIN-DEMO-0001');
                handleSearch('KINGUIN-DEMO-0001');
              }}
              className="text-emerald-400 hover:underline font-mono"
            >
              Account Demo (ORD-98241)
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setSearchQuery('KINGUIN-DEMO-0002');
                handleSearch('KINGUIN-DEMO-0002');
              }}
              className="text-cyan-400 hover:underline font-mono"
            >
              Key Demo (ORD-98242)
            </button>
          </div>
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
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
                  Order Details
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">{order.productName}</h3>
                <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1 font-mono">
                  <span>Order #: <strong className="text-amber-400">{order.orderNumber}</strong></span>
                  <span>•</span>
                  <span>Code: <strong className="text-cyan-400">{order.code}</strong></span>
                </div>
              </div>

              {/* Status Pill */}
              <div>
                {order.status === 'processing' && (
                  <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    <Clock className="w-4 h-4 animate-spin text-amber-400" />
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

            {/* STATUS: PROCESSING SCREEN */}
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

                {/* Progress Steps */}
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
                  className="inline-flex items-center space-x-2 text-xs bg-gray-800 hover:bg-gray-700 text-cyan-300 px-4 py-2 rounded-lg transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </button>
              </div>
            )}

            {/* STATUS: COMPLETED — OPTION 1: ACCOUNT DELIVERY (Screenshot 1) */}
            {order.status === 'completed' && order.deliveryType !== 'key' && (
              <div className="bg-[#07101e] border-2 border-emerald-500/50 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                {/* Header matching Screenshot 1 */}
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
                  <h3 className="text-xl font-black tracking-wider text-emerald-400 uppercase">
                    CREDENTIALS
                  </h3>
                  <span className="text-xs font-bold text-emerald-400 border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 rounded-full uppercase tracking-wider">
                    Delivery
                  </span>
                </div>

                {/* ✉️ ACCOUNT EMAIL */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span>ACCOUNT EMAIL</span>
                  </label>
                  <div className="flex items-center bg-[#0b1626] border border-gray-700/80 rounded-xl p-3 sm:p-3.5 font-mono text-sm text-cyan-300 justify-between gap-2">
                    <span className="select-all font-semibold">{order.accountEmail || 'gamer.delivery.acc99@outlook'}</span>
                    <button
                      onClick={() => order.accountEmail && copyToClipboard(order.accountEmail, 'email')}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold border border-gray-700 shrink-0"
                    >
                      {copiedField === 'email' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 🔒 ACCOUNT PASSWORD */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>ACCOUNT PASSWORD</span>
                  </label>
                  <div className="flex items-center bg-[#0b1626] border border-gray-700/80 rounded-xl p-3 sm:p-3.5 font-mono text-sm text-amber-300 justify-between gap-2">
                    <span className="select-all font-semibold tracking-wider">
                      {showPassword ? order.accountPassword : '••••••••••••'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition text-xs flex items-center space-x-1 border border-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => order.accountPassword && copyToClipboard(order.accountPassword, 'password')}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold border border-gray-700"
                      >
                        {copiedField === 'password' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 🛡️ 2FA KEY (Matching Screenshot 1) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>2FA KEY</span>
                  </label>
                  <div className="flex items-center bg-[#0b1626] border border-gray-700/80 rounded-xl p-3 sm:p-3.5 font-mono text-sm text-cyan-400 justify-between gap-2">
                    <span className="select-all font-semibold tracking-wider">
                      {order.twoFactorKey || 'JBSWY3DPEHPK3PXP'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(order.twoFactorKey || 'JBSWY3DPEHPK3PXP', '2fa')}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold border border-gray-700 shrink-0"
                    >
                      {copiedField === '2fa' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Amber 2FA Note box from Screenshot 1 */}
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

                {/* 📝 LOGIN INSTRUCTIONS & NOTES */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>LOGIN INSTRUCTIONS & NOTES</span>
                  </label>
                  <div className="bg-[#040810] p-4 sm:p-5 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {order.instructions ||
                      '1. Open Xbox app or console.\n2. Add new account using the email and password above.\n3. Add the 2FA key to Google Authenticator or any authenticator app (https://2fa.co.com/).\n4. Set as Home Xbox to share subscription features across all profiles.\n5. Enjoy gaming!'}
                  </div>
                </div>

                {/* Bottom COPY ALL button matching Screenshot 1 */}
                <button
                  onClick={() => {
                    const fullText = `Account Email: ${order.accountEmail || 'gamer.delivery.acc99@outlook'}\nAccount Password: ${order.accountPassword}\n2FA Key: ${order.twoFactorKey || 'JBSWY3DPEHPK3PXP'}\nInstructions: ${order.instructions || ''}`;
                    copyToClipboard(fullText, 'all');
                  }}
                  className="w-full py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center space-x-2 border border-gray-700 cursor-pointer shadow-lg"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400">ALL ACCOUNT DETAILS COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>COPY ALL ACCOUNT DETAILS</span>
                    </>
                  )}
                </button>

                {/* 🎁 Thank You & Review Box */}
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
                  <p className="text-emerald-400 font-bold leading-relaxed pt-1">
                    Your feedback means a lot to us and helps us grow and continue providing the best service! 💚
                  </p>
                </div>
              </div>
            )}

            {/* STATUS: COMPLETED — OPTION 2: PRODUCT KEY DELIVERY (Screenshot 3) */}
            {order.status === 'completed' && order.deliveryType === 'key' && (
              <div className="bg-[#07101e] border-2 border-emerald-500/50 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                {/* Header matching Screenshot 3 */}
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
                  <h3 className="text-xl font-black tracking-wider text-emerald-400 uppercase">
                    PRODUCT KEY
                  </h3>
                  <span className="text-xs font-bold text-emerald-400 border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 rounded-full uppercase tracking-wider">
                    Delivery
                  </span>
                </div>

                {/* 🔑 PRODUCT KEY */}
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
                      className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white transition flex items-center space-x-2 text-xs font-bold border border-gray-700 shrink-0"
                    >
                      {copiedField === 'key' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Amber Key Note Box from Screenshot 3 */}
                <div className="bg-[#181305] border border-amber-500/40 rounded-xl p-4 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Important Note:</span>
                  </div>
                  <p className="text-amber-200/90 pl-6 leading-relaxed">
                    This is your product key. Redeem it on Xbox/Microsoft Store to activate your product.
                  </p>
                </div>

                {/* Bottom COPY PRODUCT KEY button matching Screenshot 3 */}
                <button
                  onClick={() => copyToClipboard(order.productKey || 'JBSWY3DPEHPK3PXP', 'all-key')}
                  className="w-full py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center space-x-2 border border-gray-700 cursor-pointer shadow-lg"
                >
                  {copiedField === 'all-key' ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400">PRODUCT KEY COPIED TO CLIPBOARD</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>COPY PRODUCT KEY</span>
                    </>
                  )}
                </button>

                {/* 🎁 Thank You & Review Box */}
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
                  <p className="text-emerald-400 font-bold leading-relaxed pt-1">
                    Your feedback means a lot to us and helps us grow and continue providing the best service! 💚
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <Footer onOpenTerms={() => setIsTermsOpen(true)} />
    </div>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060a12] text-white flex items-center justify-center">Loading...</div>}>
      <OrderStatusContent />
    </Suspense>
  );
}
