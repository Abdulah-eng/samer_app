-- =========================================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO SUPPORT TOP-UP & LIVE CHAT
-- =========================================================================

-- 1. Add Top-Up columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_order_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_platform TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_account_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_account_password TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS top_up_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'account';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS two_factor_key TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_key TEXT;

-- 2. Update orders delivery_type constraint to allow 'topup'
DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_type_check;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE orders ADD CONSTRAINT orders_delivery_type_check 
  CHECK (delivery_type IN ('account', 'key', 'topup'));

-- 3. Add delivery_type to redeem_codes & products
ALTER TABLE redeem_codes ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'account';
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_delivery_type TEXT DEFAULT 'account';

-- 4. Create or update chat_messages table for Multi-Customer Live Chat Support
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT DEFAULT 'general',
  sender TEXT NOT NULL CHECK (sender IN ('user', 'agent')),
  text TEXT NOT NULL,
  order_number TEXT,
  customer_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- In case chat_messages already exists, add session_id and customer_label safely
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT 'general';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS customer_label TEXT;

-- 5. Enable RLS and public policies for Live Chat
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access Chat Messages" ON chat_messages;
CREATE POLICY "Public Full Access Chat Messages" ON chat_messages FOR ALL USING (true);

-- 6. Migrate existing Fortnite / Top-Up orders to delivery_type = 'topup'
UPDATE orders 
SET delivery_type = 'topup' 
WHERE (delivery_type IS NULL OR delivery_type = 'account')
  AND (
    LOWER(product_name) LIKE '%top up%' 
    OR LOWER(product_name) LIKE '%top-up%' 
    OR LOWER(product_name) LIKE '%topup%'
    OR LOWER(product_name) LIKE '%v-bucks%' 
    OR LOWER(product_name) LIKE '%coins%' 
    OR LOWER(product_name) LIKE '%points%'
    OR top_up_account_email IS NOT NULL 
    OR top_up_order_number IS NOT NULL
  );

UPDATE redeem_codes 
SET delivery_type = 'topup' 
WHERE (delivery_type IS NULL OR delivery_type = 'account')
  AND product_id IN (
    SELECT id FROM products 
    WHERE LOWER(name) LIKE '%top up%' 
       OR LOWER(name) LIKE '%top-up%' 
       OR LOWER(name) LIKE '%topup%'
       OR LOWER(name) LIKE '%v-bucks%' 
       OR LOWER(name) LIKE '%coins%' 
       OR LOWER(name) LIKE '%points%'
  );

-- 7. Add default Top-Up product (if not already added)
INSERT INTO products (name, category, description, default_delivery_type)
VALUES ('Fortnite 800 V-Bucks Top Up', 'Top-Up Service', 'Direct In-Game Top-Up for Fortnite', 'topup')
ON CONFLICT DO NOTHING;
