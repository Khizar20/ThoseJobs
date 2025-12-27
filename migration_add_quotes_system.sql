-- Migration: Add Quote-Based Job System
-- This migration adds support for workers to submit quotes for jobs
-- and requesters to review and select quotes

-- 1. Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quoted_amount DECIMAL(10, 2) NOT NULL CHECK (quoted_amount > 0),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, worker_id) -- One quote per worker per job
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quotes_job_id ON quotes(job_id);
CREATE INDEX IF NOT EXISTS idx_quotes_worker_id ON quotes(worker_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_job_worker ON quotes(job_id, worker_id);

-- 3. Add accepting_quotes column to jobs table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'accepting_quotes'
    ) THEN
        ALTER TABLE jobs ADD COLUMN accepting_quotes BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 4. Update jobs table to track quote deadline (optional)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'quote_deadline'
    ) THEN
        ALTER TABLE jobs ADD COLUMN quote_deadline TIMESTAMPTZ;
    END IF;
END $$;

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_quotes_updated_at_trigger ON quotes;
CREATE TRIGGER update_quotes_updated_at_trigger
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at();

-- 7. Create function to automatically reject other quotes when one is accepted
CREATE OR REPLACE FUNCTION reject_other_quotes_on_accept()
RETURNS TRIGGER AS $$
BEGIN
    -- When a quote is accepted, reject all other pending quotes for the same job
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        UPDATE quotes
        SET status = 'rejected', updated_at = NOW()
        WHERE job_id = NEW.job_id
          AND worker_id != NEW.worker_id
          AND status = 'pending';
        
        -- Update the job status and assign worker
        UPDATE jobs
        SET status = 'accepted',
            assigned_worker_id = NEW.worker_id,
            accepting_quotes = FALSE,
            worker_earnings = NEW.quoted_amount,
            platform_fee = (NEW.quoted_amount * 0.30), -- 30% platform fee
            budget = NEW.quoted_amount,
            updated_at = NOW()
        WHERE id = NEW.job_id;
        
        -- Create job assignment
        INSERT INTO job_assignments (job_id, worker_id, status)
        VALUES (NEW.job_id, NEW.worker_id, 'accepted')
        ON CONFLICT (job_id, worker_id) DO UPDATE
        SET status = 'accepted';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for auto-rejecting other quotes
DROP TRIGGER IF EXISTS reject_other_quotes_trigger ON quotes;
CREATE TRIGGER reject_other_quotes_trigger
    AFTER UPDATE ON quotes
    FOR EACH ROW
    WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
    EXECUTE FUNCTION reject_other_quotes_on_accept();

-- 9. Add RLS policies for quotes table
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Workers can view their own quotes
CREATE POLICY "Workers can view own quotes" ON quotes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND roles @> ARRAY['worker']::TEXT[]
        )
        AND worker_id = auth.uid()
    );

-- Policy: Workers can create quotes for posted jobs
CREATE POLICY "Workers can create quotes" ON quotes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND roles @> ARRAY['worker']::TEXT[]
        )
        AND worker_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM jobs 
            WHERE id = job_id 
            AND status = 'posted' 
            AND accepting_quotes = TRUE
        )
    );

-- Policy: Workers can update their own pending quotes
CREATE POLICY "Workers can update own pending quotes" ON quotes
    FOR UPDATE
    USING (
        worker_id = auth.uid()
        AND status = 'pending'
    )
    WITH CHECK (
        worker_id = auth.uid()
        AND status IN ('pending', 'withdrawn')
    );

-- Policy: Requesters can view quotes for their jobs
CREATE POLICY "Requesters can view quotes for their jobs" ON quotes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND roles @> ARRAY['requester']::TEXT[]
        )
        AND EXISTS (
            SELECT 1 FROM jobs 
            WHERE id = quotes.job_id 
            AND requester_id = auth.uid()
        )
    );

-- Policy: Requesters can accept/reject quotes for their jobs
CREATE POLICY "Requesters can update quotes for their jobs" ON quotes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND roles @> ARRAY['requester']::TEXT[]
        )
        AND EXISTS (
            SELECT 1 FROM jobs 
            WHERE id = quotes.job_id 
            AND requester_id = auth.uid()
            AND status = 'posted'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE id = quotes.job_id 
            AND requester_id = auth.uid()
        )
    );

-- 10. Create view for quote statistics per job
CREATE OR REPLACE VIEW job_quote_stats AS
SELECT 
    job_id,
    COUNT(*) as total_quotes,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_quotes,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_quotes,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_quotes,
    MIN(quoted_amount) FILTER (WHERE status = 'pending') as lowest_quote,
    MAX(quoted_amount) FILTER (WHERE status = 'pending') as highest_quote,
    AVG(quoted_amount) FILTER (WHERE status = 'pending') as average_quote
FROM quotes
GROUP BY job_id;

-- 11. Grant necessary permissions (adjust based on your RLS setup)
-- Note: RLS policies above handle access control, but you may need to grant table permissions

COMMENT ON TABLE quotes IS 'Stores quotes submitted by workers for jobs';
COMMENT ON COLUMN quotes.quoted_amount IS 'Amount quoted by worker (in USD)';
COMMENT ON COLUMN quotes.status IS 'Status: pending, accepted, rejected, or withdrawn';
COMMENT ON COLUMN quotes.message IS 'Optional message from worker explaining their quote';


