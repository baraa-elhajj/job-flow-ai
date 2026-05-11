import { Link } from "react-router-dom";
import { Zap, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 relative">
        <Zap
          size={80}
          className="text-blue-500 fill-blue-400/20 animate-pulse"
        />
        <span className="absolute -bottom-2 -right-2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded border border-slate-700">
          404
        </span>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
        Page Lost in the Flow
      </h1>

      <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
        The page you're looking for does not exist in the JobFlow AI ecosystem.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-white/80 transition-colors duration-300"
      >
        <ArrowLeft size={18} />
        Back to Home page
      </Link>
    </div>
  );
};

export default NotFound;
