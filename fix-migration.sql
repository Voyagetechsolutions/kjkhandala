-- Fix Migration - Enable UUID Extension
-- Run this in your PostgreSQL database before running Prisma migrate

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify it works
SELECT uuid_generate_v4();
