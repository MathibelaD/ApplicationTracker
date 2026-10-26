import { useMemo } from "react";
import { useApplications, useUserSkills } from "../queries";
import type { UserSkill } from "../types";
import { analyseApplications, resolveSkill, type SkillAnalysis } from "./extract";

export type SkillScope = "all" | "open";

/** Descriptions needed before the percentages stop being mostly noise. */
export const RELIABLE_SAMPLE = 8;

export interface SkillInsights {
  analysis: SkillAnalysis;
  /** Skill id → the user's saved entry for it. */
  mine: Map<string, UserSkill>;
  /** Applications in scope that have no description to read. */
  withoutDescription: number;
  inScope: number;
}

export function useSkillInsights(scope: SkillScope = "all") {
  const apps = useApplications();
  const skills = useUserSkills();

  const data = useMemo<SkillInsights | undefined>(() => {
    if (!apps.data || !skills.data) return undefined;
    const list =
      scope === "open" ? apps.data.filter((a) => a.status !== "rejected" && a.status !== "withdrawn") : apps.data;
    const mine = new Map<string, UserSkill>();
    for (const s of skills.data) mine.set(resolveSkill(s.name).id, s);
    return {
      analysis: analyseApplications(list, skills.data.map((s) => s.name)),
      mine,
      withoutDescription: list.filter((a) => !a.job_description?.trim()).length,
      inScope: list.length,
    };
  }, [apps.data, skills.data, scope]);

  return {
    data,
    isLoading: apps.isLoading || skills.isLoading,
    error: apps.error ?? skills.error,
    refetch: () => {
      apps.refetch();
      skills.refetch();
    },
  };
}
