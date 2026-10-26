# Shortlist

**A job application tracker that remembers everything about every job you apply for, and helps you keep applying.**

Job hunting quickly gets messy. The ad you applied to disappears the week before your interview. You can't remember which version of your CV you sent. Interview times, take-home deadlines and closing dates are scattered across emails and notes. Shortlist keeps all of it in one place, for every application, from the moment you see a job to the final offer or rejection.

It's a multi-user web app: anyone can create an account, and each person's applications, CVs and screenshots are private to them.

---

## What it does

### Save a job in seconds
- **Quick add:** paste the job link and a screenshot of the listing, and you're done. Screenshots can be pasted straight from the clipboard (⌘V / Ctrl+V), dragged in or chosen from your files. The rest can be filled in later; quick-added jobs are marked "Needs details" until then.
- **Full details** when you want them: company, role, location, remote/hybrid/on-site, employment type, salary, where you found the job, the date you applied and the closing date.
- **Smart guesses:** links from common hiring platforms (Greenhouse, Lever, Workable, Ashby, Workday and others) fill in the company name automatically, and links from job boards such as LinkedIn or Indeed fill in the source.

### Keep the evidence
- **The job description is saved with the application**, so you can still prepare for the interview after the listing is taken down.
- **Screenshots of the listing** are kept in a gallery with a full-size viewer.
- **A CV library**: upload each version of your CV once, attach the one you actually sent to each application, and see which applications used which CV.

### Follow every application through to the end
- **Status:** Wishlist → Applied → Screening → Interviewing → Offer, or Rejected / Withdrawn. Change it from any card in one tap.
- **Stages timeline:** recruiter calls, interviews, technical rounds and assessment centres, each with a date and time, meeting link, outcome and notes. Adding a stage moves the application's status forward automatically.
- **Assignments:** take-home tasks and tests with their link, due date and progress. Overdue ones are flagged.

### See the whole search at a glance
- **Overview dashboard:** a greeting, your pipeline across all statuses, response rate, applications sent per week, and a **"Coming up"** agenda that collects interviews, assignment deadlines and closing dates from every application, sorted by urgency.
- **Applications list and board:** search, filter by status, and sort by most recent, date applied, next deadline or company.

### Learn what employers keep asking for
- **Skills insights** read the job descriptions you've saved and rank the skills that come up most, split into **required**, **nice to have** and **just mentioned**.
- Keep a **"My skills"** list and Shortlist shows your **coverage** of the most-requested skills and your **biggest gaps**.
- Each application also shows the skills in its own ad, with how many of the required ones you already have.

### Stay consistent
- **Application goals:** set a target such as "2 a day, weekdays only" or "10 a week".
- Shortlist tracks your pace, streaks and recent history, and **tells you when you're falling behind** or missed a day, with a nudge on the dashboard and a progress ring that's always visible. It celebrates when you hit the goal.

---

## How it works

A few parts that were interesting to build:

**Privacy and data isolation.** Authentication, the database and file storage all run on Supabase. Every table has Postgres row-level security, so users can only ever read or change their own rows. Child records (stages, assignments, screenshots) are also checked against the owner of the parent application. CVs and screenshots live in private storage buckets inside a per-user folder, and are only viewable through short-lived signed links.

**Skill extraction without AI.** The skills insights run entirely in the browser, with no AI model and no external API:
- A hand-built catalogue of around 200 skills, each with its alternative spellings ("ReactJS" → React, "Postgres" → PostgreSQL).
- Matching that respects word boundaries, so "Java" doesn't match inside "JavaScript" and "SQL" doesn't match inside "MySQL".
- Stricter rules for words with an everyday meaning, so "Go" in "go above and beyond" or "Excel" in "excel in a team" aren't counted.
- Section detection from the ad's headings ("Requirements", "Nice to have", "Responsibilities") and phrases within a line ("is a plus", "3+ years of", "must have"), which classify each skill as required, nice to have or mentioned.
- Overlap handling, so "React Native" isn't also counted as "React".
- Results cached per application, so the page stays fast as the list grows.

**Goal tracking.**
- The start of the week follows the visitor's region (via `Intl.Locale` week info), so it's Monday in most of Europe and Sunday in the US. Users can override it.
- Weekends on a "weekdays only" goal neither count as misses nor break a streak.
- Pace only compares you against days that have already finished, so a Monday morning never shows as "behind".
- Periods from before a goal existed are shown in the history but never counted against you.

**Built for people anywhere.** Dates, times, weekday names and relative phrases ("in 3 days", "2 weeks ago") are formatted with the browser's `Intl` APIs in each visitor's language and time zone.

**Details that make it feel fast.**
- Large retina screenshots are resized and converted to WebP in the browser before upload, so a 6 MB PNG becomes a few hundred KB.
- Adding a skill updates the screen instantly and rolls back if the save fails.
- Server data is cached and refreshed with TanStack Query.

**Accessible and responsive.**
- Modals use the native `<dialog>` element for focus trapping and Escape-to-close.
- Form fields are properly labelled and announce their errors.
- Charts have text alternatives.
- There are keyboard shortcuts (`N` for a new application, `/` to search).
- Light and dark themes are available, and reduced-motion preferences are respected.
- The layout works from a 360 px phone (with a bottom tab bar) up to a wide desktop.

---

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 with a custom token-based theme (light and dark) |
| Routing and data | React Router, TanStack Query |
| Backend | Supabase: Auth, Postgres with row-level security, Storage |
| Icons and type | Lucide, Geist and Instrument Serif |

## Project structure

```
src/
├── pages/            Overview, Applications, application detail and form, Skills, CVs, Settings, auth screens
├── components/       App UI: cards, modals, screenshot gallery, CV picker, goal widgets, skill views
│   └── ui/           Shared building blocks: buttons, fields, dialog, toasts, badges
├── lib/
│   ├── api.ts        Supabase queries and file storage
│   ├── queries.ts    Data fetching and caching hooks
│   ├── agenda.ts     Upcoming interviews, deadlines and closing dates
│   ├── goals.ts      Goal periods, pace, streaks and history
│   ├── jobUrl.ts     Company and source detection from job links
│   ├── images.ts     In-browser screenshot resizing
│   └── skills/       Skills catalogue, extraction and aggregation
└── layouts/          App shell (sidebar and phone tab bar) and auth layout

supabase/migrations/  Database schema, security policies and storage buckets
```
