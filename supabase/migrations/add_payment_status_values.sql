-- Migration: Add new payment_status enum values
-- Date: 2025-11-17
-- Description: Add 'reserved', 'paid', and 'completed' to payment_status enum

-- Add new values to the payment_status enum
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'reserved';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'completed';

-- Note: These values are added to support better seat reservation tracking
-- - 'reserved': Seat is reserved but payment not yet completed
-- - 'paid': Payment has been received
-- - 'completed': Payment is fully processed and confirmed
