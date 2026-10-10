-- Digital Delivery Portal Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up or update tables and columns.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Gaming Account',
  description TEXT,
  default_delivery_type TEXT DEFAULT 'account',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure default_delivery_type exists if table already existed
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_delivery_type TEXT DEFAULT 'account';

-- 2. REDEEM CODES TABLE
CREATE TABLE IF NOT EXISTS redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  delivery_type TEXT DEFAULT 'account',
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Ensure delivery_type exists if table already existed
ALTER TABLE redeem_codes ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'account';

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'cancelled')),
  delivery_type TEXT DEFAULT 'account',
  -- Account Delivery:
  account_email TEXT,
  account_password TEXT,
  two_factor_key TEXT,
  -- Product Key Delivery:
  product_key TEXT,
  -- Top-Up Service Delivery:
  top_up_order_number TEXT,
  top_up_platform TEXT,
  top_up_account_email TEXT,
  top_up_account_password TEXT,
  top_up_notes TEXT,
  top_up_submitted_at TIMESTAMP WITH TIME ZONE,
  -- Common:
  instructions TEXT,
  customer_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add Top-Up and Key columns if updating an existing table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'account';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS two_factor_key TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_key TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_order_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_platform TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_account_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_account_password TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_submitted_at TIMESTAMP WITH TIME ZONE;

-- Update constraint on delivery_type to support 'topup'
DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_type_check;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE orders ADD CONSTRAINT orders_delivery_type_check CHECK (delivery_type IN ('account', 'key', 'topup'));

-- 4. LIVE CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender TEXT NOT NULL CHECK (sender IN ('user', 'agent')),
  text TEXT NOT NULL,
  order_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  store_name TEXT DEFAULT 'IMOSTRADA',
  merchant_name TEXT DEFAULT 'imostrada',
  is_online BOOLEAN DEFAULT true,
  notice_text TEXT DEFAULT 'Delivery time starts after the redeem request is submitted. Products are delivered between 1 hour to 24 hours.',
  whatsapp_number TEXT DEFAULT '+1234567890',
  telegram_username TEXT DEFAULT 'imostrada_support'
);

ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '+1234567890';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS telegram_username TEXT DEFAULT 'imostrada_support';

-- SEED INITIAL STORE SETTINGS
INSERT INTO store_settings (id, store_name, merchant_name, is_online, notice_text)
VALUES (1, 'IMOSTRADA', 'imostrada', true, 'Delivery time starts after the redeem request is submitted. Products are delivered between 1 hour to 24 hours.')
ON CONFLICT (id) DO UPDATE SET notice_text = EXCLUDED.notice_text;

-- SEED PRODUCTS (GAMIVO, G2A, DRIFFLE)
INSERT INTO products (id, name, category, description, default_delivery_type)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Xbox Game Pass Ultimate 12 Months Account', 'Subscription', 'Xbox Live & Game Pass Ultimate account access', 'account'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'PlayStation Plus Deluxe 1 Year Key', 'Game Key', 'PSN Deluxe 12-month membership key', 'key'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Fortnite 800 V-Bucks Top Up', 'Top-Up Service', 'Direct In-Game Top-Up for Fortnite', 'topup')
ON CONFLICT (id) DO NOTHING;

-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist before recreating to avoid duplicate policy errors
DROP POLICY IF EXISTS "Public Read Products" ON products;
DROP POLICY IF EXISTS "Public Full Access Products" ON products;
CREATE POLICY "Public Full Access Products" ON products FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Store Settings" ON store_settings;
DROP POLICY IF EXISTS "Public Full Access Store Settings" ON store_settings;
CREATE POLICY "Public Full Access Store Settings" ON store_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read & Insert Redeem Codes" ON redeem_codes;
DROP POLICY IF EXISTS "Public Full Access Redeem Codes" ON redeem_codes;
CREATE POLICY "Public Full Access Redeem Codes" ON redeem_codes FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read & Insert Orders" ON orders;
DROP POLICY IF EXISTS "Public Full Access Orders" ON orders;
CREATE POLICY "Public Full Access Orders" ON orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Full Access Chat Messages" ON chat_messages;
CREATE POLICY "Public Full Access Chat Messages" ON chat_messages FOR ALL USING (true);
