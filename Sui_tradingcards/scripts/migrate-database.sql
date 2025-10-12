-- Database Migration for Minting Worker
-- Run this script to add required columns to minting_records table

-- Add retry_count column if it doesn't exist
ALTER TABLE minting_records 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add error_message column if it doesn't exist
ALTER TABLE minting_records 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE minting_records 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_minting_records_status_retry 
ON minting_records(status, retry_count);

CREATE INDEX IF NOT EXISTS idx_minting_records_created_at 
ON minting_records(created_at);

CREATE INDEX IF NOT EXISTS idx_minting_records_updated_at 
ON minting_records(updated_at);

-- Update existing records to have updated_at timestamp
UPDATE minting_records 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Verify the schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'minting_records' 
ORDER BY ordinal_position;
