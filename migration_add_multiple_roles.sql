-- Migration: Add support for multiple roles per user
-- Run this in Supabase SQL Editor

-- Step 1: Add a new column for roles array (temporary)
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[];

-- Step 2: Migrate existing role data to roles array
UPDATE users SET roles = ARRAY[role] WHERE roles IS NULL;

-- Step 3: Make roles array NOT NULL and set default
ALTER TABLE users ALTER COLUMN roles SET DEFAULT ARRAY['requester']::TEXT[];
ALTER TABLE users ALTER COLUMN roles SET NOT NULL;

-- Step 4: Add constraint to ensure valid roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_roles_check 
  CHECK (roles <@ ARRAY['requester', 'worker', 'affiliate', 'admin']::TEXT[]);

-- Step 5: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);

-- Step 6: Keep the old 'role' column for backward compatibility (will be removed later)
-- For now, we'll keep both. The 'role' column will be the primary role (first in array)

-- Step 7: Create a function to get primary role
CREATE OR REPLACE FUNCTION get_primary_role(user_roles TEXT[])
RETURNS TEXT AS $$
BEGIN
  RETURN user_roles[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 8: Update the role column to sync with first role in array (for backward compatibility)
CREATE OR REPLACE FUNCTION sync_role_column()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.roles IS NOT NULL AND array_length(NEW.roles, 1) > 0 THEN
    NEW.role := NEW.roles[1];
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_role_column ON users;

-- Create trigger to sync role column
CREATE TRIGGER trigger_sync_role_column
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_column();

-- Step 9: Create helper function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(user_id UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT roles INTO user_roles FROM users WHERE id = user_id;
  RETURN check_role = ANY(user_roles);
END;
$$ LANGUAGE plpgsql STABLE;

