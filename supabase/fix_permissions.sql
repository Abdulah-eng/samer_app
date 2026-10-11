-- =========================================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX PRODUCT & SETTINGS PERMISSIONS
-- =========================================================================

-- 1. FIX PRODUCTS TABLE PERMISSIONS
-- Allows Admin panel to Add (INSERT), Edit (UPDATE), and Remove (DELETE) products freely.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Products" ON products;
DROP POLICY IF EXISTS "Public Full Access Products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable all for all users" ON products;

CREATE POLICY "Public Full Access Products" ON products 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- 2. FIX STORE SETTINGS TABLE PERMISSIONS
-- Allows Admin panel to change Store Name, Merchant Name, and Notice text.
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Store Settings" ON store_settings;
DROP POLICY IF EXISTS "Public Full Access Store Settings" ON store_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON store_settings;
DROP POLICY IF EXISTS "Enable all for all users" ON store_settings;

CREATE POLICY "Public Full Access Store Settings" ON store_settings 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- 3. ENSURE ROW 1 EXISTS IN STORE SETTINGS
INSERT INTO store_settings (id, store_name, merchant_name, is_online, notice_text)
VALUES (1, 'IMOSTRADA', 'imostrada', true, 'Delivery time starts after the redeem request is submitted. Products are delivered between 1 hour to 24 hours.')
ON CONFLICT (id) DO NOTHING;

-- 4. ENSURE REDEEM CODES, ORDERS, AND CHAT HAVE FULL READ/WRITE ACCESS
ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access Redeem Codes" ON redeem_codes;
DROP POLICY IF EXISTS "Public Read & Insert Redeem Codes" ON redeem_codes;
CREATE POLICY "Public Full Access Redeem Codes" ON redeem_codes 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access Orders" ON orders;
DROP POLICY IF EXISTS "Public Read & Insert Orders" ON orders;
CREATE POLICY "Public Full Access Orders" ON orders 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access Chat Messages" ON chat_messages;
CREATE POLICY "Public Full Access Chat Messages" ON chat_messages 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);
