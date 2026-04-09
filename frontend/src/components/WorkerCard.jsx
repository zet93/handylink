export default function WorkerCard({ worker }) {
  const rating = worker.rating ?? 4.9;
  const reviewCount = worker.reviewCount ?? 0;
  const jobCount = worker.jobCount ?? 0;

  return (
    <article className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow" aria-label={`Worker ${worker.name} profile`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">
            {worker.name}
            {worker.verified && <span className="ml-2 text-xs text-green-600 font-medium">Verified</span>}
          </h3>
          <p className="text-xs text-gray-500">{worker.title ?? 'Experienced tradesperson'}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{worker.location ?? 'Remote'}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span>⭐ {rating.toFixed(1)}</span>
        <span>{reviewCount} reviews</span>
        <span>{jobCount} jobs</span>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{worker.bio ?? 'Reliable worker with strong customer ratings and timely delivery.'}</p>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">{worker.skillLevel ?? 'Experienced'}</span>
        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-800">{worker.hourlyRate ? `${worker.hourlyRate} RON/h` : 'Rate on request'}</span>
      </div>
    </article>
  );
}
