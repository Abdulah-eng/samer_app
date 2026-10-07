'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import {
  getProducts,
  addProduct,
  deleteProduct,
  getRedeemCodes,
  addRedeemCode,
  bulkAddRedeemCodes,
  deleteRedeemCode,
  getOrders,
  updateOrderDelivery,
  getStoreSettings,
  updateStoreSettings,
} from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Product, RedeemCode, Order, StoreSettings, OrderStatus } from '@/lib/types';
import {
  LayoutDashboard,
  Key,
  Package,
  ShoppingBag,
  Settings,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  LogOut,
  Lock,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Edit3,
  Copy,
  Check,
  Globe,
  Database,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const ADMIN_PASSCODE = 'admin123';

const INSTRUCTION_TEMPLATES = [
  {
    label: 'Xbox Account Template',
    text: `1. Log into Xbox app or console using provided credentials.\n2. Go to Settings > General > Personalization > Set as Home Xbox.\n3. Switch to your main profile and enjoy!`,
  },
  {
    label: 'PlayStation Account Template',
    text: `1. Create new user on your PS4/PS5.\n2. Sign in with the account email and password.\n3. Go to Settings > Users and Accounts > Other > Console Sharing and Offline Play > Select Enable.`,
  },
  {
    label: 'Steam Account Template',
    text: `1. Launch Steam and log in with credentials.\n2. Verify email code if required (contact support for steam guard code).\n3. Download your game and play!`,
  },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Data State
  const [activeTab, setActiveTab] = useState<'orders' | 'codes' | 'products' | 'settings'>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'TURKEPINSTORE',
    merchantName: 'turkepinstore',
    isOnline: true,
    noticeText:
      'Delivery time starts after the redeem request is submitted. Non-subscription accounts are typically delivered within 15-30 minutes.',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fulfill Order Modal State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deliveryType, setDeliveryType] = useState<'account' | 'key'>('account');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [twoFactorKey, setTwoFactorKey] = useState('');
  const [productKey, setProductKey] = useState('');
  const [instructions, setInstructions] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('completed');

  // New Product Modal State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Gaming Account');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Generator & Bulk Codes State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [singleCodeInput, setSingleCodeInput] = useState('');
  const [batchPrefix, setBatchPrefix] = useState('GAMIVO-');
  const [batchCount, setBatchCount] = useState(10);
  const [csvText, setCsvText] = useState('');

  // Filters & Search
  const [orderFilter, setOrderFilter] = useState<'all' | 'processing' | 'completed'>('all');
  const [codeFilter, setCodeFilter] = useState<'all' | 'unused' | 'processing' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check local session
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadAllData();
    }
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prodsData, codesData, ordersData, settingsData] = await Promise.all([
        getProducts(),
        getRedeemCodes(),
        getOrders(),
        getStoreSettings(),
      ]);
      setProducts(prodsData);
      setCodes(codesData);
      setOrders(ordersData);
      setSettings(settingsData);
      if (prodsData.length > 0 && !selectedProductId) {
        setSelectedProductId(prodsData[0].id);
      }
    } catch (e) {
      console.error('Error loading admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      setAuthError('');
      loadAllData();
    } else {
      setAuthError('Invalid passcode. Default is admin123');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Fulfill Order Action
  const openFulfillModal = (orderItem: Order) => {
    setEditingOrder(orderItem);
    const dType = orderItem.deliveryType || (orderItem.productName?.toLowerCase().includes('key') ? 'key' : 'account');
    setDeliveryType(dType);
    setAccountEmail(orderItem.accountEmail || '');
    setAccountPassword(orderItem.accountPassword || '');
    setTwoFactorKey(orderItem.twoFactorKey || '');
    setProductKey(orderItem.productKey || '');
    setInstructions(
      orderItem.instructions || (dType === 'key' ? 'This is your product key. Redeem it on Xbox/Microsoft Store to activate your product.' : INSTRUCTION_TEMPLATES[0].text)
    );
    setOrderStatus(orderItem.status === 'processing' ? 'completed' : orderItem.status);
  };

  const saveOrderDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      await updateOrderDelivery(editingOrder.id, {
        deliveryType,
        accountEmail: deliveryType === 'account' ? accountEmail : undefined,
        accountPassword: deliveryType === 'account' ? accountPassword : undefined,
        twoFactorKey: deliveryType === 'account' ? twoFactorKey : undefined,
        productKey: deliveryType === 'key' ? productKey : undefined,
        instructions,
        status: orderStatus,
      });
      showNotification('success', `Order ${editingOrder.orderNumber} updated successfully!`);
      setEditingOrder(null);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating order';
      showNotification('error', msg);
    }
  };

  // Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    try {
      await addProduct({
        name: newProdName,
        category: newProdCategory,
        description: newProdDesc,
      });
      setNewProdName('');
      setNewProdDesc('');
      showNotification('success', 'Product added successfully!');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding product';
      showNotification('error', msg);
    }
  };

  // Add Single Code
  const handleAddSingleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleCodeInput.trim() || !selectedProductId) return;

    try {
      await addRedeemCode(singleCodeInput, selectedProductId);
      setSingleCodeInput('');
      showNotification('success', 'Redeem code added!');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding code';
      showNotification('error', msg);
    }
  };

  // Batch Generate Codes
  const handleBatchGenerate = async () => {
    if (!selectedProductId || batchCount <= 0) return;

    const generatedCodes: string[] = [];
    for (let i = 0; i < batchCount; i++) {
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomPart2 = Math.floor(1000 + Math.random() * 9000);
      generatedCodes.push(`${batchPrefix}${randomPart}-${randomPart2}`);
    }

    try {
      const res = await bulkAddRedeemCodes(generatedCodes, selectedProductId);
      showNotification('success', `Batch generated ${res.added} codes (${res.skipped} skipped duplicates).`);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error batch generating';
      showNotification('error', msg);
    }
  };

  // CSV Bulk Upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductId) return;

    Papa.parse(file, {
      complete: async (results) => {
        const rawLines = results.data.flat().map((item: any) => String(item).trim());
        const cleanCodes = rawLines.filter((c: string) => c.length > 3);
        if (cleanCodes.length === 0) {
          showNotification('error', 'No valid codes found in CSV file.');
          return;
        }

        const res = await bulkAddRedeemCodes(cleanCodes, selectedProductId);
        showNotification('success', `CSV Import complete! Added ${res.added} codes (${res.skipped} skipped).`);
        loadAllData();
      },
      error: () => showNotification('error', 'Error parsing CSV file.'),
    });
  };

  // Store Settings Update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStoreSettings(settings);
      showNotification('success', 'Store settings updated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving settings';
      showNotification('error', msg);
    }
  };

  // Passcode Auth Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 font-sans text-white">
        <div className="w-full max-w-md bg-gray-900 border border-purple-500/30 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Admin Dashboard Login</h2>
            <p className="text-xs text-gray-400 mt-1">Enter your admin security passcode to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode (default: admin123)"
              className="w-full bg-gray-950 border border-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-center text-lg text-purple-300 rounded-xl py-3 px-4 outline-none font-mono"
            />

            {authError && (
              <div className="text-xs text-rose-400 bg-rose-950/60 p-2.5 rounded-lg border border-rose-500/30">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm uppercase tracking-wider shadow-lg transition"
            >
              Unlock Admin Portal
            </button>
          </form>

          <div className="pt-2">
            <Link href="/" className="text-xs text-gray-400 hover:text-cyan-400 transition">
              ← Return to Customer Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered lists
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredCodes = codes.filter((c) => {
    if (codeFilter !== 'all' && c.status !== codeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.code.toLowerCase().includes(q) || (c.productName && c.productName.toLowerCase().includes(q));
    }
    return true;
  });

  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const unusedCodesCount = codes.filter((c) => c.status === 'unused').length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      {/* Admin Topbar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>{settings.storeName} Admin Dashboard</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40">
                Merchant Panel
              </span>
            </h1>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <Database className="w-3 h-3 text-cyan-400" />
                <span>Backend: {isSupabaseConfigured ? 'Supabase Connected' : 'Local Dynamic Store'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 px-3.5 py-2 rounded-lg transition border border-gray-700 flex items-center space-x-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>View Live Site</span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 px-3 py-2 rounded-lg transition border border-rose-500/30 flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Notification Toast */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">
                Pending Orders
              </span>
              <span className="text-2xl font-black text-amber-400">{processingCount}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">
                Completed Deliveries
              </span>
              <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">
                Unused Codes
              </span>
              <span className="text-2xl font-black text-cyan-400">{unusedCodesCount}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">
                Active Products
              </span>
              <span className="text-2xl font-black text-purple-400">{products.length}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 space-x-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 font-semibold text-sm flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'orders'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders & Delivery ({orders.length})</span>
            {processingCount > 0 && (
              <span className="bg-amber-500 text-gray-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {processingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`py-3 font-semibold text-sm flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'codes'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Redeem Codes ({codes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 font-semibold text-sm flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'products'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 font-semibold text-sm flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Settings</span>
          </button>
        </div>

        {/* TAB 1: ORDERS & DELIVERY MANAGER */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-900 p-4 rounded-xl border border-gray-800">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code or order #..."
                    className="w-full bg-gray-950 border border-gray-700 text-xs text-gray-200 rounded-lg py-2 pl-8 pr-3 outline-none focus:border-amber-400"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-gray-400">Status:</span>
                <select
                  value={orderFilter}
                  onChange={(e: any) => setOrderFilter(e.target.value)}
                  className="bg-gray-950 border border-gray-700 text-xs text-gray-200 rounded-lg py-2 px-3 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="processing">Processing Only</option>
                  <option value="completed">Completed Only</option>
                </select>

                <button
                  onClick={loadAllData}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800">
                  <tr>
                    <th className="p-4">Order #</th>
                    <th className="p-4">Redeem Code</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Delivery Credentials</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No orders found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-850/50 transition">
                        <td className="p-4 font-mono font-bold text-amber-400">{o.orderNumber}</td>
                        <td className="p-4 font-mono text-cyan-300">{o.code}</td>
                        <td className="p-4 font-semibold text-white">{o.productName}</td>
                        <td className="p-4">
                          {o.status === 'processing' ? (
                            <span className="inline-flex items-center space-x-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                              <span>Processing</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 text-[11px] font-bold">
                              <span>✓ Completed</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-gray-400 text-[11px]">
                          {o.accountEmail ? (
                            <div>
                              <div className="text-cyan-300 truncate max-w-[180px]">{o.accountEmail}</div>
                              <div className="text-gray-500">Password: ••••••••</div>
                            </div>
                          ) : (
                            <span className="text-rose-400 italic">Not set yet</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => openFulfillModal(o)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ml-auto ${
                              o.status === 'processing'
                                ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-md'
                                : 'bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-gray-700'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{o.status === 'processing' ? 'Fulfill Order' : 'Edit Credentials'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: REDEEM CODES & CSV IMPORTER */}
        {activeTab === 'codes' && (
          <div className="space-y-6">
            {/* Generator & CSV Upload Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Single / Batch Code Generator */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span>Generate / Add Redeem Codes</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Target Product:</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 text-xs text-gray-200 rounded-lg p-2.5 outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add Single Code */}
                  <form onSubmit={handleAddSingleCode} className="space-y-2">
                    <label className="text-xs text-gray-400 block">Add Single Code:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={singleCodeInput}
                        onChange={(e) => setSingleCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. GAMIVO-KEY-1001"
                        className="flex-1 bg-gray-950 border border-gray-700 text-xs font-mono text-cyan-300 rounded-lg p-2.5 outline-none uppercase"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs rounded-lg transition"
                      >
                        Add Code
                      </button>
                    </div>
                  </form>

                  {/* Batch Generator */}
                  <div className="pt-3 border-t border-gray-800 space-y-2">
                    <label className="text-xs text-gray-400 block">Quick Batch Random Code Generator:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={batchPrefix}
                        onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                        placeholder="Prefix (e.g. GAMIVO-)"
                        className="bg-gray-950 border border-gray-700 text-xs font-mono text-cyan-300 rounded-lg p-2 outline-none uppercase"
                      />
                      <input
                        type="number"
                        value={batchCount}
                        onChange={(e) => setBatchCount(Number(e.target.value))}
                        placeholder="Qty"
                        className="bg-gray-950 border border-gray-700 text-xs text-white rounded-lg p-2 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleBatchGenerate}
                      className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-cyan-300 font-bold text-xs rounded-lg border border-gray-700 transition"
                    >
                      ⚡ Generate {batchCount} Random Codes
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk CSV Importer */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Bulk CSV Code Import</span>
                </h3>

                <p className="text-xs text-gray-400">
                  Upload a CSV file containing redeem codes exported from GAMIVO or Kinguin merchant tool.
                </p>

                <div className="border-2 border-dashed border-gray-700 hover:border-amber-400/60 rounded-xl p-6 text-center space-y-3 bg-gray-950/50 transition">
                  <Upload className="w-8 h-8 text-amber-400 mx-auto" />
                  <div>
                    <span className="text-xs text-gray-300 block font-semibold">
                      Click to Select CSV File
                    </span>
                    <span className="text-[11px] text-gray-500">Supports .csv list of code strings</span>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVUpload}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-lg cursor-pointer transition shadow-md"
                  >
                    Choose CSV File
                  </label>
                </div>
              </div>
            </div>

            {/* Redeem Codes List */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 bg-gray-950 border-b border-gray-800 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Existing Redeem Codes Database ({filteredCodes.length})
                </span>

                <div className="flex items-center space-x-2">
                  <select
                    value={codeFilter}
                    onChange={(e: any) => setCodeFilter(e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-xs text-gray-300 rounded-lg p-1.5 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="unused">Unused Only</option>
                    <option value="processing">Processing Only</option>
                    <option value="completed">Completed Only</option>
                  </select>
                </div>
              </div>

              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800">
                  <tr>
                    <th className="p-3">Redeem Code</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {filteredCodes.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-850/50 transition">
                      <td className="p-3 font-mono font-bold text-cyan-300">{c.code}</td>
                      <td className="p-3 text-white">{c.productName}</td>
                      <td className="p-3">
                        {c.status === 'unused' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                            Unused
                          </span>
                        )}
                        {c.status === 'processing' && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                            Processing
                          </span>
                        )}
                        {c.status === 'completed' && (
                          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={async () => {
                            await deleteRedeemCode(c.id);
                            loadAllData();
                          }}
                          className="p-1 text-gray-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS MANAGER */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Add Product Form */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 shadow-xl h-fit">
              <h3 className="text-sm font-bold text-purple-400 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create New Product</span>
              </h3>

              <form onSubmit={handleAddProduct} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Product Title:</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Xbox Game Pass 12 Months"
                    className="w-full bg-gray-950 border border-gray-700 text-xs text-white rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Category:</label>
                  <input
                    type="text"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    placeholder="e.g. Subscription / Game Account"
                    className="w-full bg-gray-950 border border-gray-700 text-xs text-white rounded-lg p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Description:</label>
                  <textarea
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    placeholder="Product details & terms..."
                    className="w-full bg-gray-950 border border-gray-700 text-xs text-white rounded-lg p-2.5 outline-none h-20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition"
                >
                  Save Product
                </button>
              </form>
            </div>

            {/* Products Table */}
            <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 bg-gray-950 border-b border-gray-800">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Product Catalog ({products.length})
                </span>
              </div>

              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Codes Qty</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {products.map((p) => {
                    const prodCodesCount = codes.filter((c) => c.productId === p.id).length;
                    return (
                      <tr key={p.id} className="hover:bg-gray-850/50 transition">
                        <td className="p-3 font-semibold text-white">{p.name}</td>
                        <td className="p-3 text-gray-400">{p.category}</td>
                        <td className="p-3 font-mono text-cyan-400">{prodCodesCount} codes</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={async () => {
                              await deleteProduct(p.id);
                              loadAllData();
                            }}
                            className="p-1 text-gray-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-emerald-400 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Portal Customization & Merchant Settings</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Store Name Title:</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Merchant ID Tag:</label>
                <input
                  type="text"
                  value={settings.merchantName}
                  onChange={(e) => setSettings({ ...settings, merchantName: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-amber-300 rounded-lg p-3 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Store Online Status:</label>
                <select
                  value={settings.isOnline ? 'true' : 'false'}
                  onChange={(e) => setSettings({ ...settings, isOnline: e.target.value === 'true' })}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 outline-none"
                >
                  <option value="true">🟢 Online (Accepting Redemptions)</option>
                  <option value="false">🔴 Maintenance (Offline Mode)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  Important Notice Text (Header Banner):
                </label>
                <textarea
                  value={settings.noticeText}
                  onChange={(e) => setSettings({ ...settings, noticeText: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-gray-200 rounded-lg p-3 outline-none h-24"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-lg"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}
      </main>

      {/* FULFILL ORDER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 text-gray-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  Fulfill Customer Order
                </span>
                <h3 className="text-lg font-extrabold text-white">{editingOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveOrderDelivery} className="space-y-4 text-xs">
              <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 space-y-1">
                <div>Product: <strong className="text-cyan-300">{editingOrder.productName}</strong></div>
                <div>Code: <strong className="text-amber-300 font-mono">{editingOrder.code}</strong></div>
              </div>

              {/* Delivery Type Selector */}
              <div>
                <label className="text-gray-300 font-bold block mb-1.5">Select Delivery Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('account');
                      if (!instructions || instructions.includes('product key')) {
                        setInstructions(INSTRUCTION_TEMPLATES[0].text);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition flex items-center justify-center space-x-2 ${
                      deliveryType === 'account'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-gray-950 border-gray-700 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>👤 Account Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('key');
                      if (!instructions || instructions.includes('Xbox app')) {
                        setInstructions('This is your product key. Redeem it on Xbox/Microsoft Store to activate your product.');
                      }
                    }}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition flex items-center justify-center space-x-2 ${
                      deliveryType === 'key'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-gray-950 border-gray-700 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>🔑 Product Key Delivery</span>
                  </button>
                </div>
              </div>

              {/* ACCOUNT DELIVERY FIELDS */}
              {deliveryType === 'account' ? (
                <>
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Account Email / Username:</label>
                    <input
                      type="text"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      placeholder="e.g. gamer.delivery.acc99@outlook"
                      className="w-full bg-gray-950 border border-gray-700 text-cyan-300 font-mono rounded-lg p-2.5 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Account Password:</label>
                    <input
                      type="text"
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      placeholder="e.g. PassX99!2026"
                      className="w-full bg-gray-950 border border-gray-700 text-amber-300 font-mono rounded-lg p-2.5 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">2FA Key (Optional):</label>
                    <input
                      type="text"
                      value={twoFactorKey}
                      onChange={(e) => setTwoFactorKey(e.target.value)}
                      placeholder="e.g. JBSWY3DPEHPK3PXP"
                      className="w-full bg-gray-950 border border-gray-700 text-emerald-300 font-mono rounded-lg p-2.5 outline-none uppercase"
                    />
                  </div>
                </>
              ) : (
                /* PRODUCT KEY DELIVERY FIELDS */
                <div>
                  <label className="text-gray-300 font-bold block mb-1">Product Activation Key:</label>
                  <input
                    type="text"
                    value={productKey}
                    onChange={(e) => setProductKey(e.target.value.toUpperCase())}
                    placeholder="e.g. JBSWY3DPEHPK3PXP"
                    className="w-full bg-gray-950 border border-gray-700 text-cyan-300 font-mono rounded-lg p-2.5 outline-none font-bold uppercase tracking-widest text-sm"
                    required
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-300 font-bold">Instructions & Notes:</label>
                  {deliveryType === 'account' && (
                    <div className="flex gap-1">
                      {INSTRUCTION_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInstructions(tmpl.text)}
                          className="text-[10px] bg-gray-800 hover:bg-gray-700 text-cyan-400 px-2 py-0.5 rounded border border-gray-700"
                        >
                          {tmpl.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Step by step instructions for customer..."
                  className="w-full bg-gray-950 border border-gray-700 text-gray-200 rounded-lg p-2.5 outline-none h-24 font-sans"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Set Order Status:</label>
                <select
                  value={orderStatus}
                  onChange={(e: any) => setOrderStatus(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-2.5 outline-none"
                >
                  <option value="completed">✓ Completed (Deliver Credentials / Key)</option>
                  <option value="processing">⏳ Processing (Keep In Queue)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-lg transition shadow-md"
                >
                  Save & Complete Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
