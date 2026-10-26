import { MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { PasswordInput } from "../../components/PasswordInput";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { AuthLayout } from "../../layouts/AuthLayout";
import { supabase } from "../../lib/supabase";

export function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < 8;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return;
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // With email confirmation on, Supabase returns no session until the link is clicked.
    if (data.session) navigate("/", { replace: true });
    else setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox" subtitle={<>We sent a confirmation link to <strong className="text-ink">{sentTo}</strong>.</>}>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <MailCheck className="size-6 text-accent" aria-hidden />
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            Open the link on this device to activate your account. It can take a minute to arrive — check spam if
            you don't see it.
          </p>
        </div>
        <Link to="/sign-in" className="mt-6 inline-block text-sm font-medium text-ink underline underline-offset-4">
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Start your shortlist"
      subtitle="Free, private, and only you can see your applications."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/sign-in" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <Input autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field
          label="Password"
          hint="At least 8 characters."
          error={tooShort ? "Use at least 8 characters." : undefined}
        >
          <PasswordInput
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
