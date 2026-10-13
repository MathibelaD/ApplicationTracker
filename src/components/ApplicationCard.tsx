import type { Application } from "../types";
import { StageBadge } from "./StageBadge";

interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard = ({
  application,
}: ApplicationCardProps) => {
  const {
    company,
    role,
    link,
    dateSent,
    stage,
    notes,
  } = application;


  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl font-bold text-indigo-600">
          {company.charAt(0).toUpperCase()}
        </div>
        {/* //this is where our stage component will go */}
        <StageBadge stage={stage} />
      </div>

      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900">
          {role}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {company}
        </p>
      </div>

      <div className="space-y-3 border-t border-gray-100 py-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Date sent:</span>{" "}
          {dateSent}
        </p>

        {notes && (
          <p className="line-clamp-2 text-sm text-gray-500">
            {notes}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xs text-gray-400">
          Job application
        </span>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View Job ↗
          </a>
        )}
      </div>
    </div>
  );
};