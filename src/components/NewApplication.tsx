import { Link } from "react-router";

export const NewApplication = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Back navigation */}
      <Link
        to="/applications"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-indigo-600"
      >
        <span>←</span>
        Back to applications
      </Link>

      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Add New Application
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Keep track of your next opportunity by adding a job application.
        </p>
      </div>

      {/* Form */}
      <form className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Company */}
          <div>
            <label
              htmlFor="company"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Company Name <span className="text-red-500">*</span>
            </label>

            <input
              id="company"
              name="company"
              type="text"
              placeholder="e.g. Google"
              minLength={2}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Job Title <span className="text-red-500">*</span>
            </label>

            <input
              id="role"
              name="role"
              type="text"
              placeholder="e.g. Frontend Developer"
              minLength={2}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Application Date */}
          <div>
            <label
              htmlFor="dateSent"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Date Sent <span className="text-red-500">*</span>
            </label>

            <input
              id="dateSent"
              name="dateSent"
              type="date"
              required
              max={new Date().toLocaleDateString("en-CA")}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Stage */}
          <div>
            <label
              htmlFor="stage"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Application Stage
            </label>

            <select
              id="stage"
              name="stage"
              defaultValue="wishlist"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="wishlist">Wishlist</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Job Link */}
          <div className="sm:col-span-2">
            <label
              htmlFor="link"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Job Posting URL
              <span className="ml-2 font-normal text-gray-400">
                Optional
              </span>
            </label>

            <input
              id="link"
              name="link"
              type="url"
              placeholder="https://example.com/careers"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Notes
              <span className="ml-2 font-normal text-gray-400">
                Optional
              </span>
            </label>

            <textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="Add any notes about this application..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Form actions */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
          <Link
            to="/applications"
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white opacity-50"
          >
            Save Application
          </button>
        </div>
      </form>
    </div>
  );
};