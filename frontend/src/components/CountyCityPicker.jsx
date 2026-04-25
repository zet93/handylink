import { useWatch } from 'react-hook-form';
import nomenclator from '../data/ro-nomenclator.json';

export default function CountyCityPicker({ register, control, setValue, errors, onCitySelect }) {
  const countyId = useWatch({ control, name: 'county' });
  const cities = countyId
    ? nomenclator.cities.filter(c => c.county_id === countyId)
    : [];

  function handleCountyChange(e) {
    setValue('county', e.target.value, { shouldDirty: true });
    setValue('city', '', { shouldDirty: true });
  }

  function handleCityChange(e) {
    setValue('city', e.target.value, { shouldDirty: true });
    if (onCitySelect && e.target.value) {
      onCitySelect(e.target.value);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Județ</label>
        <select
          {...register('county')}
          onChange={handleCountyChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
        >
          <option value="">Selectează județul…</option>
          {nomenclator.counties.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.county && (
          <p className="text-red-500 text-xs mt-1">{errors.county.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Oraș / Comună</label>
        <select
          {...register('city')}
          onChange={handleCityChange}
          disabled={!countyId}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            !countyId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
          }`}
        >
          <option value="">{countyId ? 'Selectează orașul…' : 'Selectează județul întâi'}</option>
          {cities.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        {errors.city && (
          <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
        )}
      </div>
    </div>
  );
}
