// Fills a demo account with realistic applications, CVs, screenshots, skills and a goal.
//
//   pnpm seed:demo            create the demo user (if needed) and seed it
//   pnpm seed:demo --reset    wipe the demo user's data first, then seed again
//
// Needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (from .env), plus either:
//   SUPABASE_SERVICE_ROLE_KEY  creates the demo user, already confirmed, and sets its password
//   DEMO_PASSWORD              signs in to a demo account you created yourself in the app
// DEMO_EMAIL overrides the default demo address. All writes go through the demo user's
// own session, so row-level security applies exactly as it does in the app.

import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { APPLICATIONS, CVS, GOAL, MY_SKILLS, PERSONA } from "./data.mjs";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEMO_EMAIL ?? PERSONA.email;
const reset = process.argv.includes("--reset");

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!url || !anonKey) fail("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (see .env.example).");
if (!serviceKey && !process.env.DEMO_PASSWORD) {
  fail("Set SUPABASE_SERVICE_ROLE_KEY to create the demo user, or DEMO_PASSWORD to use an account you created yourself.");
}

const check = ({ data, error }, what) => {
  if (error) fail(`${what}: ${error.message}`);
  return data;
};

// ---------------------------------------------------------------------------
// Dates, relative to now in local time
// ---------------------------------------------------------------------------

const today = new Date();
today.setHours(0, 0, 0, 0);

const addDays = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + n);
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Moves Saturday and Sunday to the nearest weekday in the given direction. */
function weekday(n) {
  let d = addDays(n);
  const step = n >= 0 ? 1 : -1;
  while (d.getDay() === 0 || d.getDay() === 6) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + step);
  return d;
}

function at(day, time) {
  const [h, m] = time.split(":").map(Number);
  const d = weekday(day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

/** A plausible moment on a past day: working hours, varied by index. */
function momentOn(daysAgo, i) {
  const d = addDays(-daysAgo);
  d.setHours(8 + (i * 7) % 11, (i * 17) % 60, 0, 0);
  if (d > new Date()) return new Date(Date.now() - 20 * 60_000).toISOString();
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// A small one-page PDF, so the CV library has real files to open
// ---------------------------------------------------------------------------

function cvPdf(headline) {
  const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const lines = [
    [22, PERSONA.name],
    [12, headline],
    [10, "Johannesburg, South Africa  |  naledi.mokoena.demo@example.com"],
    [10, ""],
    [13, "Experience"],
    [10, "Frontend Engineer, Nightjar Digital (2022 - present)"],
    [10, "- Led the rebuild of a customer portal in React and TypeScript, cutting load time by 40%"],
    [10, "- Built a shared component library used by four product teams"],
    [10, "Junior Developer, Acacia Web Studio (2020 - 2022)"],
    [10, "- Built client websites and web apps with React, Node.js and REST APIs"],
    [10, ""],
    [13, "Skills"],
    [10, "JavaScript, TypeScript, React, Next.js, Redux, Node.js, Jest, Tailwind CSS, Figma, Git"],
    [10, ""],
    [13, "Education"],
    [10, "BSc Computer Science, University of the Witwatersrand (2019)"],
    [10, ""],
    [9, "Demo document for SmartWebSync Application Tracker. Not a real person."],
  ];
  let y = 790;
  const text = lines
    .map(([size, line]) => {
      y -= size + 8;
      return `BT /F1 ${size} Tf 56 ${y} Td (${esc(line)}) Tj ET`;
    })
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
  ];
  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const offset = Buffer.byteLength(out);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out);
}

// ---------------------------------------------------------------------------
// Sign in as the demo user
// ---------------------------------------------------------------------------

async function demoSession() {
  let password = process.env.DEMO_PASSWORD;

  if (serviceKey) {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    password ??= `Demo-${randomBytes(6).toString("base64url")}!`;
    let existing = null;
    for (let page = 1; !existing; page++) {
      const { users } = check(await admin.auth.admin.listUsers({ page, perPage: 1000 }), "Listing users");
      existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
      if (users.length < 1000) break;
    }
    if (existing) {
      check(await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true }), "Updating demo user");
      console.log(`• Using existing demo user ${email}`);
    } else {
      check(
        await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: PERSONA.name } }),
        "Creating demo user",
      );
      console.log(`• Created demo user ${email}`);
    }
  }

  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { user } = check(await client.auth.signInWithPassword({ email, password }), `Signing in as ${email}`);
  return { client, user, password };
}

// ---------------------------------------------------------------------------
// Wipe and seed
// ---------------------------------------------------------------------------

async function wipe(db, userId) {
  const cvFiles = check(await db.storage.from("cvs").list(userId, { limit: 1000 }), "Listing CV files");
  if (cvFiles.length) await db.storage.from("cvs").remove(cvFiles.map((f) => `${userId}/${f.name}`));

  const folders = check(await db.storage.from("screenshots").list(userId, { limit: 1000 }), "Listing screenshots");
  for (const folder of folders) {
    const files = check(await db.storage.from("screenshots").list(`${userId}/${folder.name}`, { limit: 1000 }), "Listing screenshots");
    if (files.length) await db.storage.from("screenshots").remove(files.map((f) => `${userId}/${folder.name}/${f.name}`));
  }

  // Stages, assignments and screenshot rows cascade with their application.
  for (const table of ["applications", "documents", "user_skills", "application_goals"]) {
    check(await db.from(table).delete().eq("user_id", userId), `Clearing ${table}`);
  }
}

async function seed(db, userId) {
  // CVs
  const cvIds = {};
  for (const [i, cv] of CVS.entries()) {
    const path = `${userId}/${randomUUID()}-${cv.file}`;
    const pdf = cvPdf(cv.headline);
    check(await db.storage.from("cvs").upload(path, pdf, { contentType: "application/pdf" }), `Uploading ${cv.file}`);
    const row = check(
      await db
        .from("documents")
        .insert({
          name: cv.name,
          file_name: cv.file,
          file_path: path,
          file_size: pdf.length,
          mime_type: "application/pdf",
          created_at: momentOn(70 - i * 20, i),
        })
        .select("id")
        .single(),
      `Saving ${cv.name}`,
    );
    cvIds[cv.key] = row.id;
  }
  console.log(`• ${CVS.length} CVs`);

  // Skills and goal
  check(
    await db.from("user_skills").insert(MY_SKILLS.map((name, i) => ({ name, created_at: momentOn(60, i) }))),
    "Saving skills",
  );
  const goalStart = momentOn(GOAL.createdDaysAgo, 1);
  check(
    await db.from("application_goals").insert({
      period: GOAL.period,
      target: GOAL.target,
      weekdays_only: GOAL.weekdays_only,
      created_at: goalStart,
      updated_at: goalStart,
    }),
    "Saving goal",
  );
  console.log(`• ${MY_SKILLS.length} skills and a goal of ${GOAL.target} per ${GOAL.period}`);

  // Applications and everything hanging off them
  let stages = 0;
  let assignments = 0;
  let shots = 0;
  for (const [i, app] of APPLICATIONS.entries()) {
    const daysAgo = app.applied ?? app.saved ?? 0;
    const created = momentOn(daysAgo, i);
    const row = check(
      await db
        .from("applications")
        .insert({
          company: app.company,
          role: app.role,
          location: app.location ?? null,
          work_mode: app.work_mode ?? null,
          employment_type: app.employment_type ?? null,
          job_url: app.job_url ?? null,
          source: app.source ?? null,
          salary: app.salary ?? null,
          job_description: app.description ?? null,
          status: app.status,
          applied_on: app.applied == null ? null : ymd(addDays(-app.applied)),
          closing_date: app.closing == null ? null : ymd(addDays(app.closing)),
          cv_id: app.cv ? cvIds[app.cv] : null,
          notes: app.notes ?? null,
          created_at: created,
          updated_at: created,
        })
        .select("id")
        .single(),
      `Saving ${app.company ?? "quick-added job"}`,
    );

    if (app.stages?.length) {
      check(
        await db.from("application_stages").insert(
          app.stages.map((s) => ({
            application_id: row.id,
            title: s.title,
            kind: s.kind,
            scheduled_at: at(s.day, s.time),
            outcome: s.outcome,
            meeting_link: s.meeting_link ?? null,
            notes: s.notes ?? null,
            created_at: s.day < 0 ? momentOn(-s.day + 4, i) : momentOn(2, i),
          })),
        ),
        `Saving stages for ${app.company}`,
      );
      stages += app.stages.length;
    }

    if (app.assignments?.length) {
      check(
        await db.from("assignments").insert(
          app.assignments.map((a) => ({
            application_id: row.id,
            title: a.title,
            link: a.link ?? null,
            due_at: at(a.day, a.time),
            status: a.status,
            notes: a.notes ?? null,
            created_at: momentOn(Math.max(1, -a.day + 5), i),
          })),
        ),
        `Saving assignments for ${app.company}`,
      );
      assignments += app.assignments.length;
    }

    for (const file of app.screenshots ?? []) {
      const png = readFileSync(new URL(`./assets/${file}`, import.meta.url));
      const path = `${userId}/${row.id}/${randomUUID()}.png`;
      check(await db.storage.from("screenshots").upload(path, png, { contentType: "image/png" }), `Uploading ${file}`);
      check(
        await db.from("job_screenshots").insert({
          application_id: row.id,
          file_path: path,
          file_name: file,
          file_size: png.length,
          mime_type: "image/png",
          width: png.readUInt32BE(16),
          height: png.readUInt32BE(20),
          created_at: created,
        }),
        `Saving ${file}`,
      );
      shots++;
    }
  }
  console.log(`• ${APPLICATIONS.length} applications, ${stages} stages, ${assignments} assignments, ${shots} screenshots`);
}

// ---------------------------------------------------------------------------

const { client: db, user, password } = await demoSession();

// A head-only count returns no rows, so read `count` from the response itself.
const existing = await db.from("applications").select("id", { count: "exact", head: true });
check(existing, "Checking existing data");
const { count } = existing;
if (count && !reset) fail(`${email} already has ${count} applications. Run again with --reset to replace them.`);
if (reset) {
  await wipe(db, user.id);
  console.log("• Cleared existing demo data");
}

await seed(db, user.id);
await db.auth.signOut();

console.log(`\n✔ Demo account ready\n  Email:    ${email}\n  Password: ${password}\n`);
