import { Product, RedeemCode, Order, StoreSettings, OrderStatus, DeliveryType } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  PRODUCTS: 'delivery_portal_products',
  REDEEM_CODES: 'delivery_portal_codes',
  ORDERS: 'delivery_portal_orders',
  SETTINGS: 'delivery_portal_settings',
};

// Initial Seed Data for offline fallback mode
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Xbox Game Pass Ultimate 12 Months Account',
    category: 'Subscription',
    description: 'Xbox Live & Game Pass Ultimate account access',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'prod-2',
    name: 'PlayStation Plus Deluxe 1 Year Key',
    category: 'Game Key',
    description: 'PSN Deluxe 12-month membership key',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'prod-3',
    name: 'Grand Theft Auto V Premium Edition Key',
    category: 'Game Key',
    description: 'Steam Activation Key for GTA V',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

const INITIAL_CODES: RedeemCode[] = [
  {
    id: 'code-1',
    code: 'GAMIVO-XBOX-9981',
    productId: 'prod-1',
    productName: 'Xbox Game Pass Ultimate 12 Months Account',
    status: 'unused',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'code-2',
    code: 'GAMIVO-PSN-4412',
    productId: 'prod-2',
    productName: 'PlayStation Plus Deluxe 1 Year Key',
    status: 'unused',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'code-3',
    code: 'GAMIVO-GTA-8823',
    productId: 'prod-3',
    productName: 'Grand Theft Auto V Premium Edition Key',
    status: 'unused',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'code-4',
    code: 'KINGUIN-DEMO-0001',
    productId: 'prod-1',
    productName: 'Xbox Game Pass Ultimate 12 Months Account',
    status: 'completed',
    createdAt: '2026-10-01T00:00:00.000Z',
    usedAt: '2026-10-01T01:00:00.000Z',
  },
  {
    id: 'code-5',
    code: 'KINGUIN-DEMO-0002',
    productId: 'prod-2',
    productName: 'PlayStation Plus Deluxe 1 Year Key',
    status: 'completed',
    createdAt: '2026-10-01T00:00:00.000Z',
    usedAt: '2026-10-01T02:00:00.000Z',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'ORD-98241',
    code: 'KINGUIN-DEMO-0001',
    productId: 'prod-1',
    productName: 'Xbox Game Pass Ultimate 12 Months Account',
    status: 'completed',
    deliveryType: 'account',
    accountEmail: 'gamer.delivery.acc99@outlook.com',
    accountPassword: 'PassX99!2026',
    twoFactorKey: 'JBSWY3DPEHPK3PXP',
    instructions:
      '1. Open Xbox app or console.\n2. Add new account using the email and password above.\n3. Add the 2FA key to Google Authenticator or any authenticator app (https://2fa.co.com/).\n4. Set as Home Xbox to share subscription features across all profiles.\n5. Enjoy gaming!',
    createdAt: '2026-10-01T01:00:00.000Z',
    updatedAt: '2026-10-01T01:15:00.000Z',
  },
  {
    id: 'ord-1002',
    orderNumber: 'ORD-98242',
    code: 'KINGUIN-DEMO-0002',
    productId: 'prod-2',
    productName: 'PlayStation Plus Deluxe 1 Year Key',
    status: 'completed',
    deliveryType: 'key',
    productKey: 'JBSWY3DPEHPK3PXP',
    instructions:
      'This is your product key. Redeem it on Xbox/Microsoft Store to activate your product.',
    createdAt: '2026-10-01T02:00:00.000Z',
    updatedAt: '2026-10-01T02:15:00.000Z',
  },
];

const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'IMOSTRADA',
  merchantName: 'imostrada',
  isOnline: true,
  noticeText:
    'Delivery time starts after the redeem request is submitted. Products are delivered between 1 hour to 24 hours.',
};

// Local storage helpers
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

// ---------------- PRODUCTS SERVICE ----------------
export async function getProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data) {
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        createdAt: item.created_at,
      }));
    }
  }
  return getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newProduct: Product = {
    ...product,
    id: 'prod-' + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        category: product.category,
        description: product.description,
      })
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        name: data.name,
        category: data.category,
        description: data.description,
        createdAt: data.created_at,
      };
    }
  }

  const products = await getProducts();
  const updated = [newProduct, ...products];
  setLocal(STORAGE_KEYS.PRODUCTS, updated);
  return newProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) return true;
  }
  const products = await getProducts();
  const updated = products.filter((p) => p.id !== id);
  setLocal(STORAGE_KEYS.PRODUCTS, updated);
  return true;
}

// ---------------- REDEEM CODES SERVICE ----------------
export async function getRedeemCodes(): Promise<RedeemCode[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('redeem_codes')
      .select('*, products(name)');
    if (!error && data) {
      return data.map((item) => ({
        id: item.id,
        code: item.code,
        productId: item.product_id,
        productName: item.products?.name || 'Unknown Product',
        status: item.status,
        createdAt: item.created_at,
        usedAt: item.used_at,
      }));
    }
  }
  return getLocal<RedeemCode[]>(STORAGE_KEYS.REDEEM_CODES, INITIAL_CODES);
}

export async function addRedeemCode(codeStr: string, productId: string): Promise<RedeemCode> {
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);

  const cleanCode = codeStr.trim().toUpperCase();
  const newCode: RedeemCode = {
    id: 'code-' + Math.random().toString(36).substring(2, 9),
    code: cleanCode,
    productId,
    productName: product?.name || 'Digital Product',
    status: 'unused',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('redeem_codes')
      .insert({
        code: cleanCode,
        product_id: productId,
        status: 'unused',
      })
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        code: data.code,
        productId: data.product_id,
        productName: product?.name || 'Digital Product',
        status: data.status,
        createdAt: data.created_at,
      };
    }
  }

  const codes = await getRedeemCodes();
  // Prevent duplicate code entry
  if (codes.some((c) => c.code.toUpperCase() === cleanCode)) {
    throw new Error(`Code '${cleanCode}' already exists in database.`);
  }

  const updated = [newCode, ...codes];
  setLocal(STORAGE_KEYS.REDEEM_CODES, updated);
  return newCode;
}

export async function bulkAddRedeemCodes(
  codesList: string[],
  productId: string
): Promise<{ added: number; skipped: number }> {
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);
  const existing = await getRedeemCodes();
  const existingSet = new Set(existing.map((c) => c.code.toUpperCase()));

  let added = 0;
  let skipped = 0;
  const newEntries: RedeemCode[] = [];

  for (const rawCode of codesList) {
    const clean = rawCode.trim().toUpperCase();
    if (!clean || existingSet.has(clean)) {
      skipped++;
      continue;
    }

    existingSet.add(clean);
    added++;
    newEntries.push({
      id: 'code-' + Math.random().toString(36).substring(2, 9),
      code: clean,
      productId,
      productName: product?.name || 'Digital Product',
      status: 'unused',
      createdAt: new Date().toISOString(),
    });
  }

  if (isSupabaseConfigured && supabase && newEntries.length > 0) {
    const supabasePayload = newEntries.map((c) => ({
      code: c.code,
      product_id: productId,
      status: 'unused',
    }));
    await supabase.from('redeem_codes').insert(supabasePayload);
  }

  const updatedCodes = [...newEntries, ...existing];
  setLocal(STORAGE_KEYS.REDEEM_CODES, updatedCodes);
  return { added, skipped };
}

export async function deleteRedeemCode(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('redeem_codes').delete().eq('id', id);
  }
  const codes = await getRedeemCodes();
  const updated = codes.filter((c) => c.id !== id);
  setLocal(STORAGE_KEYS.REDEEM_CODES, updated);
  return true;
}

// ---------------- ORDERS & REDEMPTION WORKFLOW ----------------
export async function verifyAndRedeemCode(rawCode: string): Promise<{ success: boolean; message: string; order?: Order }> {
  const cleanCode = rawCode.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'Please enter a valid redeem code.' };
  }

  // Check if code has already been redeemed or exists
  const codes = await getRedeemCodes();
  const foundCode = codes.find((c) => c.code.toUpperCase() === cleanCode);

  if (!foundCode) {
    return {
      success: false,
      message: 'Invalid redeem code. Please check your GAMIVO/Kinguin key and try again.',
    };
  }

  if (foundCode.status === 'completed' || foundCode.status === 'processing') {
    const orders = await getOrders();
    const existingOrder = orders.find((o) => o.code.toUpperCase() === cleanCode);
    if (existingOrder) {
      return {
        success: true,
        message: 'This redeem code was already activated. Redirecting to your order status...',
        order: existingOrder,
      };
    }
  }

  if (foundCode.status !== 'unused') {
    return {
      success: false,
      message: 'This redeem code has already been used or is inactive.',
    };
  }

  // Determine default delivery type based on product name/category
  const isKeyType = foundCode.productName?.toLowerCase().includes('key') || foundCode.productName?.toLowerCase().includes('code');
  const defaultDeliveryType: DeliveryType = isKeyType ? 'key' : 'account';

  // Create new Order with status 'processing'
  const orderNumber = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
  const newOrder: Order = {
    id: 'ord-' + Math.random().toString(36).substring(2, 9),
    orderNumber,
    code: cleanCode,
    productId: foundCode.productId,
    productName: foundCode.productName || 'Digital Product',
    status: 'processing',
    deliveryType: defaultDeliveryType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mark code as 'processing'
  foundCode.status = 'processing';
  foundCode.usedAt = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    await supabase.from('redeem_codes').update({ status: 'processing', used_at: foundCode.usedAt }).eq('code', cleanCode);
    await supabase.from('orders').insert({
      order_number: orderNumber,
      code: cleanCode,
      product_id: foundCode.productId,
      product_name: newOrder.productName,
      status: 'processing',
      delivery_type: defaultDeliveryType,
    });
  }

  const updatedCodes = codes.map((c) => (c.code.toUpperCase() === cleanCode ? foundCode : c));
  setLocal(STORAGE_KEYS.REDEEM_CODES, updatedCodes);

  const existingOrders = await getOrders();
  setLocal(STORAGE_KEYS.ORDERS, [newOrder, ...existingOrders]);

  return {
    success: true,
    message: 'Redeem code verified! Your order has been placed and is currently being processed.',
    order: newOrder,
  };
}

export async function getOrders(): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return data.map((item) => ({
        id: item.id,
        orderNumber: item.order_number,
        code: item.code,
        productId: item.product_id,
        productName: item.product_name,
        status: item.status,
        deliveryType: (item.delivery_type as DeliveryType) || 'account',
        accountEmail: item.account_email,
        accountPassword: item.account_password,
        twoFactorKey: item.two_factor_key,
        productKey: item.product_key,
        instructions: item.instructions,
        customerIp: item.customer_ip,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    }
  }
  return getLocal<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
}

export async function getOrderDetails(codeOrOrderNumber: string): Promise<Order | null> {
  const query = codeOrOrderNumber.trim().toUpperCase();
  if (!query) return null;

  const orders = await getOrders();
  const match = orders.find(
    (o) => o.code.toUpperCase() === query || o.orderNumber.toUpperCase() === query || o.id === codeOrOrderNumber
  );

  return match || null;
}

export async function updateOrderDelivery(
  orderId: string,
  deliveryData: {
    deliveryType?: DeliveryType;
    accountEmail?: string;
    accountPassword?: string;
    twoFactorKey?: string;
    productKey?: string;
    instructions?: string;
    status: OrderStatus;
  }
): Promise<Order> {
  const orders = await getOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId);

  if (orderIndex === -1) {
    throw new Error('Order not found');
  }

  const existing = orders[orderIndex];
  const updatedOrder: Order = {
    ...existing,
    ...deliveryData,
    updatedAt: new Date().toISOString(),
  };

  // Sync back to redeem code status if needed
  const codes = await getRedeemCodes();
  const targetCode = codes.find((c) => c.code.toUpperCase() === updatedOrder.code.toUpperCase());
  if (targetCode) {
    targetCode.status = updatedOrder.status;
    const updatedCodesList = codes.map((c) => (c.id === targetCode.id ? targetCode : c));
    setLocal(STORAGE_KEYS.REDEEM_CODES, updatedCodesList);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('redeem_codes').update({ status: updatedOrder.status }).eq('id', targetCode.id);
    }
  }

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('orders')
      .update({
        delivery_type: deliveryData.deliveryType || existing.deliveryType || 'account',
        account_email: deliveryData.accountEmail,
        account_password: deliveryData.accountPassword,
        two_factor_key: deliveryData.twoFactorKey,
        product_key: deliveryData.productKey,
        instructions: deliveryData.instructions,
        status: deliveryData.status,
        updated_at: updatedOrder.updatedAt,
      })
      .eq('id', orderId);
  }

  orders[orderIndex] = updatedOrder;
  setLocal(STORAGE_KEYS.ORDERS, orders);
  return updatedOrder;
}

// ---------------- STORE SETTINGS SERVICE ----------------
export async function getStoreSettings(): Promise<StoreSettings> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('store_settings').select('*').single();
    if (data) {
      return {
        storeName: data.store_name,
        merchantName: data.merchant_name,
        isOnline: data.is_online,
        noticeText: data.notice_text,
      };
    }
  }
  return getLocal<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const updated = { ...current, ...settings };

  if (isSupabaseConfigured && supabase) {
    await supabase.from('store_settings').upsert({
      id: 1,
      store_name: updated.storeName,
      merchant_name: updated.merchantName,
      is_online: updated.isOnline,
      notice_text: updated.noticeText,
    });
  }

  setLocal(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}
