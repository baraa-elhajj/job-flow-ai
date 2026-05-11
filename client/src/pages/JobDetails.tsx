import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, DollarSign } from "lucide-react";

export default function JobDetail() {
  const { id } = useParams();

  // TODO: Fetch from backend and remove mock data.
  const mockJobs = [
    {
      id: 1,
      title: "Senior Frontend Engineer",
      company: "TechCorp",
      location: "Remote",
      type: "Full-time",
      salary: "$120k - $160k",
      description: "We are looking for an experienced Frontend Engineer...",
      fullDescription: `
        We're seeking a Senior Frontend Engineer to join our growing team at TechCorp. 
        You'll be responsible for building scalable, performant web applications using modern 
        technologies like React, TypeScript, and Tailwind CSS.
        
        Your responsibilities will include:
        - Developing and maintaining frontend applications
        - Collaborating with product and design teams
        - Code reviews and mentoring junior developers
        - Optimizing application performance
        
        Required qualifications:
        - 5+ years of frontend development experience
        - Strong proficiency in React and TypeScript
        - Experience with modern CSS frameworks
        - Understanding of web performance best practices
        
        Nice to have:
        - Experience with Next.js
        - Knowledge of testing frameworks (Jest, React Testing Library)
        - Contribution to open source projects
      `,
      requirements: [
        "5+ years of frontend development experience",
        "Strong proficiency in React and TypeScript",
        "Experience with modern CSS frameworks",
        "Understanding of web performance best practices",
      ],
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "StartupXYZ",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$100k - $140k",
      description: "Join our growing team and build amazing products...",
      fullDescription: `
        StartupXYZ is looking for a talented Full Stack Developer to help us build the next 
        generation of our platform. You'll work across the entire stack, from frontend to backend.
      `,
      requirements: [
        "3+ years of full stack development experience",
        "Proficiency in React or similar frontend framework",
        "Backend development experience (Node.js, Python, or similar)",
        "Database design and optimization knowledge",
      ],
    },
    {
      id: 3,
      title: "Backend Engineer",
      company: "CloudTech",
      location: "New York, NY",
      type: "Full-time",
      salary: "$110k - $150k",
      description: "Work on scalable backend systems...",
      fullDescription: `
        CloudTech is seeking a Backend Engineer to help us build scalable, reliable systems 
        that power our platform. You'll work with a modern tech stack and have opportunities 
        to learn and grow.
      `,
      requirements: [
        "4+ years of backend development experience",
        "Experience with cloud platforms (AWS, GCP, Azure)",
        "Strong database knowledge",
        "Experience with microservices architecture",
      ],
    },
  ];

  const job = mockJobs.find((j) => j.id === parseInt(id || "0"));

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Job Not Found
        </h1>

        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
          The job you're looking for does not exist. It might have been removed
          or the ID is incorrect.
        </p>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-white/80 transition-colors duration-300"
        >
          <ArrowLeft size={18} />
          Back to Jobs List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="max-w-4xl mx-auto px-6 py-12">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-white hover:text-white/90 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Jobs List
        </Link>

        {/* Job Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{job.title}</h1>
          <p className="text-2xl text-blue-400 mb-6">{job.company}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pb-8 border-b border-slate-700">
            <div>
              <p className="text-slate-400 text-sm uppercase mb-1">Salary</p>
              <p className="text-xl font-semibold text-cyan-400 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {job.salary}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase mb-1">Location</p>
              <p className="text-lg text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                {job.location}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase mb-1">Job Type</p>
              <p className="text-lg text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                {job.type}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase mb-1">Job ID</p>
              <p className="text-lg text-white font-mono">{job.id}</p>
            </div>
          </div>

          <button className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-lg">
            Apply Now
          </button>
        </div>

        {/* Job Description */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About the Role</h2>
          <p className="text-slate-300 whitespace-pre-line leading-relaxed">
            {job.fullDescription}
          </p>
        </div>

        {/* Requirements */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Requirements</h2>
          <ul className="space-y-3">
            {job.requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-300">
                <span className="text-blue-400 font-bold mt-1">✓</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 text-center">
          <button className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-lg">
            Apply for This Position
          </button>
        </div>
      </section>
    </div>
  );
}
