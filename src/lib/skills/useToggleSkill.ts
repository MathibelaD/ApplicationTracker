import { errorMessage, useToast } from "../../components/ui/Toast";
import { useAddUserSkill, useRemoveUserSkill } from "../queries";
import type { UserSkill } from "../types";

/** Adds a skill to "My skills", or removes the matching entry. */
export function useToggleSkill() {
  const add = useAddUserSkill();
  const remove = useRemoveUserSkill();
  const toast = useToast();

  return (label: string, existing: UserSkill | undefined) => {
    if (existing) {
      if (existing.id.startsWith("temp-")) return;
      remove.mutate(existing.id, { onError: (err) => toast.error(errorMessage(err)) });
    } else {
      add.mutate(label, {
        onError: (err) =>
          toast.error(/duplicate|unique/i.test(errorMessage(err)) ? `${label} is already in your skills` : errorMessage(err)),
      });
    }
  };
}
