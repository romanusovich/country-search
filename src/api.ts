import type { Country } from './types.js';

export async function searchCountries(
  _query: string,
  _signal: AbortSignal,
): Promise<Country[]> {
  throw new Error('not implemented');
}
