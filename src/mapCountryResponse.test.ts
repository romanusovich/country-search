import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from './mapCountryResponse.js';
import type { RawCountry } from './types.js';

// пример ответа API (Израиль, из документации)
const israel: RawCountry = {
  name: 'Israel',
  nativeName: 'ישראל',
  capital: 'Jerusalem',
  region: 'Asia',
  subregion: 'Western Asia',
  demonym: 'Israeli',
  population: 9216900,
  area: 20770,
  borders: ['EGY', 'JOR', 'LBN', 'SYR'],
  flag: '🇮🇱',
  flags: {
    svg: 'https://example.com/il.svg',
    png: 'https://example.com/il.png',
  },
  languages: [{ name: 'Hebrew' }],
  currencies: [{ code: 'ILS', name: 'Israeli new shekel', symbol: '₪' }],
};

describe('mapCountryResponse', () => {
  it('maps basic fields', () => {
    const result = mapCountryResponse(israel);

    expect(result.name).toBe('Israel');
    expect(result.capital).toBe('Jerusalem');
    expect(result.region).toBe('Asia');
    expect(result.population).toBe(9216900);
    expect(result.area).toBe(20770);
  });

  it('keeps borders as codes', () => {
    const result = mapCountryResponse(israel);

    expect(result.borders).toEqual(['EGY', 'JOR', 'LBN', 'SYR']);
  });

  it('converts languages to list of names', () => {
    const country: RawCountry = {
      ...israel,
      languages: [{ name: 'Hebrew' }, { name: 'Arabic' }],
    };

    const result = mapCountryResponse(country);

    expect(result.languages).toEqual(['Hebrew', 'Arabic']);
  });

  it('skips languages without name', () => {
    const country: RawCountry = {
      ...israel,
      languages: [{}, { name: 'Hebrew' }],
    };

    const result = mapCountryResponse(country);

    expect(result.languages).toEqual(['Hebrew']);
  });

  it('converts currencies to "name (code)" strings', () => {
    const result = mapCountryResponse(israel);

    expect(result.currencies).toEqual(['Israeli new shekel (ILS)']);
  });

  it('uses svg flag when it exists', () => {
    const result = mapCountryResponse(israel);

    expect(result.flag).toBe('https://example.com/il.svg');
  });

  it('uses png flag when there is no svg', () => {
    const country: RawCountry = {
      ...israel,
      flags: { png: 'https://example.com/il.png' },
    };

    const result = mapCountryResponse(country);

    expect(result.flag).toBe('https://example.com/il.png');
  });

  it('uses emoji flag when there are no flag images', () => {
    const country: RawCountry = { ...israel, flags: undefined };

    const result = mapCountryResponse(country);

    expect(result.flag).toBe('🇮🇱');
  });

  it('builds description from country data', () => {
    const result = mapCountryResponse(israel);

    expect(result.description).toContain('Israel');
    expect(result.description).toContain('Western Asia');
    expect(result.description).toContain('Israeli');
  });

  it('uses region in description when there is no subregion', () => {
    const country: RawCountry = { ...israel, subregion: undefined };

    const result = mapCountryResponse(country);

    expect(result.description).toContain('Asia');
  });

  it('returns default values for empty object', () => {
    const result = mapCountryResponse({});

    expect(result.name).toBe('Unknown');
    expect(result.flag).toBe('');
    expect(result.capital).toBe('-');
    expect(result.region).toBe('-');
    expect(result.population).toBe(0);
    expect(result.area).toBe(0);
    expect(result.borders).toEqual([]);
    expect(result.languages).toEqual([]);
    expect(result.currencies).toEqual([]);
    expect(result.description).toContain('Unknown');
  });
});
