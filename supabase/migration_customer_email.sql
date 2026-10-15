-- =========================================================================
-- OPTIONAL MIGRATION: ADD customer_email COLUMN TO ORDERS TABLE
-- (The app already works seamlessly out-of-the-box by storing customer email
-- in the existing orders table, but running this adds a dedicated column)
-- =========================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
