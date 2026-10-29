import { LogOut, Monitor, Moon, Pencil, Plus, Sun } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { GoalModal } from "../components/goals/GoalModal";
import { PasswordInput } from "../components/PasswordInput";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Field";
import { errorMessage, useToast } from "../components/ui/Toast";
import { cardClass, eyebrowClass } from "../components/ui/styles";
import { goalSummary, PERIOD_ADJECTIVE } from "../lib/goals";
import { useGoals } from "../lib/queries";
import { supabase } from "../lib/supabase";
import type { Goal } from "../lib/types";
import { setWeekStart, useWeekInfo, type WeekStartPref } from "../lib/useGoalProgress";
import { useTheme, type ThemePreference } from "../lib/theme";

export function Settings() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const { preference, setTheme } = useTheme();

  const [name, setName] = useState<string>(user?.user_metadata?.full_name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSavingName(false);
    if (error) toast.error(errorMessage(error));
    else toast.success("Profile updated");
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return;
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) toast.error(errorMessage(error));
    else {
      setPassword("");
      toast.success("Password changed");
    }
  }

  const themes: { value: ThemePreference; label: string; icon: ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="size-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
    { value: "system", label: "System", icon: <Monitor className="size-4" /> },
  ];

  return (
    <div className="animate-rise">
      <header>
        <p className={eyebrowClass}>Account</p>
        <h1 className="mt-2 font-display text-[40px] leading-none tracking-tight sm:text-5xl">Settings</h1>
      </header>

      <div className="mt-8 max-w-3xl space-y-5">
        <Row title="Profile" description="How we greet you.">
          <form onSubmit={saveName} className="space-y-4">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Email" hint="Contact support to change your sign-in email.">
              <Input value={user?.email ?? ""} disabled readOnly />
            </Field>
            <Button type="submit" variant="secondary" loading={savingName}>
              Save profile
            </Button>
          </form>
        </Row>

        <Row title="Password" description="At least 8 characters.">
          <form onSubmit={savePassword} className="space-y-4">
            <Field
              label="New password"
              error={password.length > 0 && password.length < 8 ? "Use at least 8 characters." : undefined}
            >
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </Field>
            <Button type="submit" variant="secondary" loading={savingPassword} disabled={password.length < 8}>
              Change password
            </Button>
          </form>
        </Row>

        <Row title="Goals" description="How many applications you aim to send.">
          <GoalsSettings />
        </Row>

        <Row title="Appearance" description="Follow your device, or pick one.">
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={preference === t.value}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition ${
                  preference === t.value
                    ? "border-accent bg-accent-soft/60 text-ink ring-1 ring-accent"
                    : "border-line text-ink-2 hover:border-line-strong"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </Row>

        <Row title="Session" description="Sign out of SmartWebSync Application Tracker on this device.">
          <Button variant="secondary" onClick={signOut}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </Button>
        </Row>
      </div>
    </div>
  );
}

function Row({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className={`${cardClass} grid gap-5 p-5 sm:p-6 md:grid-cols-[200px_1fr] md:gap-8`}>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-ink-3">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const WEEKDAY = (isoDay: number) =>
  new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date(2024, 0, isoDay)); // 1 Jan 2024 was a Monday

function GoalsSettings() {
  const { data: goals = [] } = useGoals();
  const { pref, regionFirstDay } = useWeekInfo();
  const [editing, setEditing] = useState<Goal | "new" | null>(null);

  return (
    <div className="space-y-4">
      {goals.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {goals.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{PERIOD_ADJECTIVE[g.period]}</p>
                <p className="truncate text-sm text-ink-3">{goalSummary(g)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditing(g)}>
                <Pencil className="size-3.5" aria-hidden /> Edit
              </Button>
            </li>
          ))}
        </ul>
      )}
      {goals.length < 3 && (
        <Button variant="secondary" onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden /> {goals.length ? "Add another goal" : "Set a goal"}
        </Button>
      )}

      <Field label="Weeks start on" hint="Used for weekly goals. Saved on this device.">
        <Select value={pref} onChange={(e) => setWeekStart(e.target.value as WeekStartPref)}>
          <option value="region">Your region's default ({WEEKDAY(regionFirstDay)})</option>
          <option value="monday">Monday</option>
          <option value="sunday">Sunday</option>
        </Select>
      </Field>

      <GoalModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        goal={editing && editing !== "new" ? editing : undefined}
        usedPeriods={goals.map((g) => g.period)}
      />
    </div>
  );
}
