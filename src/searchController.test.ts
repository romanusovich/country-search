import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSearchController } from './searchController.js';
import type { SearchState } from './searchController.js';
import { createFakeFetch } from './test-utils/fakeFetch.js';

type FetchLike = (
  url: string,
  options?: { signal?: AbortSignal },
) => Promise<Response>;

const spainBody = [{ name: 'Spain' }];

// подменяем fetch, создаём контроллер и собираем все его состояния в массив
function setup(fetchImpl: FetchLike) {
  const fakeFetch = vi.fn(fetchImpl);
  vi.stubGlobal('fetch', fakeFetch);

  const states: SearchState[] = [];
  const controller = createSearchController((state) => {
    states.push(state);
  }, 300);

  return { fakeFetch, states, controller };
}

function lastState(states: SearchState[]): SearchState {
  return states[states.length - 1];
}

function getCountryNames(state: SearchState): string[] {
  if (state.status !== 'success') {
    throw new Error(`expected success state, got ${state.status}`);
  }
  return state.countries.map((country) => country.name);
}

describe('search controller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('input handling', () => {
    it('shows idle state and sends no request for empty input', async () => {
      const { fakeFetch, states, controller } = setup(createFakeFetch(100, []));

      controller.onInput('');
      await vi.advanceTimersByTimeAsync(1000);

      expect(states).toEqual([{ status: 'idle' }]);
      expect(fakeFetch).not.toHaveBeenCalled();
    });

    it('treats input with only spaces as empty', async () => {
      const { fakeFetch, states, controller } = setup(createFakeFetch(100, []));

      controller.onInput('    ');
      await vi.advanceTimersByTimeAsync(1000);

      expect(states).toEqual([{ status: 'idle' }]);
      expect(fakeFetch).not.toHaveBeenCalled();
    });

    it('trims spaces around the query', async () => {
      const { fakeFetch, controller } = setup(createFakeFetch(100, spainBody));

      controller.onInput('  spain  ');
      await vi.advanceTimersByTimeAsync(300);

      expect(fakeFetch.mock.calls[0][0].endsWith('/spain')).toBe(true);
    });
  });

  describe('debounce', () => {
    it('does not send request before delay', async () => {
      const { fakeFetch, controller } = setup(createFakeFetch(100, spainBody));

      controller.onInput('spain');
      await vi.advanceTimersByTimeAsync(299);
      expect(fakeFetch).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(fakeFetch).toHaveBeenCalledTimes(1);
    });

    it('sends only one request for fast typing', async () => {
      const { fakeFetch, controller } = setup(createFakeFetch(100, spainBody));

      controller.onInput('s');
      await vi.advanceTimersByTimeAsync(100);
      controller.onInput('sp');
      await vi.advanceTimersByTimeAsync(100);
      controller.onInput('spa');
      await vi.advanceTimersByTimeAsync(300);

      expect(fakeFetch).toHaveBeenCalledTimes(1);
      expect(fakeFetch.mock.calls[0][0].endsWith('/spa')).toBe(true);
    });
  });

  describe('states', () => {
    it('goes through loading to success', async () => {
      const { states, controller } = setup(createFakeFetch(100, spainBody));

      controller.onInput('spain');
      await vi.advanceTimersByTimeAsync(400);

      expect(states.map((state) => state.status)).toEqual([
        'loading',
        'success',
      ]);
      expect(getCountryNames(lastState(states))).toEqual(['Spain']);
    });

    it('shows empty state on 404', async () => {
      const { states, controller } = setup(
        createFakeFetch(100, 'Country not found', 404),
      );

      controller.onInput('asdfgh');
      await vi.advanceTimersByTimeAsync(400);

      expect(lastState(states)).toEqual({ status: 'empty' });
    });

    it('shows empty state when API returns empty list', async () => {
      const { states, controller } = setup(createFakeFetch(100, []));

      controller.onInput('asdfgh');
      await vi.advanceTimersByTimeAsync(400);

      expect(lastState(states)).toEqual({ status: 'empty' });
    });

    it('shows error state on server error', async () => {
      const { states, controller } = setup(createFakeFetch(100, 'oops', 500));

      controller.onInput('spain');
      await vi.advanceTimersByTimeAsync(400);

      expect(lastState(states)).toEqual({
        status: 'error',
        message: 'Не удалось загрузить данные',
      });
    });

    it('shows error state on network failure', async () => {
      const { states, controller } = setup(() =>
        Promise.reject(new TypeError('Failed to fetch')),
      );

      controller.onInput('spain');
      await vi.advanceTimersByTimeAsync(300);

      expect(lastState(states)).toEqual({
        status: 'error',
        message: 'Не удалось загрузить данные',
      });
    });

    it('shows special message on timeout', async () => {
      // fake timers не подменяют AbortSignal.timeout, поэтому подставляем свой сигнал
      const timeoutController = new AbortController();
      vi.spyOn(AbortSignal, 'timeout').mockReturnValue(
        timeoutController.signal,
      );
      const { states, controller } = setup(createFakeFetch(60000, spainBody));

      controller.onInput('spain');
      await vi.advanceTimersByTimeAsync(300);
      timeoutController.abort(
        new DOMException('The operation timed out.', 'TimeoutError'),
      );
      await vi.advanceTimersByTimeAsync(0);

      expect(lastState(states)).toEqual({
        status: 'error',
        message: 'Сервер слишком долго отвечает',
      });
    });
  });

  describe('cancellation', () => {
    it('shows only the result of the last query', async () => {
      const slowFetch = createFakeFetch(1000, [{ name: 'Old Result' }]);
      const fastFetch = createFakeFetch(100, spainBody);
      const { fakeFetch, states, controller } = setup((url, options) => {
        if (url.endsWith('/sp')) {
          return slowFetch(url, options);
        }
        return fastFetch(url, options);
      });

      controller.onInput('sp');
      await vi.advanceTimersByTimeAsync(300); // запрос "sp" ушёл
      controller.onInput('spain'); // старый запрос должен отмениться
      await vi.advanceTimersByTimeAsync(300); // запрос "spain" ушёл
      await vi.advanceTimersByTimeAsync(2000); // ждём всё остальное

      const firstSignal = fakeFetch.mock.calls[0][1]?.signal;
      expect(firstSignal?.aborted).toBe(true);
      expect(getCountryNames(lastState(states))).toEqual(['Spain']);
      expect(states.some((state) => state.status === 'error')).toBe(false);
    });

    it('aborts request immediately on new input, before debounce ends', async () => {
      const { fakeFetch, controller } = setup(createFakeFetch(1000, spainBody));

      controller.onInput('sp');
      await vi.advanceTimersByTimeAsync(300); // запрос "sp" в полёте
      controller.onInput('spa'); // новый запрос ещё ждёт debounce

      const firstSignal = fakeFetch.mock.calls[0][1]?.signal;
      expect(firstSignal?.aborted).toBe(true);
      expect(fakeFetch).toHaveBeenCalledTimes(1);
    });

    it('aborts request and shows idle when input is cleared', async () => {
      const { fakeFetch, states, controller } = setup(
        createFakeFetch(1000, spainBody),
      );

      controller.onInput('sp');
      await vi.advanceTimersByTimeAsync(300);
      controller.onInput('');
      await vi.advanceTimersByTimeAsync(2000);

      const firstSignal = fakeFetch.mock.calls[0][1]?.signal;
      expect(firstSignal?.aborted).toBe(true);
      expect(lastState(states)).toEqual({ status: 'idle' });
      expect(states.some((state) => state.status === 'success')).toBe(false);
      expect(states.some((state) => state.status === 'error')).toBe(false);
    });

    it('cancels pending debounced search when input is cleared', async () => {
      const { fakeFetch, states, controller } = setup(
        createFakeFetch(100, spainBody),
      );

      controller.onInput('sp');
      await vi.advanceTimersByTimeAsync(100);
      controller.onInput('');
      await vi.advanceTimersByTimeAsync(1000);

      expect(fakeFetch).not.toHaveBeenCalled();
      expect(states).toEqual([{ status: 'idle' }]);
    });
  });

  describe('retry', () => {
    it('repeats the last query after an error', async () => {
      let callCount = 0;
      const { fakeFetch, states, controller } = setup((url, options) => {
        callCount += 1;
        if (callCount === 1) {
          return createFakeFetch(100, 'oops', 500)(url, options);
        }
        return createFakeFetch(100, spainBody)(url, options);
      });

      controller.onInput('spain');
      await vi.advanceTimersByTimeAsync(400);
      expect(lastState(states).status).toBe('error');

      controller.retry();
      await vi.advanceTimersByTimeAsync(100);

      expect(fakeFetch).toHaveBeenCalledTimes(2);
      expect(fakeFetch.mock.calls[1][0].endsWith('/spain')).toBe(true);
      expect(getCountryNames(lastState(states))).toEqual(['Spain']);
    });

    it('does nothing when there was no query', async () => {
      const { fakeFetch, states, controller } = setup(createFakeFetch(100, []));

      controller.retry();
      await vi.advanceTimersByTimeAsync(1000);

      expect(fakeFetch).not.toHaveBeenCalled();
      expect(states).toEqual([]);
    });
  });
});
