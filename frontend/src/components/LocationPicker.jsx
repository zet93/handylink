import { useState, useEffect, useRef } from 'react';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Marker } from 'react-leaflet';
import JobMap from './JobMap';

const provider = new OpenStreetMapProvider({ params: { countrycodes: 'ro' } });

function DraggableMarker({ latitude, longitude, address, onChange }) {
  return (
    <Marker
      position={[latitude, longitude]}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const ll = e.target.getLatLng();
          onChange({ latitude: ll.lat, longitude: ll.lng, address });
        },
      }}
    />
  );
}

export default function LocationPicker({ latitude, longitude, address, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 3) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await provider.search({ query });
        setResults(found.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  function selectResult(result) {
    onChange({ latitude: result.y, longitude: result.x, address: result.label });
    setQuery(result.label);
    setResults([]);
  }

  function clearLocation() {
    onChange({ latitude: null, longitude: null, address: null });
    setQuery('');
  }

  return (
    <div>
      <label className="block text-sm font-semibold mb-1">Job Location (optional)</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search address, e.g. Strada Florilor, Cluj"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        {loading && (
          <svg className="animate-spin h-4 w-4 text-gray-400 absolute right-3 top-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {results.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
            {results.map((result, i) => (
              <li
                key={i}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                onClick={() => selectResult(result)}
              >
                {result.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {latitude && longitude && (
        <div className="mt-2">
          <JobMap latitude={latitude} longitude={longitude} address={address} />
        </div>
      )}
      {latitude && (
        <button
          type="button"
          onClick={clearLocation}
          className="text-red-600 text-xs mt-1 hover:underline"
        >
          Remove location
        </button>
      )}
    </div>
  );
}
