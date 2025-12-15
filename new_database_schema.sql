-- ============================================
-- THOSEJOBS.COM - NEW DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('requester', 'worker', 'affiliate', 'admin')),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    city TEXT DEFAULT 'Houston',
    zip_code TEXT,
    bio TEXT,
    profile_photo TEXT,
    rating_average DOUBLE PRECISION DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    stripe_account_id TEXT,
    stripe_customer_id TEXT,
    payout_method_added BOOLEAN DEFAULT false,
    location_enabled BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Photos', 'Pickup/Dropoff', 'Walkthrough', 'Signage', 'Other')),
    description TEXT NOT NULL,
    address TEXT,
    address_area TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    budget DECIMAL(10, 2) NOT NULL,
    worker_earnings DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    deadline TIMESTAMPTZ,
    time_window_start TIMESTAMPTZ,
    time_window_end TIMESTAMPTZ,
    special_requirements TEXT[],
    reference_images TEXT[],
    status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'accepted', 'in_progress', 'submitted', 'approved', 'disputed', 'cancelled', 'completed')),
    assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_intent_id TEXT,
    payment_hold_released BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Job Assignments
CREATE TABLE IF NOT EXISTS job_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'started', 'submitted', 'approved', 'rejected')),
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, worker_id)
);

-- 4. Job Media
CREATE TABLE IF NOT EXISTS job_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('image', 'video')),
    file_hash TEXT,
    ai_verified BOOLEAN DEFAULT false,
    ai_verification_result JSONB,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    worker_payout DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    stripe_payment_intent_id TEXT,
    stripe_transfer_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ratings
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, from_user_id, to_user_id)
);

-- 7. Affiliates
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    affiliate_code TEXT UNIQUE NOT NULL,
    commission_rate DECIMAL(5, 2) DEFAULT 10.00,
    total_clicks INTEGER DEFAULT 0,
    total_signups INTEGER DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0,
    payout_method TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Affiliate Referrals
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referral_type TEXT CHECK (referral_type IN ('worker', 'requester')),
    first_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    commission_earned DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_requester ON jobs(requester_id);
CREATE INDEX IF NOT EXISTS idx_jobs_worker ON jobs(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job ON job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_worker ON job_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_messages_job ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_ratings_job ON ratings(job_id);
CREATE INDEX IF NOT EXISTS idx_transactions_job ON transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update user rating after new rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET 
        rating_average = (
            SELECT AVG(stars)::DOUBLE PRECISION
            FROM ratings
            WHERE to_user_id = NEW.to_user_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM ratings
            WHERE to_user_id = NEW.to_user_id
        )
    WHERE id = NEW.to_user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_rating
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_rating();

-- Calculate job fees (70/30 split)
CREATE OR REPLACE FUNCTION calculate_job_fees(budget_amount DECIMAL)
RETURNS TABLE(
    worker_earnings DECIMAL,
    platform_fee DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (budget_amount * 0.70)::DECIMAL(10, 2) as worker_earnings,
        (budget_amount * 0.30)::DECIMAL(10, 2) as platform_fee;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read public profiles" ON users
    FOR SELECT USING (true);

-- Jobs policies
CREATE POLICY "Jobs are viewable by everyone" ON jobs
    FOR SELECT USING (true);

CREATE POLICY "Requesters can create jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update own jobs" ON jobs
    FOR UPDATE USING (auth.uid() = requester_id);

-- Job assignments policies
CREATE POLICY "Workers can read own assignments" ON job_assignments
    FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Workers can create assignments" ON job_assignments
    FOR INSERT WITH CHECK (auth.uid() = worker_id);

-- Messages policies
CREATE POLICY "Users can read own messages" ON messages
    FOR SELECT USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id OR
        auth.uid() IN (
            SELECT requester_id FROM jobs WHERE id = messages.job_id
            UNION
            SELECT assigned_worker_id FROM jobs WHERE id = messages.job_id
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = from_user_id AND
        auth.uid() IN (
            SELECT requester_id FROM jobs WHERE id = messages.job_id
            UNION
            SELECT assigned_worker_id FROM jobs WHERE id = messages.job_id
        )
    );

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- Note: Create these buckets in Supabase Storage UI:
-- 1. job-media (public: false)
-- 2. profile-photos (public: true)
-- 3. reference-images (public: false)

