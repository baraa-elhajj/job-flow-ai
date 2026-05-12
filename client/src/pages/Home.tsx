import { ArrowRight, Search, Zap, Shield, Target, Bot, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 overflow-hidden">
        {/* Floating glow orbs */}
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-float-slow-reverse pointer-events-none" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl animate-float-slow pointer-events-none" />

        <div className="relative text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-900/30 border border-blue-500/60 rounded-full mb-6 animate-fade-in-up animate-pulse-glow">
            <p className="text-blue-300 text-sm font-semibold">
              🚀 AI-Powered Job Applications
            </p>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up-delay-1">
            Fasten Your{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Job Hunt
            </span>
          </h2>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8 animate-fade-in-up-delay-2">
            Stop wasting time reading long job descriptions. JobFlow AI gives
            you personalized job recommendations, useful insights, and generates
            customized applications for you.
          </p>

          <div className="flex gap-4 justify-center animate-fade-in-up-delay-3">
            <Link
              to="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-lg"
            >
              Start Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/jobs"
              className="px-8 py-4 border-2 border-slate-600 hover:border-blue-500/50 hover:bg-blue-900/10 text-white rounded-lg font-semibold transition-all duration-300"
            >
              Find Jobs
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-6 mt-16 py-8 border-t border-slate-700 animate-fade-in-up-delay-3">
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

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h3>
          <p className="text-slate-400 max-w-xl mx-auto">
            JobFlow AI automates the tedious parts of job hunting so you can focus on what matters — landing interviews.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-5">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Smart Scraping</h4>
            <p className="text-slate-400 leading-relaxed">
              We aggregate job postings from Hacker News, remote boards, and more — parsing titles, salaries, skills, and locations automatically.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-5">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">AI Enrichment</h4>
            <p className="text-slate-400 leading-relaxed">
              Each posting is enriched with structured data — company names, tech stacks, seniority levels, and visa info extracted intelligently.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-5">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Personalized Matches</h4>
            <p className="text-slate-400 leading-relaxed">
              Filter jobs by your preferred skills, location, and salary range. Get recommendations tailored to your profile.
            </p>
          </div>
        </div>
      </section>

      {/* Why JobFlow */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why JobFlow AI?
            </h3>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built by developers, for developers. We know the pain of scrolling through hundreds of unstructured job posts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h5 className="text-lg font-semibold text-white mb-1">Instant Parsing</h5>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Regex + LLM pipeline extracts structured data from unstructured job posts in seconds.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h5 className="text-lg font-semibold text-white mb-1">Market Insights</h5>
                <p className="text-slate-400 text-sm leading-relaxed">
                  See salary trends, popular tech stacks, and hiring hotspots at a glance.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h5 className="text-lg font-semibold text-white mb-1">No Spam, No Noise</h5>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Every listing is verified and enriched. No duplicate posts, no irrelevant results.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Search className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h5 className="text-lg font-semibold text-white mb-1">Advanced Filters</h5>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Search by skill, location, salary range, seniority, remote/onsite, and visa sponsorship.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center py-16 border-t border-slate-700">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to find your next role?
          </h3>
          <p className="text-slate-400 max-w-lg mx-auto mb-8">
            Browse hundreds of curated tech jobs from Hacker News and more. No signup required.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-lg"
          >
            Browse Jobs <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
