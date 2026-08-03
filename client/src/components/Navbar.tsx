import { EyeOff, Zap, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import UserMenu from "./UserMenu";

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
          {!loading && user && (
            <Link
              to="/hidden"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gruvbox-fg4 hover:text-gruvbox-fg0 hover:bg-gruvbox-bg2/50 rounded-lg transition"
            >
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">Hidden Jobs</span>
            </Link>
          )}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-gruvbox-fg4 hover:text-gruvbox-fg0 rounded-lg transition"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {!loading && user && <UserMenu user={user} onLogout={handleLogout} />}
          {!loading && !user && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gruvbox-orange hover:bg-gruvbox-orange_light text-white font-bold shadow-sm hover:shadow transition-all active:scale-[0.98]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
