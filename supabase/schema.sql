-- Digital Delivery Portal Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up tables and default data.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Gaming Account',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. REDEEM CODES TABLE
CREATE TABLE IF NOT EXISTS redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'cancelled')),
  delivery_type TEXT DEFAULT 'account' CHECK (delivery_type IN ('account', 'key')),
  account_email TEXT,
  account_password TEXT,
  two_factor_key TEXT,
  product_key TEXT,
  instructions TEXT,
  customer_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add columns if updating existing table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'account';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS two_factor_key TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_key TEXT;

-- 4. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  store_name TEXT DEFAULT 'IMOSTRADA',
  merchant_name TEXT DEFAULT 'imostrada',
  is_online BOOLEAN DEFAULT true,
  notice_text TEXT DEFAULT 'Delivery time starts after the redeem request is submitted. Products are delivered between 1 hour to 24 hours.'
);

-- SEED INITIAL STORE SETTINGS
INSERT INTO store_settings (id, store_name, merchant_name, is_online, notice_text)
VALUES (1, 'IMOSTRADA', 'imostrada', true, 'Delivery time starts after the redeem request is submitted. Products are delivered between 1 hour to 24 hours.')
ON CONFLICT (id) DO UPDATE SET notice_text = EXCLUDED.notice_text;

-- SEED DEMO PRODUCTS
INSERT INTO products (id, name, category, description)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Xbox Game Pass Ultimate 12 Months Account', 'Subscription', 'Xbox Live & Game Pass Ultimate account access'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'PlayStation Plus Deluxe 1 Year Key', 'Game Key', 'PSN Deluxe 12-month membership key'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Grand Theft Auto V Premium Edition Key', 'Game Key', 'Steam Product Activation Key')
ON CONFLICT (id) DO NOTHING;

-- SEED DEMO REDEEM CODES
INSERT INTO redeem_codes (code, product_id, status)
VALUES 
  ('GAMIVO-XBOX-9981', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'unused'),
  ('GAMIVO-PSN-4412', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'unused'),
  ('GAMIVO-GTA-8823', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'unused'),
  ('KINGUIN-DEMO-0001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'completed'),
  ('KINGUIN-DEMO-0002', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'completed')
ON CONFLICT (code) DO NOTHING;

-- SEED DEMO ACCOUNT ORDER
INSERT INTO orders (order_number, code, product_id, product_name, status, delivery_type, account_email, account_password, two_factor_key, instructions)
VALUES (
  'ORD-98241',
  'KINGUIN-DEMO-0001',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Xbox Game Pass Ultimate 12 Months Account',
  'completed',
  'account',
  'gamer.delivery.acc99@outlook.com',
  'PassX99!2026',
  'JBSWY3DPEHPK3PXP',
  '1. Open Xbox app or console.\n2. Add new account using the email and password above.\n3. Add the 2FA key to Google Authenticator or any authenticator app (https://2fa.co.com/).\n4. Set as Home Xbox to share subscription features across all profiles.\n5. Enjoy gaming!'
)
ON CONFLICT (code) DO NOTHING;

-- SEED DEMO PRODUCT KEY ORDER
INSERT INTO orders (order_number, code, product_id, product_name, status, delivery_type, product_key, instructions)
VALUES (
  'ORD-98242',
  'KINGUIN-DEMO-0002',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'PlayStation Plus Deluxe 1 Year Key',
  'completed',
  'key',
  'JBSWY3DPEHPK3PXP',
  'This is your product key. Redeem it on Xbox/Microsoft Store or PlayStation Network to activate your product.'
)
ON CONFLICT (code) DO NOTHING;

-- Enable Row Level Security (RLS) & Public access policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Store Settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Public Read & Insert Redeem Codes" ON redeem_codes FOR ALL USING (true);
CREATE POLICY "Public Read & Insert Orders" ON orders FOR ALL USING (true);
