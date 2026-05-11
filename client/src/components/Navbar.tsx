import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
            <Zap className="w-8 h-8 text-blue-500 fill-blue-400/20 animate-pulse" />
            <h1 className="text-2xl font-bold text-white">JobFlow AI</h1>
          </div>
        </Link>
        <div className="flex gap-6 items-center">
          <Link
            to="/login"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
