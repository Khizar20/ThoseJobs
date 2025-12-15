# Quote-Based System Implementation

## Overview
This document describes the implementation of a quote-based job system where workers submit quotes for jobs instead of directly accepting them. Requesters can then review and select the best quote.

## Database Changes

### Migration File: `migration_add_quotes_system.sql`

1. **New `quotes` Table**
   - Stores quotes submitted by workers for jobs
   - Fields: `id`, `job_id`, `worker_id`, `quoted_amount`, `message`, `status`, `created_at`, `updated_at`
   - Status values: `pending`, `accepted`, `rejected`, `withdrawn`
   - Unique constraint: one quote per worker per job

2. **Updated `jobs` Table**
   - Added `accepting_quotes` column (BOOLEAN, default TRUE)
   - Added `quote_deadline` column (TIMESTAMPTZ, optional)

3. **Database Triggers**
   - Auto-update `updated_at` timestamp on quote updates
   - Auto-reject other pending quotes when one is accepted
   - Auto-assign worker and update job status when quote is accepted

4. **RLS Policies**
   - Workers can view/create/update their own quotes
   - Requesters can view quotes for their jobs
   - Requesters can accept/reject quotes for their jobs

5. **Views**
   - `job_quote_stats` view for quote statistics per job

## Frontend Changes

### 1. BrowseJobs.tsx
- **Quote Submission Dialog**: Replaced "Accept Job" with "Submit Quote" functionality
- **Quote Form**: Added form with quote amount and optional message fields
- **Quote Count Badges**: Display quote count on job cards
- **Existing Quote Handling**: Check for existing quotes and allow updates
- **Platform Fee Display**: Show calculated worker earnings after 30% platform fee

### 2. RequesterDashboard.tsx
- **View Quotes Button**: Added button for posted jobs to view received quotes
- **Quotes Dialog**: Comprehensive dialog showing all quotes with:
  - Worker information and ratings
  - Quote amounts and messages
  - Accept/Reject functionality
  - Status badges
- **Quote Management**: Functions to fetch, accept, and reject quotes
- **Job Posting**: Set `accepting_quotes: true` by default when posting jobs

### 3. WorkerDashboard.tsx
- **My Quotes Tab**: New tab to view all submitted quotes
- **Quote Status Display**: Shows pending, accepted, rejected, and withdrawn statuses
- **Quote Details**: Displays job information, quote amount, message, and status
- **Quote Fetching**: Fetches quotes with job details and requester information

## Key Features

### For Workers:
1. Submit quotes with custom amounts and messages
2. Update pending quotes
3. View all submitted quotes and their statuses
4. See calculated earnings after platform fees

### For Requesters:
1. View all quotes received for posted jobs
2. Accept or reject quotes
3. See worker ratings and messages
4. Automatic job assignment when quote is accepted

### System Behavior:
1. When a quote is accepted:
   - All other pending quotes are automatically rejected
   - Job is assigned to the worker
   - Job status changes to "accepted"
   - `accepting_quotes` is set to false
   - Job assignment record is created

2. Quote Status Flow:
   - `pending` → `accepted` or `rejected` or `withdrawn`
   - Only pending quotes can be updated by workers
   - Only requesters can accept/reject quotes

## Usage Instructions

### For Workers:
1. Browse available jobs on the Browse Jobs page
2. Click "View Details" on a job
3. Click "Submit Quote"
4. Enter your quote amount and optional message
5. Submit the quote
6. View your quotes in the "My Quotes" tab of Worker Dashboard

### For Requesters:
1. Post a job (quotes are enabled by default)
2. View quotes by clicking "View Quotes" on posted jobs
3. Review worker information, ratings, and messages
4. Accept the best quote or reject quotes as needed
5. Job is automatically assigned when a quote is accepted

## Database Migration Steps

1. Run the migration file `migration_add_quotes_system.sql` in your Supabase SQL editor
2. Verify that the `quotes` table was created
3. Verify that `accepting_quotes` column was added to `jobs` table
4. Test RLS policies to ensure proper access control

## Notes

- The platform fee is 30% of the quoted amount
- Workers receive 70% of their quoted amount
- Only one quote per worker per job is allowed
- Quotes can be updated by workers while they're pending
- Once a quote is accepted, the job is assigned and other quotes are rejected automatically

