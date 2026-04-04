# Centre of Excellence Sialkot (Boys) — Setup Guide

## Complete setup in 6 steps

---

### STEP 1: Create Supabase Account (Free)

1. Go to **https://supabase.com** and click "Start your project"
2. Sign up with GitHub (or email)
3. Click **"New Project"**
4. Fill in:
   - **Name:** `coe-sialkot`
   - **Database Password:** Choose a strong password (SAVE THIS!)
   - **Region:** Choose closest to Pakistan (e.g., Mumbai or Singapore)
5. Click **"Create new project"** — wait 2 minutes for setup

---

### STEP 2: Get Your API Keys

1. In your Supabase project, go to **Settings → API** (left sidebar)
2. Copy these 3 values:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
   - **service_role key** (another long string — keep this SECRET)

---

### STEP 3: Create Database Tables

1. In Supabase, click **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy ALL the SQL code and paste it into the SQL editor
5. Click **"Run"** — this creates all 20+ tables
6. Then open `supabase/seed.sql`, paste and run it too — this adds sample data

---

### STEP 4: Create User Accounts

1. In Supabase, go to **Authentication → Users** (left sidebar)
2. Click **"Add User" → "Create New User"**
3. Create these accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@coesialkot.edu.pk | Admin@COE2026 | admin |
| principal@coesialkot.edu.pk | Principal@COE2026 | management |
| teacher@coesialkot.edu.pk | Teacher@COE2026 | teacher |
| student@coesialkot.edu.pk | Student@COE2026 | student |
| parent@coesialkot.edu.pk | Parent@COE2026 | parent |

4. After creating ALL users, go to **SQL Editor** and run:

```sql
UPDATE profiles SET role = 'admin', full_name = 'System Administrator' WHERE email = 'admin@coesialkot.edu.pk';
UPDATE profiles SET role = 'management', full_name = 'Dr. Muhammad Akram' WHERE email = 'principal@coesialkot.edu.pk';
UPDATE profiles SET role = 'teacher', full_name = 'Mr. Usman Ali' WHERE email = 'teacher@coesialkot.edu.pk';
UPDATE profiles SET role = 'student', full_name = 'Ahmad Hassan' WHERE email = 'student@coesialkot.edu.pk';
UPDATE profiles SET role = 'parent', full_name = 'Muhammad Hussain' WHERE email = 'parent@coesialkot.edu.pk';
```

---

### STEP 5: Configure Your Project

1. In the project folder, create a file called `.env.local`
2. Add these lines (replace with YOUR values from Step 2):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

### STEP 6: Deploy

**On your Mac terminal:**

```bash
cd ~/Desktop/coe-sialkot-v2
npm install
npm run dev
```

Open **http://localhost:3000** — login with any of the accounts above.

**To deploy to Vercel:**

```bash
git init
git add .
git commit -m "COE Sialkot v2 with auth"
git branch -M main
git remote add origin https://github.com/naimtahirbaig/coe-sialkot-v2.git
git push -u origin main
vercel
```

**IMPORTANT:** In Vercel dashboard, go to your project **Settings → Environment Variables** and add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Test Logins

| Portal | Email | Password |
|--------|-------|----------|
| Admin | admin@coesialkot.edu.pk | Admin@COE2026 |
| Principal | principal@coesialkot.edu.pk | Principal@COE2026 |
| Teacher | teacher@coesialkot.edu.pk | Teacher@COE2026 |
| Student | student@coesialkot.edu.pk | Student@COE2026 |
| Parent | parent@coesialkot.edu.pk | Parent@COE2026 |

---

## Security Notes

- All passwords are hashed by Supabase (bcrypt)
- Row Level Security (RLS) ensures each role only sees permitted data
- Students can only see their own records
- Parents can only see their child's records
- Teachers can only manage their own classes
- Only admins have full access
- Sessions expire automatically
- Password reset works via email
