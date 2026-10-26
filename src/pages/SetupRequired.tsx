import { Logo } from "../components/Logo";

/** Shown in place of the app when the Supabase env vars are missing. */
export function SetupRequired() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <Logo />
      <h1 className="mt-10 font-display text-4xl tracking-tight">Connect Supabase to get started</h1>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-ink-2">
        <li>
          Copy <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">.env.example</code> to{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">.env.local</code>.
        </li>
        <li>
          Fill in <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">VITE_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">VITE_SUPABASE_ANON_KEY</code> from your
          project's API settings.
        </li>
        <li>
          Run <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">supabase/migrations/…_init.sql</code> in the
          Supabase SQL editor.
        </li>
        <li>Restart the dev server.</li>
      </ol>
    </main>
  );
}
