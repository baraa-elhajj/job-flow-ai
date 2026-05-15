import { Zap, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [isDark, setIsDark] = useState(() => {
    // Default to dark mode if not set
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

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-gruvbox-bg/80 border-b border-gruvbox-bg3">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
            <Zap className="w-8 h-8 text-gruvbox-orange fill-gruvbox-orange/20 animate-pulse" />
            <h1 className="text-2xl font-bold text-gruvbox-fg0">JobFlow AI</h1>
          </div>
        </Link>
        <div className="flex gap-6 items-center">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-gruvbox-fg4 hover:text-gruvbox-fg0 hover:bg-gruvbox-bg2 rounded-lg transition"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link
            to="/login"
            className="px-6 py-2 bg-gruvbox-orange hover:bg-gruvbox-orange_light text-white rounded-lg transition font-semibold"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
