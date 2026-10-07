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
} from 'lucide-react';

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams?.get('code') || '';

  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'TURKEPINSTORE',
    merchantName: 'turkepinstore',
    isOnline: true,
    noticeText:
      'Delivery time starts after the redeem request is submitted. Non-subscription accounts are typically delivered within 15-30 minutes.',
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
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100 font-sans">
      <Header settings={settings} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-2">
            Check Order Status
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Enter your Redeem Code or Order ID below to check live account delivery status
          </p>
        </div>

        {/* Search Box */}
        <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl mb-8">
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
                className="w-full bg-gray-950 border border-gray-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-cyan-300 font-mono text-sm sm:text-base rounded-xl py-3 pl-10 pr-4 outline-none transition uppercase"
              />
              <Search className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Search</span>}
            </button>
          </form>

          {/* Quick Shortcuts */}
          <div className="mt-3 flex items-center justify-center space-x-2 text-[11px] text-gray-400">
            <span>Try demo order:</span>
            <button
              onClick={() => {
                setSearchQuery('KINGUIN-DEMO-0001');
                handleSearch('KINGUIN-DEMO-0001');
              }}
              className="text-amber-400 underline hover:text-amber-300 font-mono"
            >
              KINGUIN-DEMO-0001 (Completed)
            </button>
          </div>
        </div>

        {/* Search Results Display */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
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
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
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
              <div className="bg-gray-950/80 border border-amber-500/30 rounded-xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Clock className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-amber-400">Order is being processed</h4>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-md mx-auto">
                    Our merchant team is manually setting up your digital account.
                  </p>
                </div>

                {/* Simulated Progress Timeline */}
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
                    <span className="text-amber-400 font-semibold">Account Preparation In Progress</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs opacity-40">
                    <div className="w-5 h-5 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center font-bold text-[10px]">
                      3
                    </div>
                    <span className="text-gray-400">Credentials Delivered</span>
                  </div>
                </div>

                <div className="pt-4 text-[11px] text-gray-400 border-t border-gray-800">
                  ⏱ Expected turnaround time: 15-30 minutes. You can bookmark or refresh this page.
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

            {/* STATUS: COMPLETED DIGITAL DELIVERY BOX */}
            {order.status === 'completed' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-950/40 to-cyan-950/40 border-2 border-emerald-500/50 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span>Digital Account Credentials</span>
                    </div>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      Verified Secure Delivery
                    </span>
                  </div>

                  {/* Account Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ACCOUNT EMAIL</span>
                    </label>
                    <div className="flex items-center bg-gray-950 border border-gray-700 rounded-xl p-3 font-mono text-sm text-cyan-300 justify-between">
                      <span className="select-all font-semibold">{order.accountEmail || 'N/A'}</span>
                      <button
                        onClick={() => order.accountEmail && copyToClipboard(order.accountEmail, 'email')}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center space-x-1 text-xs"
                      >
                        {copiedField === 'email' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
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

                  {/* Account Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>ACCOUNT PASSWORD</span>
                    </label>
                    <div className="flex items-center bg-gray-950 border border-gray-700 rounded-xl p-3 font-mono text-sm text-amber-300 justify-between">
                      <span className="select-all font-semibold">
                        {showPassword ? order.accountPassword : '••••••••••••'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition text-xs flex items-center space-x-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => order.accountPassword && copyToClipboard(order.accountPassword, 'password')}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center space-x-1 text-xs"
                        >
                          {copiedField === 'password' ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
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

                  {/* Instructions */}
                  {order.instructions && (
                    <div className="space-y-1.5 pt-2 border-t border-gray-800/80">
                      <label className="text-xs font-semibold text-gray-400 flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>LOGIN INSTRUCTIONS & NOTES</span>
                      </label>
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                        {order.instructions}
                      </div>
                    </div>
                  )}

                  {/* Copy All Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const fullText = `Product: ${order.productName}\nOrder #: ${order.orderNumber}\nEmail: ${order.accountEmail}\nPassword: ${order.accountPassword}\nInstructions: ${order.instructions}`;
                        copyToClipboard(fullText, 'all');
                      }}
                      className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 border border-gray-700"
                    >
                      {copiedField === 'all' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">All Credentials Copied to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy All Account Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Important Account Protection Note */}
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-amber-300">Important Safety Reminder:</strong>
                    Please log into the account immediately to verify features. Do not change security info or region within the first 24 hours of delivery.
                  </div>
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
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>}>
      <OrderStatusContent />
    </Suspense>
  );
}
