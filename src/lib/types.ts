export type OrderStatus = 'processing' | 'completed' | 'cancelled';
export type CodeStatus = 'unused' | 'processing' | 'completed' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  createdAt: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  productId: string;
  productName?: string;
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
  accountEmail?: string;
  accountPassword?: string;
  instructions?: string;
  customerIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  merchantName: string;
  isOnline: boolean;
  noticeText: string;
  customLogoUrl?: string;
}
