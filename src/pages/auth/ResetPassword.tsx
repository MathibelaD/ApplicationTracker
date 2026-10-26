import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthProvider";
import { PasswordInput } from "../../components/PasswordInput";
import { Button, Spinner } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Toast";
import { AuthLayout } from "../../layouts/AuthLayout";
import { supabase } from "../../lib/supabase";

export function ResetPassword() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8 || mismatch) return;
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    toast.success("Password updated");
    navigate("/", { replace: true });
  }

  if (authLoading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return (
      <AuthLayout title="Link expired" subtitle="This reset link is no longer valid. Request a fresh one and try again.">
        <Link to="/forgot-password" className="text-sm font-medium text-ink underline underline-offset-4">
          Send a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Make it something you haven't used here before.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="New password" hint="At least 8 characters.">
          <PasswordInput
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password" error={mismatch ? "Passwords don't match." : undefined}>
          <PasswordInput autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
