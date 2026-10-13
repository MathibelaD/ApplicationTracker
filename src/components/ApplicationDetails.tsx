import { Link, useParams } from "react-router";
import { seedApplications } from "../data/seed";
import { StageBadge } from "../components/StageBadge";

export const ApplicationDetails = () => {
  const { id } = useParams<{ id: string }>();

  const application = seedApplications.find(
    (item) => item.id === id
  );

//   if (!application) {
//     return (
//       <div className="mx-auto max-w-xl px-6 py-20 text-center">
//         <div className="mb-5 text-5xl">🔎</div>

//         <h1 className="text-2xl font-bold text-gray-900">
//           Application not found
//         </h1>

//         <p className="mt-3 text-gray-500">
//           The application you're looking for doesn't exist.
//         </p>

//         <Link
//           to="/applications"
//           className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700"
//         >
//           Back to applications
//         </Link>
//       </div>
//     );
//   }

  const {
    company,
    role,
    link,
    dateSent,
    stage,
    notes,
    createdAt,
  } = application;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to="/applications"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-indigo-600"
      >
        <span>←</span>
        Back to applications
      </Link>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-bold text-indigo-600">
              {company.charAt(0).toUpperCase()}
            </div>

            <StageBadge stage={stage} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {role}
          </h1>

          <p className="mt-2 text-base text-gray-500">
            {company}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-gray-100 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Date applied
            </p>

            <p className="text-sm font-semibold text-gray-800">
              {dateSent}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Current stage
            </p>

            <StageBadge stage={stage} />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Record created
            </p>

            <p className="text-sm font-semibold text-gray-800">
              {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 p-6 sm:p-8">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Application notes
          </h2>

          <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600">
            {notes || "No notes added for this application yet."}
          </p>
        </div>

        {link && (
          <div className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-5 sm:px-8">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              View original job
              <span>↗</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};