import { describe, it, expect } from 'vitest';
import nomenclator from '../ro-nomenclator.json';

describe('ro-nomenclator.json', () => {
  it('NOM-05: has exactly 42 county entries', () => {
    expect(nomenclator.counties).toHaveLength(42);
  });

  it('NOM-06: București county has exactly 6 sector cities', () => {
    const bCities = nomenclator.cities.filter(c => c.county_id === 'B');
    expect(bCities).toHaveLength(6);
    const names = bCities.map(c => c.name);
    expect(names).toContain('Sector 1');
    expect(names).toContain('Sector 6');
  });

  it('every county entry has id, name fields', () => {
    nomenclator.counties.forEach(county => {
      expect(county).toHaveProperty('id');
      expect(county).toHaveProperty('name');
    });
  });

  it('every city entry has id, county_id, name fields', () => {
    nomenclator.cities.forEach(city => {
      expect(city).toHaveProperty('id');
      expect(city).toHaveProperty('county_id');
      expect(city).toHaveProperty('name');
    });
  });

  it('all city county_id values reference a valid county', () => {
    const countyIds = new Set(nomenclator.counties.map(c => c.id));
    nomenclator.cities.forEach(city => {
      expect(countyIds.has(city.county_id)).toBe(true);
    });
  });
});
