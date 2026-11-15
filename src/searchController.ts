import { debounce } from './debounce.js';
import { searchCountries } from './api.js';
import { classifyError } from './errors.js';
import type { Country } from './types.js';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; countries: Country[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export type SearchController = {
  onInput: (text: string) => void;
  retry: () => void;
};

export function createSearchController(
  onChange: (state: SearchState) => void,
  delay = 300,
): SearchController {
  let currentRequest: AbortController | null = null;
  let lastQuery = '';

  function cancelCurrentRequest() {
    if (currentRequest) {
      currentRequest.abort();
      currentRequest = null;
    }
  }

  async function runSearch(query: string) {
    const controller = new AbortController();
    currentRequest = controller;
    onChange({ status: 'loading' });

    try {
      const countries = await searchCountries(query, controller.signal);
      if (countries.length === 0) {
        onChange({ status: 'empty' });
      } else {
        onChange({ status: 'success', countries: countries });
      }
    } catch (error) {
      const kind = classifyError(error);

      // мы сами отменили запрос, пользователю ничего показывать не нужно
      if (kind === 'cancelled') {
        return;
      }

      if (kind === 'timeout') {
        onChange({ status: 'error', message: 'Сервер слишком долго отвечает' });
      } else {
        onChange({ status: 'error', message: 'Не удалось загрузить данные' });
      }
    }
  }

  const debouncedSearch = debounce(runSearch, delay);

  function onInput(text: string) {
    const query = text.trim();
    lastQuery = query;

    // отменяем сразу, не дожидаясь debounce
    cancelCurrentRequest();
    debouncedSearch.cancel();

    if (query === '') {
      onChange({ status: 'idle' });
      return;
    }

    debouncedSearch(query);
  }

  function retry() {
    if (lastQuery === '') {
      return;
    }
    cancelCurrentRequest();
    runSearch(lastQuery);
  }

  return { onInput, retry };
}
