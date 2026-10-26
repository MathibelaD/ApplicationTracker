# Shortlist — job application tracker

Keep every job application in one place: the job ad and link, the CV you sent,
when you applied, the closing date, every interview stage, and take-home
assignments with their links and due dates. Each user has their own private
account; data is isolated per user with Postgres row level security.

Built with React 19, Vite, Tailwind CSS v4, React Router, TanStack Query and Supabase
(Auth, Postgres, Storage).

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema.** In the dashboard open *SQL Editor* and run these files, in order:
   - [`supabase/migrations/20261026000000_init.sql`](supabase/migrations/20261026000000_init.sql) –
     tables, security policies and the private `cvs` storage bucket
   - [`supabase/migrations/20261026010000_screenshots.sql`](supabase/migrations/20261026010000_screenshots.sql) –
     quick add and the private `screenshots` bucket
   - [`supabase/migrations/20261026020000_user_skills.sql`](supabase/migrations/20261026020000_user_skills.sql) –
     the "My skills" list
   - [`supabase/migrations/20261026030000_goals.sql`](supabase/migrations/20261026030000_goals.sql) –
     application goals

   (With the Supabase CLI: `supabase link` then `supabase db push`.)
3. **Configure auth URLs.** *Authentication → URL Configuration*:
   - Site URL: `http://localhost:5173` (your production URL once deployed)
   - Redirect URLs: add `http://localhost:5173/**` and your production URL with `/**`

   These are used by the sign-up confirmation and password-reset emails.
   To let people sign in immediately without confirming their email, turn off
   *Authentication → Providers → Email → Confirm email*.
4. **Add your keys.**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
   *Project Settings → API* (the publishable key works too).
5. **Run it.**
   ```bash
   pnpm install
   pnpm dev
   ```

## Features

- Email + password accounts, sign-up confirmation, forgot / reset password
- Applications with company, role, location, work arrangement, employment type,
  salary, job posting link, source (where you found it), status, date applied,
  closing date, full job description and notes
- Quick add: save an application with just the job link and a screenshot of the
  listing (paste with ⌘V / Ctrl+V, drop or browse), and fill in the rest later.
  Company and source are guessed from common job boards and hiring-platform links
- Listing screenshots on any application, with a full-size viewer; large images
  are resized and converted to WebP before upload
- CV library: upload PDF/Word CVs (private storage), attach the version you used
  to each application, view / download / rename / delete
- Stages timeline (screening, interviews, assessments…) with date & time,
  meeting link, outcome and notes; adding a stage moves the status forward
- Assignments with link, due date & time, progress and notes; overdue ones are flagged
- Skills insights: reads the saved job descriptions (no AI, nothing leaves the
  browser) against a built-in list of ~200 skills and their spellings, works out
  whether each is required, nice to have or just mentioned from the ad's headings
  and wording, and ranks what your jobs ask for most. A "My skills" list you edit
  yourself powers a coverage score and biggest-gaps view; each application also
  shows the skills in its own ad
- Application goals: aim for N applications a day (optionally weekdays only), a
  week or a month. Tracks pace, streaks and recent history from your applied
  dates, warns you on the Overview when you're falling behind or missed a day,
  shows a progress ring in the sidebar / phone header, and celebrates when a goal
  is met. Weeks start on your region's first day, or Monday/Sunday if you prefer
- Overview with pipeline, response rate, weekly activity and a "coming up" agenda
  of interviews, assignment deadlines and closing dates
- List and board views, search, status filters and sorting
- Light / dark / system theme, mobile layout, keyboard shortcuts (`N` new application, `/` search)
- Dates and times are formatted in the visitor's locale and time zone

## Deploying

Any static host works. `vercel.json` (Vercel) and `public/_redirects` (Netlify)
already route all paths to the SPA. Set the same two env vars on the host and add
the production URL to Supabase's redirect URLs.
