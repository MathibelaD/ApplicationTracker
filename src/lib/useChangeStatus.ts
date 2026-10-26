import { errorMessage, useToast } from "../components/ui/Toast";
import { STATUS_META } from "./constants";
import { companyName } from "./display";
import { toDateInputValue } from "./format";
import { useUpdateApplication } from "./queries";
import type { Application, ApplicationStatus } from "./types";

/** Changes an application's status, stamping today's date the first time it's marked applied. */
export function useChangeStatus() {
  const update = useUpdateApplication();
  const toast = useToast();

  return {
    pending: update.isPending,
    change: (app: Pick<Application, "id" | "status" | "applied_on" | "company" | "role" | "job_url">, status: ApplicationStatus) => {
      if (status === app.status) return;
      const patch: Partial<Application> = { status };
      if (status !== "wishlist" && !app.applied_on) patch.applied_on = toDateInputValue();
      update.mutate(
        { id: app.id, patch },
        {
          onSuccess: () => toast.success(`${companyName(app)} moved to ${STATUS_META[status].label}`),
          onError: (err) => toast.error(errorMessage(err)),
        },
      );
    },
  };
}
