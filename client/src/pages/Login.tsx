import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">JobFlow AI</h1>
            <p className="text-slate-300">Sign in to your account</p>
          </div>

          <form className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-gray-50 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-gray-50 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-slate-300">
              Don't have an account?{" "}
              <a
                href="#"
                className="text-blue-400 hover:text-blue-500 font-semibold"
              >
                Sign up
              </a>
            </p>
          </div>

          <div className="flex justify-center mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/"
              className="text-sm text-blue-400 hover:text-blue-500 font-semibold text-center"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
