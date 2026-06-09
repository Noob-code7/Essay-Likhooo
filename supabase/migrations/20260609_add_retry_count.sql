-- Add retry_count column to submissions table to track AI evaluation retries
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 NOT NULL;
