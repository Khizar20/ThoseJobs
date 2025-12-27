# Supabase Email Template Setup Guide

## How to Update Your Supabase Email Confirmation Template

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Click on **"Confirm signup"** template

### Step 2: Copy the HTML Template
Copy the contents from `supabase-email-template-simple.html` (recommended for Supabase editor) or `supabase-email-template.html` (full-featured version).

### Step 3: Update the Template in Supabase
1. In the Supabase email template editor, you'll see fields for:
   - **Subject**: `Confirm your signup`
   - **Body**: HTML content

2. **Update the Subject** (optional but recommended):
   ```
   Welcome to ThoseJobs - Confirm Your Email Address 🎉
   ```

3. **Replace the Body** with the HTML template:
   - Delete the existing HTML content
   - Paste the new template HTML
   - **IMPORTANT**: Make sure `{{ .ConfirmationURL }}` remains intact - this is the variable Supabase uses for the confirmation link

### Step 4: Test the Email
1. Sign up with a test email address
2. Check your inbox for the confirmation email
3. Verify the styling looks correct across different email clients

## Template Features

✅ **Matches ThoseJobs Brand Colors:**
- Primary Blue: `#0846BC`
- Yellow Accent: `#FFDE59`
- Cream Background: `#F4E4C2`
- Dark Text: `#05070A`

✅ **Responsive Design:**
- Works on desktop and mobile email clients
- Uses table-based layout for maximum compatibility

✅ **Professional Styling:**
- Gradient header with brand colors
- Clear call-to-action button
- Informative content sections
- Footer with contact information

## Alternative: Plain Text Version

If you need a plain text fallback, use this:

```
Welcome to ThoseJobs! 🎉

You're just one click away from getting started. Please confirm your email address to activate your account.

Confirm your email: {{ .ConfirmationURL }}

Or copy and paste this link into your browser:
{{ .ConfirmationURL }}

💡 What's next?
Once you confirm your email, you'll be able to post jobs as a requester or start accepting tasks as a worker. Join thousands of Houston locals who trust ThoseJobs for their everyday tasks!

---
This email was sent because you signed up for an account on ThoseJobs.
If you didn't create an account, you can safely ignore this email.

© 2024 ThoseJobs. All rights reserved.
```

## Troubleshooting

**Issue: Email doesn't look right**
- Make sure you're using the HTML version, not plain text
- Check that all HTML tags are properly closed
- Verify `{{ .ConfirmationURL }}` is not modified

**Issue: Confirmation link doesn't work**
- Ensure `{{ .ConfirmationURL }}` is exactly as shown (with the double curly braces)
- Check your Site URL in Supabase Authentication settings

**Issue: Styling is broken**
- Some email clients strip CSS - the template uses inline styles for maximum compatibility
- Test in multiple email clients (Gmail, Outlook, Apple Mail)

## Notes

- The template uses Supabase's Go template syntax: `{{ .ConfirmationURL }}`
- Colors match your website theme from `tailwind.config.ts`
- Fonts fallback to system fonts for better email client compatibility
- The template is mobile-responsive using table-based layout
