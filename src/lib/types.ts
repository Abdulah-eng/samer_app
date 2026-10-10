export type OrderStatus = 'processing' | 'completed' | 'cancelled';
export type CodeStatus = 'unused' | 'processing' | 'completed' | 'cancelled';
export type DeliveryType = 'account' | 'key' | 'topup';

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  defaultDeliveryType?: DeliveryType;
  createdAt: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  productId: string;
  productName?: string;
  deliveryType?: DeliveryType;
  status: CodeStatus;
  createdAt: string;
  usedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  code: string;
  productId: string;
  productName: string;
  status: OrderStatus;
  deliveryType?: DeliveryType;
  // Account Delivery:
  accountEmail?: string;
  accountPassword?: string;
  twoFactorKey?: string;
  // Product Key Delivery:
  productKey?: string;
  // Top-Up Delivery:
  topUpOrderNumber?: string;
  topUpPlatform?: 'GAMIVO' | 'G2A' | 'Driffle' | 'Other' | string;
  topUpAccountEmail?: string;
  topUpAccountPassword?: string;
  topUpNotes?: string;
  topUpSubmittedAt?: string;
  // Common:
  instructions?: string;
  customerIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  orderNumber?: string;
}

export interface StoreSettings {
  storeName: string;
  merchantName: string;
  isOnline: boolean;
  noticeText: string;
  customLogoUrl?: string;
  whatsappNumber?: string;
  telegramUsername?: string;
}
