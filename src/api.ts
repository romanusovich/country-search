import { HttpError } from './errors.js';
import { mapCountryResponse } from './mapCountryResponse.js';
import type { Country, RawCountry } from './types.js';

const BASE_URL = 'https://countries.dev/name/';
const TIMEOUT_MS = 8000;

export async function searchCountries(
  query: string,
  signal: AbortSignal,
): Promise<Country[]> {
  // объединяем отмену пользователя и таймаут в один сигнал
  const fullSignal = AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]);

  const response = await fetch(BASE_URL + encodeURIComponent(query), {
    signal: fullSignal,
  });

  // 404 - это "ничего не найдено", а не ошибка
  // (тело ответа при этом текстовое, поэтому json() здесь не вызываем)
  if (response.status === 404) {
    return [];
  }

  // fetch сам не бросает ошибку на 4xx/5xx, проверяем руками
  if (!response.ok) {
    throw new HttpError(response.status);
  }

  const data: RawCountry[] = await response.json();
  return data.map(mapCountryResponse);
}
