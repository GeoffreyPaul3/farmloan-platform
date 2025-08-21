-- Create upload_history table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS upload_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    upload_type TEXT NOT NULL CHECK (upload_type IN ('farmers', 'contracts', 'loans', 'equipment')),
    file_name TEXT NOT NULL,
    file_size INTEGER,
    total_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_details JSONB,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_upload_history_user_id ON upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_status ON upload_history(status);
CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON upload_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own upload history" ON upload_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own upload history" ON upload_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own upload history" ON upload_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_upload_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_upload_history_updated_at
    BEFORE UPDATE ON upload_history
    FOR EACH ROW
    EXECUTE FUNCTION update_upload_history_updated_at();
