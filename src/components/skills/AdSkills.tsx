import { Link } from "react-router";
import { useUserSkills } from "../../lib/queries";
import { analyseApplications, resolveSkill, type Tier } from "../../lib/skills/extract";
import { TIER_LABEL, TIER_ORDER } from "../../lib/skills/tiers";
import { useToggleSkill } from "../../lib/skills/useToggleSkill";
import type { Application, UserSkill } from "../../lib/types";
import { HaveToggle } from "./SkillBits";

/** Skills found in one application's job description, grouped by how strongly they're asked for. */
export function AdSkills({ app }: { app: Pick<Application, "id" | "updated_at" | "job_description"> }) {
  const { data: skills = [] } = useUserSkills();
  const toggle = useToggleSkill();

  const { stats } = analyseApplications([app], skills.map((s) => s.name));
  if (stats.length === 0) return null;

  const mine = new Map<string, UserSkill>(skills.map((s) => [resolveSkill(s.name).id, s]));
  const groups = TIER_ORDER.map((tier) => ({
    tier,
    items: stats.filter((s) => s.applications[0].tier === tier),
  })).filter((g) => g.items.length > 0);

  const required = groups.find((g) => g.tier === "required")?.items ?? [];
  const haveRequired = required.filter((s) => mine.has(s.id)).length;

  return (
    <div className="mt-5 rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Skills in this ad</h3>
        {required.length > 0 && (
          <p className="text-xs text-ink-3">
            You have <span className="font-medium text-ink">{haveRequired}</span> of {required.length} required
          </p>
        )}
      </div>
      <div className="mt-3 space-y-3">
        {groups.map(({ tier, items }) => (
          <div key={tier}>
            <p className="mb-1.5 text-xs text-ink-3">{TIER_LABEL[tier as Tier]}</p>
            <ul className="flex flex-wrap gap-1.5">
              {items.map((s) => {
                const have = mine.has(s.id);
                return (
                  <li
                    key={s.id}
                    className={`inline-flex items-center gap-1 rounded-full py-0.5 pl-2.5 pr-0.5 text-xs font-medium ${
                      have ? "bg-accent-soft text-accent-soft-ink" : "bg-surface-2 text-ink-2"
                    }`}
                  >
                    {s.label}
                    <HaveToggle compact label={s.label} have={have} onToggle={() => toggle(s.label, mine.get(s.id))} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <Link to="/skills" className="mt-3 inline-block text-xs font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
        See skills across all your jobs
      </Link>
    </div>
  );
}
