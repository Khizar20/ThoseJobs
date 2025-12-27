-- Fix: Remove updated_at reference from job_assignments table
-- This fixes the error: column "updated_at" of relation "job_assignments" does not exist

-- Update the trigger function to remove updated_at reference
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
        
        -- Create job assignment (removed updated_at reference)
        INSERT INTO job_assignments (job_id, worker_id, status)
        VALUES (NEW.job_id, NEW.worker_id, 'accepted')
        ON CONFLICT (job_id, worker_id) DO UPDATE
        SET status = 'accepted';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

