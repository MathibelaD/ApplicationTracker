import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAddUserSkill, useRemoveUserSkill } from "../../lib/queries";
import { SKILLS } from "../../lib/skills/catalog";
import { resolveSkill } from "../../lib/skills/extract";
import type { UserSkill } from "../../lib/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { errorMessage, useToast } from "../ui/Toast";
import { cardClass } from "../ui/styles";

/** The user's own, manually edited skills list. */
export function MySkillsEditor({ skills }: { skills: UserSkill[] }) {
  const toast = useToast();
  const add = useAddUserSkill();
  const remove = useRemoveUserSkill();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const haveIds = new Set(skills.map((s) => resolveSkill(s.name).id));
  const suggestions = SKILLS.filter((s) => !haveIds.has(s.id));

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = value.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (name.length > 60) return setError("Keep it under 60 characters.");
    const ref = resolveSkill(name);
    if (haveIds.has(ref.id)) return setError(`${ref.label} is already in your list.`);
    setError(null);
    setValue("");
    // Store the catalog's spelling when we recognise the skill.
    add.mutate(ref.category === "custom" ? name : ref.label, { onError: (err) => toast.error(errorMessage(err)) });
  }

  return (
    <section className={`${cardClass} p-5 sm:p-6`} aria-labelledby="my-skills-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="my-skills-title" className="font-semibold">
          My skills
        </h2>
        <span className="text-sm tabular-nums text-ink-3">{skills.length}</span>
      </div>
      <p className="mt-1 text-sm text-ink-3">What you'd confidently put on your CV. Used to show your gaps.</p>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <label htmlFor="add-skill" className="sr-only">
          Add a skill
        </label>
        <Input
          id="add-skill"
          list="skill-suggestions"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="e.g. React, Figma, SQL…"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "add-skill-error" : undefined}
        />
        <datalist id="skill-suggestions">
          {suggestions.map((s) => (
            <option key={s.id} value={s.label} />
          ))}
        </datalist>
        <Button type="submit" variant="secondary" aria-label="Add skill" className="shrink-0 px-3">
          <Plus className="size-4" aria-hidden />
          <span className="max-sm:sr-only">Add</span>
        </Button>
      </form>
      {error && (
        <p id="add-skill-error" role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      {skills.length === 0 ? (
        <p className="mt-4 rounded-xl bg-surface-2 px-3.5 py-3 text-sm text-ink-2">
          Nothing here yet. Add skills above, or tap <strong className="font-medium text-ink">Add</strong> next to any skill
          in the list.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {skills.map((s) => {
            const custom = resolveSkill(s.name).category === "custom";
            return (
              <li key={s.id}>
                <span
                  className={`inline-flex max-w-full items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm ${
                    custom ? "border border-dashed border-line-strong text-ink" : "bg-surface-2 text-ink"
                  }`}
                  title={custom ? "Not in the built-in list — matched by its exact name" : undefined}
                >
                  <span className="truncate">{s.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      !s.id.startsWith("temp-") &&
                      remove.mutate(s.id, { onError: (err) => toast.error(errorMessage(err)) })
                    }
                    className="rounded-full p-1 text-ink-3 transition hover:bg-surface hover:text-ink"
                    aria-label={`Remove ${s.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
