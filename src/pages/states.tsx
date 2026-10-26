import { CircleAlert, Compass } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { buttonClass } from "../components/ui/styles";

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-6" aria-busy aria-label="Loading">
      <div className="space-y-3">
        <div className="h-3 w-32 rounded bg-surface-2" />
        <div className="h-10 w-72 max-w-full rounded-lg bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-surface-2" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}

export function ErrorPanel({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <EmptyState
      icon={CircleAlert}
      title="Couldn't load your data"
      description={
        <>
          {message}
          <br />
          If this is a fresh Supabase project, make sure you've run the SQL migration.
        </>
      }
      action={
        onRetry && (
          <Button variant="secondary" onClick={() => onRetry()}>
            Try again
          </Button>
        )
      }
    />
  );
}

export function NotFound({ what = "page" }: { what?: string }) {
  return (
    <div className="py-10">
      <EmptyState
        icon={Compass}
        title={`This ${what} doesn't exist`}
        description="It may have been deleted, or the link is wrong."
        action={
          <Link to="/applications" className={buttonClass("secondary")}>
            Go to applications
          </Link>
        }
      />
    </div>
  );
}
