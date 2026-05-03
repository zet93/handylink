import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Zap, Wrench, Paintbrush, Hammer, Armchair, Sparkles, Home, MoreHorizontal } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import JobCard from '../components/JobCard';
import { getCategoryLabel } from '../constants/categories';

const CATEGORIES = [
  { key: 'electrical',         Icon: Zap },
  { key: 'plumbing',           Icon: Wrench },
  { key: 'painting',           Icon: Paintbrush },
  { key: 'carpentry',          Icon: Hammer },
  { key: 'furniture_assembly', Icon: Armchair },
  { key: 'cleaning',           Icon: Sparkles },
  { key: 'general',            Icon: Home },
  { key: 'other',              Icon: MoreHorizontal },
];

const CLIENT_STEPS = [
  { n: '1', title: 'Postează o lucrare', desc: 'Descrie ce ai nevoie și stabilește bugetul.' },
  { n: '2', title: 'Primești oferte', desc: 'Meșteri calificați licitează pe lucrarea ta în câteva ore.' },
  { n: '3', title: 'Angajează și plătește', desc: 'Alege cea mai bună ofertă, aprobă lucrarea și plătește în siguranță.' },
];

const WORKER_STEPS = [
  { n: '1', title: 'Răsfoiești lucrări', desc: 'Găsești lucrări care se potrivesc cu abilitățile și locația ta.' },
  { n: '2', title: 'Trimiți o ofertă', desc: 'Propui prețul tău și un mesaj clientului.' },
  { n: '3', title: 'Ești plătit', desc: 'Finalizezi lucrarea și primești plata prin platformă.' },
];

export default function LandingPage() {
  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['landing-jobs'],
    queryFn: () => axiosClient.get('/api/jobs', { params: { status: 'Open', pageSize: 6 } })
      .then(r => r.data.items ?? r.data),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <header className="py-20 px-6 text-center" style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}>
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-bg)' }}>Găsești meșterul potrivit în orașul tău</h1>
        <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--color-panel)' }}>
          Postează o lucrare sau găsește clienți — HandyLink conectează meșteri de încredere cu oamenii care au nevoie de ei.
        </p>
        <div className="flex gap-4 justify-center flex-wrap" style={{ justifyContent: 'center' }}>
          <Link to="/register" className="font-semibold px-6 py-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--accent)' }}>
            Postează o lucrare
          </Link>
          <Link to="/register" className="border font-semibold px-6 py-3 rounded-lg" style={{ borderColor: 'var(--color-bg)', color: 'var(--color-bg)' }}>
            Găsește lucrări
          </Link>
        </div>
      </header>

      <main>
        <section className="py-16 px-6 max-w-5xl mx-auto" style={{ backgroundColor: 'var(--color-bg)' }}>
          <h2 className="text-2xl font-bold text-center mb-10">Caută după categorie</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {CATEGORIES.map(({ key, Icon }) => (
              <Link
                key={key}
                to="/jobs"
                className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50 text-center"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}
              >
                <Icon size={28} style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>{getCategoryLabel(key)}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Pentru clienți</h2>
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
              <h2 className="text-2xl font-bold mb-6">Pentru meșteri</h2>
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

        <section className="py-16 px-6 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Lucrări recente</h2>
          {jobsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-xl p-4 animate-pulse" style={{ backgroundColor: 'var(--color-panel)' }}>
                  <div className="h-4 rounded mb-3" style={{ backgroundColor: 'var(--border)', width: '60%' }} />
                  <div className="h-3 rounded mb-2" style={{ backgroundColor: 'var(--border)', width: '80%' }} />
                  <div className="h-3 rounded" style={{ backgroundColor: 'var(--border)', width: '40%' }} />
                </div>
              ))}
            </div>
          ) : !recentJobs?.length ? (
            <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>Nu există lucrări disponibile momentan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recentJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </section>
      </main>

      <footer className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
        © {new Date().getFullYear()} HandyLink
      </footer>
    </div>
  );
}
