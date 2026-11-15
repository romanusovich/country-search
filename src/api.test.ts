import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchCountries } from './api.js';
import { HttpError, classifyError } from './errors.js';
import { createFakeFetch } from './test-utils/fakeFetch.js';
import { getError } from './test-utils/getError.js';

const spainBody = [
  {
    name: 'Spain',
    capital: 'Madrid',
    population: 47000000,
    flags: { svg: 'https://example.com/es.svg' },
  },
];

describe('searchCountries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns mapped countries', async () => {
    vi.stubGlobal('fetch', createFakeFetch(0, spainBody));

    const result = await searchCountries('spain', new AbortController().signal);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Spain');
    expect(result[0].capital).toBe('Madrid');
    expect(result[0].flag).toBe('https://example.com/es.svg');
  });

  it('requests the right url with encoded query', async () => {
    const fakeFetch = vi.fn(createFakeFetch(0, []));
    vi.stubGlobal('fetch', fakeFetch);

    await searchCountries('a b/c', new AbortController().signal);

    expect(fakeFetch.mock.calls[0][0]).toBe(
      'https://countries.dev/name/a%20b%2Fc',
    );
  });

  it('returns empty array on 404 with text body', async () => {
    // как в настоящем API: 404 приходит текстом, а не JSON
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response('Country not found', { status: 404 })),
      ),
    );

    const result = await searchCountries(
      'asdfgh',
      new AbortController().signal,
    );

    expect(result).toEqual([]);
  });

  it.each([400, 429, 500, 503])(
    'throws HttpError on status %i',
    async (status) => {
      vi.stubGlobal('fetch', createFakeFetch(0, 'error', status));

      const error = await getError(
        searchCountries('spain', new AbortController().signal),
      );

      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(status);
      expect(classifyError(error)).toBe('http');
    },
  );

  it('rejects with AbortError when signal is aborted during request', async () => {
    vi.stubGlobal('fetch', createFakeFetch(1000, spainBody));
    const controller = new AbortController();

    const errorPromise = getError(searchCountries('spain', controller.signal));
    controller.abort();
    const error = await errorPromise;

    expect(classifyError(error)).toBe('cancelled');
  });

  it('rejects with AbortError when signal is already aborted', async () => {
    vi.stubGlobal('fetch', createFakeFetch(0, spainBody));
    const controller = new AbortController();
    controller.abort();

    const error = await getError(searchCountries('spain', controller.signal));

    expect(classifyError(error)).toBe('cancelled');
  });

  it('uses 8 seconds timeout', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    vi.stubGlobal('fetch', createFakeFetch(0, []));

    await searchCountries('spain', new AbortController().signal);

    expect(timeoutSpy).toHaveBeenCalledWith(8000);
  });

  it('rejects with TimeoutError when request takes too long', async () => {
    // fake timers не подменяют AbortSignal.timeout, поэтому подставляем свой сигнал
    const timeoutController = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal);
    vi.stubGlobal('fetch', createFakeFetch(60000, spainBody));

    const errorPromise = getError(
      searchCountries('spain', new AbortController().signal),
    );
    timeoutController.abort(
      new DOMException('The operation timed out.', 'TimeoutError'),
    );
    const error = await errorPromise;

    expect(classifyError(error)).toBe('timeout');
  });

  it('passes network error through', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    const error = await getError(
      searchCountries('spain', new AbortController().signal),
    );

    expect(error).toBeInstanceOf(TypeError);
    expect(classifyError(error)).toBe('network');
  });
});
