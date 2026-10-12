import { Product, RedeemCode, Order, StoreSettings, OrderStatus, DeliveryType, ChatMessage } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  PRODUCTS: 'delivery_portal_products',
  REDEEM_CODES: 'delivery_portal_codes',
  ORDERS: 'delivery_portal_orders',
  SETTINGS: 'delivery_portal_settings',
  CHAT_MESSAGES: 'delivery_portal_chat_messages',
};

// Initial Seed Data for offline fallback mode
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Xbox Game Pass Ultimate 12 Months Account',
    category: 'Subscription',
    description: 'Xbox Live & Game Pass Ultimate account access',
    defaultDeliveryType: 'account',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'prod-2',
    name: 'PlayStation Plus Deluxe 1 Year Key',
    category: 'Game Key',
    description: 'PSN Deluxe 12-month membership key',
    defaultDeliveryType: 'key',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'prod-3',
    name: 'Fortnite 800 V-Bucks Top Up',
    category: 'Top-Up Service',
    description: 'Direct In-Game Top-Up for Fortnite (Xbox/PlayStation/PC)',
    defaultDeliveryType: 'topup',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

const INITIAL_CODES: RedeemCode[] = [
  {
    id: 'code-1',
    code: 'GAMIVO-XBOX-9981',
    productId: 'prod-1',
    productName: 'Xbox Game Pass Ultimate 12 Months Account',
    deliveryType: 'account',
    status: 'unused',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'code-2',
    code: 'GAMIVO-PSN-4412',
    productId: 'prod-2',
    productName: 'PlayStation Plus Deluxe 1 Year Key',
    deliveryType: 'key',
    status: 'unused',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'code-3',
    code: 'GAMIVO-VBUCKS-8823',
    productId: 'prod-3',
    productName: 'Fortnite 800 V-Bucks Top Up',
    deliveryType: 'topup',
    status: 'unused',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

const INITIAL_ORDERS: Order[] = [];

const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'IMOSTRADA',
  merchantName: 'imostrada',
  isOnline: true,
  onlineStatus: 'online',
  noticeText:
    'Delivery time starts after the redeem request is submitted. Products are delivered between 1 hour to 24 hours.',
  whatsappNumber: '+1234567890',
  telegramUsername: 'imostrada_support',
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
  const mapProduct = (item: any): Product => {
    let description = item.description || '';
    let imageUrl = item.image_url || item.imageUrl || undefined;
    if (!imageUrl && description.includes('[IMAGE:')) {
      const match = description.match(/\[IMAGE:([\s\S]*?)\]/);
      if (match) {
        imageUrl = match[1];
        description = description.replace(match[0], '').trim();
      }
    }
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      description,
      imageUrl,
      defaultDeliveryType: item.default_delivery_type || item.defaultDeliveryType || 'account',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    };
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(mapProduct);
    }
  }

  const local = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  return local.map(mapProduct);
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newProduct: Product = {
    ...product,
    id: 'prod-' + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
  };

  const descToStore = product.imageUrl
    ? `[IMAGE:${product.imageUrl}]\n${product.description || ''}`.trim()
    : product.description;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        category: product.category,
        description: descToStore,
        default_delivery_type: product.defaultDeliveryType || 'account',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase addProduct error:', error);
      throw new Error(`Database error adding product: ${error.message}. Please verify Supabase RLS permissions.`);
    }

    if (data) {
      return {
        id: data.id,
        name: data.name,
        category: data.category,
        description: product.description,
        imageUrl: product.imageUrl,
        defaultDeliveryType: data.default_delivery_type || 'account',
        createdAt: data.created_at,
      };
    }
  }

  const products = await getProducts();
  const updated = [newProduct, ...products];
  setLocal(STORAGE_KEYS.PRODUCTS, updated);
  return newProduct;
}

export async function updateProduct(
  id: string,
  updatedData: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<Product> {
  const products = await getProducts();
  const existingIndex = products.findIndex((p) => p.id === id);
  if (existingIndex === -1) {
    throw new Error('Product not found');
  }

  const existing = products[existingIndex];
  const updatedProduct: Product = {
    ...existing,
    ...updatedData,
  };

  const descToStore = updatedProduct.imageUrl
    ? `[IMAGE:${updatedProduct.imageUrl}]\n${updatedProduct.description || ''}`.trim()
    : updatedProduct.description;

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('products')
      .update({
        name: updatedProduct.name,
        category: updatedProduct.category,
        description: descToStore,
        default_delivery_type: updatedProduct.defaultDeliveryType || 'account',
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase updateProduct error:', error);
      throw new Error(`Database error updating product: ${error.message}.`);
    }
  }

  products[existingIndex] = updatedProduct;
  setLocal(STORAGE_KEYS.PRODUCTS, products);
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteProduct error:', error);
      throw new Error(`Database error deleting product: ${error.message}. Please verify Supabase RLS permissions.`);
    }
    return true;
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
        deliveryType: (item.delivery_type as DeliveryType) || 'account',
        status: item.status,
        createdAt: item.created_at,
        usedAt: item.used_at,
      }));
    }
  }
  return getLocal<RedeemCode[]>(STORAGE_KEYS.REDEEM_CODES, INITIAL_CODES);
}

export async function addRedeemCode(
  codeStr: string,
  productId: string,
  deliveryType: DeliveryType = 'account'
): Promise<RedeemCode> {
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);

  const cleanCode = codeStr.trim().toUpperCase();
  const resolvedDeliveryType = deliveryType || product?.defaultDeliveryType || 'account';

  const newCode: RedeemCode = {
    id: 'code-' + Math.random().toString(36).substring(2, 9),
    code: cleanCode,
    productId,
    productName: product?.name || 'Digital Product',
    deliveryType: resolvedDeliveryType,
    status: 'unused',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('redeem_codes')
      .insert({
        code: cleanCode,
        product_id: productId,
        delivery_type: resolvedDeliveryType,
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
        deliveryType: data.delivery_type || resolvedDeliveryType,
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
  productId: string,
  deliveryType: DeliveryType = 'account'
): Promise<{ added: number; skipped: number }> {
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);
  const existing = await getRedeemCodes();
  const existingSet = new Set(existing.map((c) => c.code.toUpperCase()));

  const resolvedDeliveryType = deliveryType || product?.defaultDeliveryType || 'account';

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
      deliveryType: resolvedDeliveryType,
      status: 'unused',
      createdAt: new Date().toISOString(),
    });
  }

  if (isSupabaseConfigured && supabase && newEntries.length > 0) {
    const supabasePayload = newEntries.map((c) => ({
      code: c.code,
      product_id: productId,
      delivery_type: resolvedDeliveryType,
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
export async function verifyAndRedeemCode(rawCode: string): Promise<{
  success: boolean;
  message: string;
  isTopUp?: boolean;
  order?: Order;
}> {
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
      message: 'Invalid redeem code. Please check your GAMIVO, G2A or Driffle key and try again.',
    };
  }

  if (foundCode.status === 'completed' || foundCode.status === 'processing') {
    const orders = await getOrders();
    const existingOrder = orders.find((o) => o.code.toUpperCase() === cleanCode);
    if (existingOrder) {
      return {
        success: true,
        message: 'This redeem code was already activated. Redirecting to your order status...',
        isTopUp: existingOrder.deliveryType === 'topup',
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

  // Determine delivery type
  let determinedDeliveryType: DeliveryType = foundCode.deliveryType || 'account';
  const pName = (foundCode.productName || '').toLowerCase();
  if (
    pName.includes('top up') ||
    pName.includes('top-up') ||
    pName.includes('v-bucks') ||
    pName.includes('coins') ||
    pName.includes('points')
  ) {
    determinedDeliveryType = 'topup';
  } else if (!foundCode.deliveryType && (pName.includes('key') || pName.includes('code'))) {
    determinedDeliveryType = 'key';
  }

  // Create new Order with status 'processing'
  const orderNumber = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
  const newOrder: Order = {
    id: 'ord-' + Math.random().toString(36).substring(2, 9),
    orderNumber,
    code: cleanCode,
    productId: foundCode.productId,
    productName: foundCode.productName || 'Digital Product',
    status: 'processing',
    deliveryType: determinedDeliveryType,
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
      delivery_type: determinedDeliveryType,
    });
  }

  const updatedCodes = codes.map((c) => (c.code.toUpperCase() === cleanCode ? foundCode : c));
  setLocal(STORAGE_KEYS.REDEEM_CODES, updatedCodes);

  const existingOrders = await getOrders();
  setLocal(STORAGE_KEYS.ORDERS, [newOrder, ...existingOrders]);

  return {
    success: true,
    message: 'Redeem code verified! Your order has been placed and is currently being processed.',
    isTopUp: determinedDeliveryType === 'topup',
    order: newOrder,
  };
}

// ---------------- TOP-UP SERVICE SUBMISSION ----------------
export async function submitTopUpRequest(
  orderId: string,
  topUpData: {
    topUpOrderNumber: string;
    topUpPlatform: string;
    topUpAccountEmail: string;
    topUpAccountPassword?: string;
    topUpNotes?: string;
  }
): Promise<Order> {
  const orders = await getOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId || o.code.toUpperCase() === orderId.toUpperCase());
  if (orderIndex === -1) {
    throw new Error('Order not found');
  }

  const existing = orders[orderIndex];
  const updatedOrder: Order = {
    ...existing,
    ...topUpData,
    status: 'processing',
    topUpSubmittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('orders')
      .update({
        top_up_order_number: topUpData.topUpOrderNumber,
        top_up_platform: topUpData.topUpPlatform,
        top_up_account_email: topUpData.topUpAccountEmail,
        top_up_account_password: topUpData.topUpAccountPassword,
        top_up_notes: topUpData.topUpNotes,
        top_up_submitted_at: updatedOrder.topUpSubmittedAt,
        status: 'processing',
        updated_at: updatedOrder.updatedAt,
      })
      .eq('id', existing.id);
  }

  orders[orderIndex] = updatedOrder;
  setLocal(STORAGE_KEYS.ORDERS, orders);
  return updatedOrder;
}

export async function getOrders(): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return data.map((item) => {
        let dType: DeliveryType = (item.delivery_type as DeliveryType) || 'account';
        const pLower = (item.product_name || '').toLowerCase();
        if (
          dType === 'topup' ||
          pLower.includes('top up') ||
          pLower.includes('top-up') ||
          pLower.includes('v-bucks') ||
          pLower.includes('coins') ||
          pLower.includes('points') ||
          item.top_up_account_email ||
          item.top_up_order_number
        ) {
          dType = 'topup';
        } else if (dType !== 'account' || pLower.includes('key') || pLower.includes('code')) {
          if (item.product_key || pLower.includes('key')) {
            dType = 'key';
          }
        }

        return {
          id: item.id,
          orderNumber: item.order_number,
          code: item.code,
          productId: item.product_id,
          productName: item.product_name,
          status: item.status,
          deliveryType: dType,
          accountEmail: item.account_email,
          accountPassword: item.account_password,
          twoFactorKey: item.two_factor_key,
          productKey: item.product_key,
          topUpOrderNumber: item.top_up_order_number,
          topUpPlatform: item.top_up_platform,
          topUpAccountEmail: item.top_up_account_email,
          topUpAccountPassword: item.top_up_account_password,
          topUpNotes: item.top_up_notes,
          topUpSubmittedAt: item.top_up_submitted_at,
          instructions: item.instructions,
          customerIp: item.customer_ip,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };
      });
    }
  }

  const localOrders = getLocal<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  return localOrders.map((o) => {
    let dType = o.deliveryType || 'account';
    const pLower = (o.productName || '').toLowerCase();
    if (
      dType === 'topup' ||
      pLower.includes('top up') ||
      pLower.includes('top-up') ||
      pLower.includes('v-bucks') ||
      pLower.includes('coins') ||
      o.topUpAccountEmail ||
      o.topUpOrderNumber
    ) {
      dType = 'topup';
    }
    return { ...o, deliveryType: dType };
  });
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
    topUpOrderNumber?: string;
    topUpPlatform?: string;
    topUpAccountEmail?: string;
    topUpAccountPassword?: string;
    topUpNotes?: string;
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
        top_up_order_number: deliveryData.topUpOrderNumber,
        top_up_platform: deliveryData.topUpPlatform,
        top_up_account_email: deliveryData.topUpAccountEmail,
        top_up_account_password: deliveryData.topUpAccountPassword,
        top_up_notes: deliveryData.topUpNotes,
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

export async function deleteOrder(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('orders').delete().eq('id', id);
  }
  const orders = await getOrders();
  const updated = orders.filter((o) => o.id !== id);
  setLocal(STORAGE_KEYS.ORDERS, updated);
  return true;
}

// ---------------- LIVE CHAT MESSAGES SERVICE ----------------
export async function getChatMessages(sessionId?: string): Promise<ChatMessage[]> {
  const mapRowToMsg = (d: any): ChatMessage => {
    let rawText = d.text || '';
    let imageUrl = d.image_url || undefined;
    if (!imageUrl && rawText.includes('[IMAGE_ATTACHMENT:')) {
      const match = rawText.match(/\[IMAGE_ATTACHMENT:([\s\S]*?)\]/);
      if (match) {
        imageUrl = match[1];
        rawText = rawText.replace(match[0], '').trim();
      }
    }

    return {
      id: String(d.id),
      sessionId: d.session_id || 'general',
      sender: d.sender,
      text: rawText,
      imageUrl,
      orderNumber: d.order_number,
      customerLabel: d.customer_label || (d.order_number ? `Order #${d.order_number}` : undefined),
      timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(mapRowToMsg);
      } else if (error && sessionId) {
        // Fallback: if session_id column does not exist yet on Supabase
        const fallback = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          return fallback.data.map(mapRowToMsg);
        }
      }
    } catch (e) {
      console.warn('Supabase getChatMessages warning', e);
    }
  }

  const allLocal = getLocal<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, [
    {
      id: 'msg-1',
      sessionId: 'general',
      sender: 'agent',
      text: 'Hello! 👋 Welcome to IMOSTRADA Live Support. How can we help you with your redeem code, order or top-up today?',
      timestamp: 'Just now',
    },
  ]);

  const sanitizedLocal = allLocal.map((m) => {
    let rawText = m.text || '';
    let imageUrl = m.imageUrl;
    if (!imageUrl && rawText.includes('[IMAGE_ATTACHMENT:')) {
      const match = rawText.match(/\[IMAGE_ATTACHMENT:([\s\S]*?)\]/);
      if (match) {
        imageUrl = match[1];
        rawText = rawText.replace(match[0], '').trim();
      }
    }
    return { ...m, text: rawText, imageUrl };
  });

  if (sessionId) {
    return sanitizedLocal.filter((m) => m.sessionId === sessionId || m.sessionId === 'general');
  }
  return sanitizedLocal;
}

export async function sendChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: 'msg-' + Date.now(),
    sessionId: msg.sessionId || 'general',
    sender: msg.sender,
    text: msg.text || '',
    imageUrl: msg.imageUrl,
    orderNumber: msg.orderNumber,
    customerLabel: msg.customerLabel,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const textToStore = newMsg.imageUrl
        ? `[IMAGE_ATTACHMENT:${newMsg.imageUrl}]\n${newMsg.text || ''}`.trim()
        : newMsg.text;

      const { error } = await supabase.from('chat_messages').insert({
        session_id: newMsg.sessionId,
        sender: newMsg.sender,
        text: textToStore,
        order_number: newMsg.orderNumber,
        customer_label: newMsg.customerLabel,
      });

      if (error) {
        // Fallback for tables without session_id and customer_label columns
        await supabase.from('chat_messages').insert({
          sender: newMsg.sender,
          text: textToStore,
          order_number: newMsg.orderNumber,
        });
      }
    } catch (e) {
      console.warn('Supabase chat insert warning', e);
    }
  }

  const existing = getLocal<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
  const updated = [...existing, newMsg];
  setLocal(STORAGE_KEYS.CHAT_MESSAGES, updated);

  // Trigger email alert to admin on customer message
  if (newMsg.sender === 'user' && typeof window !== 'undefined') {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: newMsg.text || (newMsg.imageUrl ? '[Attached Image / Screenshot]' : ''),
        hasImage: Boolean(newMsg.imageUrl),
        customerCode: newMsg.orderNumber,
        customerLabel: newMsg.customerLabel,
        timestamp: newMsg.timestamp,
      }),
    }).catch(() => {
      // non-blocking
    });
  }

  // Dispatch custom window event so customer widget and admin panel update instantly
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('imostrada_chat_update', { detail: newMsg }));
  }

  return newMsg;
}

export async function deleteChatMessage(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('chat_messages').delete().eq('id', id);
      if (error) console.warn('Supabase deleteChatMessage error', error);
    } catch (e) {
      console.warn('Supabase deleteChatMessage catch', e);
    }
  }

  const existing = getLocal<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
  const updated = existing.filter((m) => m.id !== id);
  setLocal(STORAGE_KEYS.CHAT_MESSAGES, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('imostrada_chat_update'));
  }
  return true;
}

export async function deleteChatConversation(sessionId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('chat_messages').delete();
      if (sessionId === 'general') {
        query = query.or(`session_id.eq.general,session_id.is.null`);
      } else {
        query = query.eq('session_id', sessionId);
      }
      const { error } = await query;
      if (error) console.warn('Supabase deleteChatConversation error', error);
    } catch (e) {
      console.warn('Supabase deleteChatConversation catch', e);
    }
  }

  const existing = getLocal<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
  const updated = existing.filter((m) => (m.sessionId || 'general') !== sessionId);
  setLocal(STORAGE_KEYS.CHAT_MESSAGES, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('imostrada_chat_update'));
  }
  return true;
}

// ---------------- STORE SETTINGS SERVICE ----------------
export async function getStoreSettings(): Promise<StoreSettings> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('store_settings').select('*').single();
    if (data) {
      let onlineStatus: import('./types').OnlineStatus = 'online';
      let cleanNotice = data.notice_text || '';

      if (cleanNotice.includes('<!--status:sleeping-->')) {
        onlineStatus = 'sleeping';
        cleanNotice = cleanNotice.replace('<!--status:sleeping-->', '').trim();
      } else if (cleanNotice.includes('<!--status:offline-->') || data.is_online === false) {
        onlineStatus = 'offline';
        cleanNotice = cleanNotice.replace('<!--status:offline-->', '').trim();
      } else if (data.online_status) {
        onlineStatus = data.online_status;
      } else {
        onlineStatus = 'online';
      }

      return {
        storeName: data.store_name,
        merchantName: data.merchant_name,
        isOnline: onlineStatus !== 'offline',
        onlineStatus,
        noticeText: cleanNotice,
        whatsappNumber: data.whatsapp_number,
        telegramUsername: data.telegram_username,
      };
    }
  }
  const local = getLocal<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  let localStatus: import('./types').OnlineStatus = local.onlineStatus || (local.isOnline ? 'online' : 'offline');
  let cleanLocalNotice = local.noticeText || '';
  if (cleanLocalNotice.includes('<!--status:sleeping-->')) {
    localStatus = 'sleeping';
    cleanLocalNotice = cleanLocalNotice.replace('<!--status:sleeping-->', '').trim();
  }
  return {
    ...local,
    isOnline: localStatus !== 'offline',
    onlineStatus: localStatus,
    noticeText: cleanLocalNotice,
  };
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const effectiveOnlineStatus =
    settings.onlineStatus ||
    (settings.isOnline === false ? 'offline' : current.onlineStatus || 'online');
  const effectiveIsOnline = effectiveOnlineStatus !== 'offline';

  let rawNotice = (settings.noticeText !== undefined ? settings.noticeText : current.noticeText) || '';
  rawNotice = rawNotice.replace(/<!--status:[a-z]+-->/g, '').trim();

  let payloadNotice = rawNotice;
  if (effectiveOnlineStatus === 'sleeping') {
    payloadNotice = `<!--status:sleeping-->${rawNotice}`;
  } else if (effectiveOnlineStatus === 'offline') {
    payloadNotice = `<!--status:offline-->${rawNotice}`;
  }

  const updated: StoreSettings = {
    ...current,
    ...settings,
    isOnline: effectiveIsOnline,
    onlineStatus: effectiveOnlineStatus,
    noticeText: rawNotice,
  };

  if (isSupabaseConfigured && supabase) {
    const updatePayload: any = {
      store_name: updated.storeName,
      merchant_name: updated.merchantName,
      is_online: effectiveIsOnline,
      notice_text: payloadNotice,
    };
    if (updated.onlineStatus) {
      updatePayload.online_status = updated.onlineStatus;
    }

    let { data: updateData, error: updateError } = await supabase
      .from('store_settings')
      .update(updatePayload)
      .eq('id', 1)
      .select();

    // Fallback if online_status column does not exist on Supabase table
    if (updateError && updatePayload.online_status) {
      delete updatePayload.online_status;
      const retry = await supabase
        .from('store_settings')
        .update(updatePayload)
        .eq('id', 1)
        .select();
      updateData = retry.data;
      updateError = retry.error;
    }

    if (!updateError && (!updateData || updateData.length === 0)) {
      await supabase.from('store_settings').insert({
        id: 1,
        ...updatePayload,
      });
    }
  }

  setLocal(STORAGE_KEYS.SETTINGS, {
    ...updated,
    noticeText: payloadNotice,
  });
  return updated;
}

// ---------------- CHAT REDEEM CODE VALIDATION ----------------
export async function validateChatRedeemCode(rawCode: string): Promise<{
  valid: boolean;
  code?: string;
  productName?: string;
  orderNumber?: string;
  message: string;
}> {
  const clean = rawCode.trim().toUpperCase();
  if (!clean) {
    return { valid: false, message: 'Please enter a redeem code.' };
  }

  try {
    // 1. Check in Supabase redeem_codes
    if (isSupabaseConfigured && supabase) {
      const { data: codeData } = await supabase
        .from('redeem_codes')
        .select('*')
        .ilike('code', clean)
        .limit(1);

      if (codeData && codeData.length > 0) {
        const found = codeData[0];
        return {
          valid: true,
          code: found.code,
          productName: found.product_name,
          orderNumber: found.code,
          message: 'Valid redeem code verified!',
        };
      }

      // Check in Supabase orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .or(`code.ilike.${clean},order_number.ilike.${clean},top_up_order_number.ilike.${clean}`)
        .limit(1);

      if (orderData && orderData.length > 0) {
        const found = orderData[0];
        return {
          valid: true,
          code: found.code || found.order_number,
          productName: found.product_name,
          orderNumber: found.order_number,
          message: 'Valid redeem code verified!',
        };
      }
    }

    // 2. Fallback check in local storage / in-memory store
    const codes = await getRedeemCodes();
    const foundCode = codes.find((c) => c.code.toUpperCase() === clean);
    if (foundCode) {
      return {
        valid: true,
        code: foundCode.code,
        productName: foundCode.productName,
        orderNumber: foundCode.code,
        message: 'Valid redeem code verified!',
      };
    }

    const orders = await getOrders();
    const foundOrder = orders.find(
      (o) =>
        o.code.toUpperCase() === clean ||
        o.orderNumber.toUpperCase() === clean ||
        (o.topUpOrderNumber && o.topUpOrderNumber.toUpperCase() === clean)
    );
    if (foundOrder) {
      return {
        valid: true,
        code: foundOrder.code || foundOrder.orderNumber,
        productName: foundOrder.productName,
        orderNumber: foundOrder.orderNumber,
        message: 'Valid redeem code verified!',
      };
    }
  } catch (err) {
    console.warn('Error validating chat redeem code:', err);
  }

  return {
    valid: false,
    message: `Invalid redeem code "${clean}". This code was not found in our database.`,
  };
}
