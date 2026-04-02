import { Link } from 'react-router-dom';

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
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <header className="py-20 px-6 text-center" style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}>
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-bg)' }}>Find trusted tradespeople near you</h1>
        <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--color-panel)' }}>
          Post a job or bid on work — HandyLink connects clients with skilled workers globally.
        </p>
        <div className="flex gap-4 justify-center flex-wrap" style={{ justifyContent: 'center' }}>
          <Link to="/register" className="font-semibold px-6 py-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--accent)' }}>
            Post a Job
          </Link>
          <Link to="/register" className="border font-semibold px-6 py-3 rounded-lg" style={{ borderColor: 'var(--color-bg)', color: 'var(--color-bg)' }}>
            Find Work
          </Link>
        </div>
      </header>

      <main>
        <section className="py-16 px-6 max-w-5xl mx-auto" style={{ backgroundColor: 'var(--color-bg)' }}>
          <h2 className="text-2xl font-bold text-center mb-10">Browse by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {CATEGORIES.map(({ emoji, label }) => (
              <Link
                key={label}
                to="/jobs"
                className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50 text-center"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}
              >
                <span className="text-3xl">{emoji}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">For clients</h2>
              <div className="space-y-6">
                {CLIENT_STEPS.map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                      <span className="flex items-center justify-center h-full font-bold">{n}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{desc}</p>
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
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--accent-dark)', color: '#fff' }}>
                      <span className="flex items-center justify-center h-full font-bold">{n}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
        © {new Date().getFullYear()} HandyLink
      </footer>
    </div>
  );
}
