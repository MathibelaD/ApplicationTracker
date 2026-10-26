import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { PasswordInput } from "../../components/PasswordInput";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { AuthLayout } from "../../layouts/AuthLayout";
import { supabase } from "../../lib/supabase";

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError(
        error.message === "Email not confirmed"
          ? "Please confirm your email first — check your inbox for the link."
          : error.message === "Invalid login credentials"
            ? "That email and password don't match. Try again or reset your password."
            : error.message,
      );
      return;
    }
    navigate(from, { replace: true });
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link to="/sign-up" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
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
        <div>
          <Field label="Password">
            <PasswordInput
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-ink-2 hover:text-ink">
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
