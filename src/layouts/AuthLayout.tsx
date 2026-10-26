import type { ReactNode } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

const SAMPLE = [
  { company: "Northwind", role: "Product Designer", tag: "Interview · Thu 10:00", tone: "bg-amber-200/90 text-amber-950" },
  { company: "Halcyon Labs", role: "Frontend Engineer", tag: "Take-home due in 2 days", tone: "bg-lime text-[#14140f]" },
  { company: "Ferro & Co.", role: "Data Analyst", tag: "Applied 6 days ago", tone: "bg-sky-200/90 text-sky-950" },
];

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#161512] p-12 text-[#f1efe8] lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden
        />
        <div className="relative [&_.fill-ink]:fill-[#f1efe8] [&_.fill-bg]:fill-[#161512]">
          <Logo />
        </div>

        <div className="relative mt-auto max-w-lg">
          <h2 className="font-display text-[56px] leading-[1.02] tracking-tight">
            Every application,
            <br />
            <em className="text-lime">accounted for.</em>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#b8b4a9]">
            Keep the job ad, the CV you sent, every interview round and every take-home deadline in one calm place.
          </p>
        </div>

        <ul className="relative mt-12 space-y-3" aria-hidden>
          {SAMPLE.map((s, i) => (
            <li
              key={s.company}
              className="flex max-w-md items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur"
              style={{ marginLeft: `${i * 28}px` }}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">
                {s.company.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.role}</p>
                <p className="truncate text-xs text-[#807c71]">{s.company}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${s.tone}`}>{s.tag}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Form */}
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <Link to="/" className="lg:hidden">
          <Logo />
        </Link>
        <div className="mx-auto my-auto w-full max-w-sm py-10 animate-rise">
          <h1 className="font-display text-[40px] leading-tight tracking-tight">{title}</h1>
          <p className="mt-2 text-[15px] text-ink-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-ink-2">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
