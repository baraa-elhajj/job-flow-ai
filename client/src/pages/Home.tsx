import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="max-w-6xl mx-auto px-6 pt-20">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-900/30 border border-blue-500 rounded-full mb-6">
            <p className="text-blue-300 text-sm font-semibold">
              🚀 AI-Powered Job Applications
            </p>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Fasten Your{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Job Hunt
            </span>
          </h2>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Stop wasting time reading long job descriptions. JobFlow AI gives
            you personalized job recommendations, useful insights, and generates
            customized applications for you.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center gap-2 text-lg"
            >
              Start Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/jobs"
              className="px-8 py-4 border-2 border-slate-600 hover:border-slate-500 text-white rounded-lg font-semibold transition"
            >
              Find Jobs
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-16 py-8 border-t border-slate-700">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-400">5x</p>
            <p className="text-slate-400 mt-2">Faster Applications</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-cyan-400">95%</p>
            <p className="text-slate-400 mt-2">Match Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-400">100%</p>
            <p className="text-slate-400 mt-2">Free Usage</p>
          </div>
        </div>
      </section>
    </div>
  );
}
