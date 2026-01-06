-- =============================================
-- Add cancel_reason column to orders table
-- Store reason when customer cancels order
-- =============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
