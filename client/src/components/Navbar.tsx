import { Zap, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import UserMenu from "./UserMenu";
import GoogleIcon from "./icons/GoogleIcon";

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-gruvbox-bg/90 border-b border-gruvbox-bg3">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
            <Zap className="w-8 h-8 text-gruvbox-orange fill-gruvbox-orange/20 animate-pulse" />
            <h1 className="text-2xl font-bold text-gruvbox-fg0">JobFlow AI</h1>
          </div>
        </Link>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-gruvbox-fg4 hover:text-gruvbox-fg0 hover:bg-gruvbox-bg2 rounded-lg transition"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {!loading && user && (
            <UserMenu user={user} onLogout={handleLogout} />
          )}
          {!loading && !user && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gruvbox-bg3 bg-gruvbox-bg1 text-gruvbox-fg0 text-sm font-semibold shadow-sm hover:border-gruvbox-orange/50 hover:bg-gruvbox-bg0_h hover:shadow transition-all active:scale-[0.98]"
            >
              <GoogleIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Continue with Google</span>
              <span className="sm:hidden">Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
