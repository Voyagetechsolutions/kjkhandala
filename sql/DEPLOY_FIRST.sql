-- STEP 1: Add shift_id column to trips table
-- Run this FIRST in Supabase SQL Editor

DO $$
BEGIN
    -- Check if shift_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='trips' AND column_name='shift_id'
    ) THEN
        -- Add shift_id column to link trips to driver_shifts
        ALTER TABLE trips ADD COLUMN shift_id UUID REFERENCES driver_shifts(id) ON DELETE SET NULL;
        
        -- Add an index for better performance
        CREATE INDEX IF NOT EXISTS idx_trips_shift_id ON trips(shift_id);
        
        RAISE NOTICE 'Added shift_id column to trips table with foreign key reference to driver_shifts';
    ELSE
        RAISE NOTICE 'shift_id column already exists in trips table';
    END IF;
END
$$;
