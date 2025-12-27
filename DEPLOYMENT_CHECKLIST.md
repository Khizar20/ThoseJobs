# Deployment Checklist for Job Posting

## ✅ What Should Work (No Issues Expected)

### Job Posting from Requester Dashboard
- **Status**: ✅ Should work perfectly
- **Reason**: Uses direct Supabase connection (no backend API needed)
- **Code Location**: `src/pages/RequesterDashboard.tsx` → `handlePostJob()`
- **Dependencies**: Only requires Supabase environment variables

## ⚠️ Required Environment Variables in AWS Amplify

Make sure these are set in **AWS Amplify Console → App Settings → Environment Variables**:

### Critical (Required for Job Posting):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional (For Enhanced Features):
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_API_BASE_URL=https://your-backend-url.com  # Only if using backend proxy
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

## 🔍 Potential Issues to Check

### 1. Google Maps Autocomplete (Optional Feature)
**Issue**: If the job posting form uses address autocomplete, it might fail if:
- `VITE_API_BASE_URL` is not set or points to localhost
- Backend proxy service is not deployed

**Solution Options**:
- **Option A**: Deploy the Python backend service separately (Heroku, Railway, etc.)
- **Option B**: Use Google Maps API directly (modify `GoogleMapsAutocomplete.tsx` to use direct API calls)
- **Option C**: Make address field manual (users type address without autocomplete)

**Current Code**: `src/components/GoogleMapsAutocomplete.tsx` uses `VITE_API_BASE_URL`

### 2. Database Permissions (RLS Policies)
**Check**: Ensure Supabase Row Level Security (RLS) allows job insertion

**Required Policy**:
```sql
-- Requesters can insert their own jobs
CREATE POLICY "Requesters can insert own jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = requester_id);
```

**How to Verify**:
1. Go to Supabase Dashboard → Authentication → Policies
2. Check `jobs` table has INSERT policy for authenticated users
3. Test by posting a job from the deployed site

### 3. CORS Configuration
**Status**: ✅ Should be fine
- Supabase handles CORS automatically
- No backend API calls needed for job posting

## 🧪 Testing After Deployment

### Test Job Posting:
1. ✅ Login as requester on deployed site
2. ✅ Navigate to Requester Dashboard
3. ✅ Click "Post a Job"
4. ✅ Fill out the form:
   - Title
   - Category
   - Description
   - Address (manual entry if autocomplete doesn't work)
   - Budget
   - Deadline (optional)
5. ✅ Submit the job
6. ✅ Verify job appears in "My Jobs" tab

### If Job Posting Fails:

**Error: "Failed to post job"**
- Check browser console for detailed error
- Verify Supabase environment variables are set correctly
- Check Supabase dashboard logs for RLS policy violations
- Verify user is authenticated (check localStorage for `user_token`)

**Error: "Network error" or "CORS error"**
- Verify `VITE_SUPABASE_URL` is correct (should be `https://xxx.supabase.co`)
- Check Supabase project is active and not paused

**Error: "Permission denied"**
- Check RLS policies in Supabase
- Verify user has `requester` role in database

## 📝 Quick Fixes

### If Google Maps Autocomplete Doesn't Work:
The job posting will still work - users can manually type addresses. To fix autocomplete:

1. **Deploy Backend** (if you want to use proxy):
   - Deploy `backend/main.py` to a service like Railway, Render, or Heroku
   - Update `VITE_API_BASE_URL` in Amplify to point to deployed backend
   - Update backend CORS to include your Amplify domain

2. **Use Direct Google Maps API** (simpler):
   - Modify `GoogleMapsAutocomplete.tsx` to call Google Maps API directly
   - Add your Amplify domain to Google Maps API key restrictions

## ✅ Summary

**Job Posting**: Should work immediately after deployment if:
- ✅ Supabase environment variables are set
- ✅ Database RLS policies allow job insertion
- ✅ User is authenticated

**Optional Features** (won't break job posting if they fail):
- Google Maps autocomplete (can use manual address entry)
- Email notifications (job posting still works)
- Backend proxy services (not needed for basic job posting)

## 🚀 Next Steps

1. **Set Environment Variables** in AWS Amplify
2. **Test Job Posting** on deployed site
3. **Check Browser Console** for any errors
4. **Verify in Supabase Dashboard** that job was created
5. **Fix Optional Features** if needed (autocomplete, etc.)
