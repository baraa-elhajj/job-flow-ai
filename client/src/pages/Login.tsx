import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="min-h-screen bg-gruvbox-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gruvbox-bg1 rounded-lg shadow-2xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gruvbox-fg0 mb-2">JobFlow AI</h1>
            <p className="text-gruvbox-fg2">Sign in to your account</p>
          </div>

          <form className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gruvbox-fg2 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gruvbox-bg4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gruvbox-orange focus:border-transparent bg-gray-50 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gruvbox-fg2 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 border border-gruvbox-bg4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gruvbox-orange focus:border-transparent bg-gray-50 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gruvbox-orange hover:bg-gruvbox-orange_light text-gruvbox-fg0 font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gruvbox-fg2">
              Don't have an account?{" "}
              <a
                href="#"
                className="text-gruvbox-orange_light hover:text-gruvbox-orange font-semibold"
              >
                Sign up
              </a>
            </p>
          </div>

          <div className="flex justify-center mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/"
              className="text-sm text-gruvbox-orange_light hover:text-gruvbox-orange font-semibold text-center"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
