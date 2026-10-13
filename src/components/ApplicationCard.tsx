import type { Application } from "../types";

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

  const stageColors = {
    wishlist: "bg-slate-100 text-slate-700",
    applied: "bg-blue-100 text-blue-700",
    interview: "bg-amber-100 text-amber-700",
    offer: "bg-green-100 text-green-700",
    closed: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl font-bold text-indigo-600">
          {company.charAt(0).toUpperCase()}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${stageColors[stage]}`}
        >
          {stage}
        </span>
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