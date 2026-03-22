import { Link } from 'react-router-dom';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function JobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block bg-white border rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 leading-tight">{job.title}</h3>
        <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 whitespace-nowrap capitalize">
          {job.category.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{job.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>📍 {job.city}, {job.country}</span>
        {(job.budgetMin || job.budgetMax) && (
          <span>
            {job.budgetMin && job.budgetMax
              ? `${job.budgetMin}–${job.budgetMax} RON`
              : job.budgetMin
              ? `From ${job.budgetMin} RON`
              : `Up to ${job.budgetMax} RON`}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-full capitalize ${job.status === 'open' || job.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {job.status.replace('_', ' ')}
        </span>
        <span>
          {job.bidCount > 0 ? `${job.bidCount} bid${job.bidCount === 1 ? '' : 's'}` : 'No bids yet'}
        </span>
        {job.createdAt && <span>{timeAgo(job.createdAt)}</span>}
      </div>
    </Link>
  );
}
