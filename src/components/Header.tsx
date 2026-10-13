import { Link } from "react-router";

export const Header = () => {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold text-indigo-600"
        >
          Application Tracker
        </Link>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Toggle theme"
          >
            🌙
          </button>

          <Link
            to="/applications/new"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Add Application
          </Link>
        </div>
      </div>
    </header>
  );
};