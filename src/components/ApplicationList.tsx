import { useState } from "react";
import type { Application, Stage } from "../types";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationSummary } from "./ApplicationSummary";

type ApplicationProp = {
  applications: Application[];
};

export type StageFilter = Stage | "all";

export const ApplicationList = ({ applications }: ApplicationProp) => {
  const [selectedStage, setSelectedStage] =
    useState<StageFilter>("all");

  const [search, setSearch] = useState("");

  const filteredApplications = applications
    .filter((application) => {
      const matchesStage =
        selectedStage === "all" ||
        application.stage === selectedStage;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        application.company.toLowerCase().includes(query) ||
        application.role.toLowerCase().includes(query);

      return matchesStage && matchesSearch;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <ApplicationSummary
        applications={applications}
        selectedStage={selectedStage}
        onStageChange={setSelectedStage}
        search={search}
        onSearchChange={setSearch}
      />

      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Applications
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {filteredApplications.length} applications · Newest first
          </p>
        </div>

        {filteredApplications.length > 0 ? (
          <div className="space-y-3">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <h3 className="font-semibold text-slate-900">
              No applications found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or selected stage.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};