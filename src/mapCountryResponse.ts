import type { RawCountry, Country } from './types.js';

export function mapCountryResponse(raw: RawCountry): Country {
  const name = raw.name || 'Unknown';

  const languages: string[] = [];
  if (raw.languages) {
    for (const lang of raw.languages) {
      if (lang.name) {
        languages.push(lang.name);
      }
    }
  }

  const currencies: string[] = [];
  if (raw.currencies) {
    for (const cur of raw.currencies) {
      currencies.push(`${cur.name} (${cur.code})`);
    }
  }

  // сначала картинка, потом эмодзи
  const flag = raw.flags?.svg || raw.flags?.png || raw.flag || '';

  // в API нет готового описания, собираем своё из известных полей
  const place = raw.subregion || raw.region || 'неизвестно';
  const description =
    `${name} (${raw.nativeName || name}) - страна, регион: ${place}. ` +
    `Жители: ${raw.demonym || '-'}.`;

  return {
    name: name,
    flag: flag,
    capital: raw.capital || '-',
    region: raw.region || '-',
    population: raw.population || 0,
    area: raw.area || 0,
    borders: raw.borders || [],
    languages: languages,
    currencies: currencies,
    description: description,
  };
}
