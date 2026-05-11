import { Link } from "react-router-dom";
import { MapPin, Clock } from "lucide-react";

export default function JobsList() {
  const mockJobs = [
    {
      id: 1,
      title: "Senior Frontend Engineer",
      company: "TechCorp",
      location: "Remote",
      type: "Full-time",
      salary: "$120k - $160k",
      description: "We are looking for an experienced Frontend Engineer...",
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "StartupXYZ",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$100k - $140k",
      description: "Join our growing team and build amazing products...",
    },
    {
      id: 3,
      title: "Backend Engineer",
      company: "CloudTech",
      location: "New York, NY",
      type: "Full-time",
      salary: "$110k - $150k",
      description: "Work on scalable backend systems...",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-bold text-white mb-12">Available Jobs</h2>

        <div className="space-y-6">
          {mockJobs.map((job) => (
            <div
              key={job.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{job.title}</h3>
                  <p className="text-blue-400 text-lg">{job.company}</p>
                </div>
                <p className="text-lg font-semibold text-cyan-400">
                  {job.salary}
                </p>
              </div>

              <p className="text-slate-300 mb-4">{job.description}</p>

              <div className="flex gap-6 text-slate-400 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  {job.location}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  {job.type}
                </div>
              </div>

              <Link
                to={`/jobs/${job.id}`}
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
              >
                Apply Now
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
