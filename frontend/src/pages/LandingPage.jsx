import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';
import JobCard from '../components/JobCard';

const CATEGORIES = [
  { emoji: '⚡', label: 'Electrical' },
  { emoji: '🔧', label: 'Plumbing' },
  { emoji: '🎨', label: 'Painting' },
  { emoji: '🪚', label: 'Carpentry' },
  { emoji: '🛋️', label: 'Furniture' },
  { emoji: '🏠', label: 'General' },
];

const CLIENT_STEPS = [
  { n: '1', title: 'Post a job', desc: 'Describe what you need done and set your budget.' },
  { n: '2', title: 'Receive bids', desc: 'Qualified workers bid on your job within hours.' },
  { n: '3', title: 'Hire & pay', desc: 'Pick the best offer, approve the work, and pay securely.' },
];

const WORKER_STEPS = [
  { n: '1', title: 'Browse jobs', desc: 'Find jobs that match your skills and location.' },
  { n: '2', title: 'Submit a bid', desc: 'Propose your price and message to the client.' },
  { n: '3', title: 'Get paid', desc: 'Complete the job and receive payment through the platform.' },
];

export default function LandingPage() {
  const { data: recentJobs, isLoading: jobsLoading, isError: jobsError } = useQuery({
    queryKey: ['landing-jobs'],
    queryFn: () => axiosClient.get('/api/jobs', { params: { status: 'Open', pageSize: 6 } })
      .then(r => r.data.items ?? r.data),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-blue-600 text-white py-20 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Find trusted tradespeople near you</h1>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          Post a job or bid on work — HandyLink connects clients with skilled workers globally.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/post-job" className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50">
            Post a Job
          </Link>
          <Link to="/worker/browse" className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-500">
            Find Work
          </Link>
        </div>
      </header>

      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map(({ emoji, label }) => (
            <Link
              key={label}
              to="/jobs"
              className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50 text-center"
            >
              <span className="text-3xl">{emoji}</span>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Recent open jobs</h2>
        {jobsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : jobsError ? (
          <p className="text-center text-gray-500">Couldn't load jobs. Try refreshing the page.</p>
        ) : recentJobs?.length === 0 ? (
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No open jobs yet</h3>
            <p className="text-sm text-gray-500 mb-4">Be the first — post a job and get bids from skilled workers.</p>
            <Link to="/post-job" className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 inline-block">
              Post a Job
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
            <div className="text-center mt-6">
              <Link to="/jobs" className="text-blue-600 font-medium hover:underline">
                Browse all jobs &rarr;
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-6">For clients</h2>
            <div className="space-y-6">
              {CLIENT_STEPS.map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">{n}</div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-6">For workers</h2>
            <div className="space-y-6">
              {WORKER_STEPS.map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">{n}</div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} HandyLink
      </footer>
    </div>
  );
}
