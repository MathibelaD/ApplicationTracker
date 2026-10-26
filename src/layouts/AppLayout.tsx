import {
  BriefcaseBusiness,
  FileText,
  LayoutGrid,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { displayName, useAuth } from "../auth/AuthProvider";
import { Logo } from "../components/Logo";
import { buttonClass } from "../components/ui/styles";
import { useTheme } from "../lib/theme";

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { to: "/skills", label: "Skills", icon: Target },
  { to: "/cvs", label: "My CVs", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { isDark, setTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // "N" anywhere (outside a text field) starts a new application.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (el.closest("input, textarea, select, [contenteditable], dialog")) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        navigate("/applications/new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const name = displayName(user);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line px-4 py-6 lg:flex">
        <Link to="/" className="px-2">
          <Logo />
        </Link>

        <Link to="/applications/new" className={buttonClass("primary", "md", "mt-8 w-full")}>
          <Plus className="size-4" aria-hidden />
          New application
          <kbd className="ml-auto rounded border border-current/20 px-1.5 font-sans text-[11px] opacity-70">N</kbd>
        </Link>

        <nav aria-label="Main" className="mt-6 flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`
              }
            >
              <Icon className="size-[18px]" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          >
            {isDark ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
            {isDark ? "Light mode" : "Dark mode"}
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-semibold text-[#14140f]">
              {name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-ink-3">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg p-1.5 text-ink-3 transition hover:bg-surface-2 hover:text-ink"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link to="/" aria-label="Shortlist home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={buttonClass("ghost", "icon")}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
            <Link to="/applications/new" className={buttonClass("primary", "sm")}>
              <Plus className="size-4" aria-hidden />
              New
            </Link>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          <Outlet />
        </main>

        {/* Mobile tab bar */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg/90 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 backdrop-blur-md lg:hidden"
        >
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition ${
                  isActive ? "text-ink" : "text-ink-3"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-full px-4 py-1 transition ${isActive ? "bg-lime text-[#14140f]" : ""}`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
