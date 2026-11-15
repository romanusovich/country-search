import { describe, it, expect } from 'vitest';
import { HttpError, classifyError } from './errors.js';

describe('HttpError', () => {
  it('is an Error', () => {
    const error = new HttpError(500);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
  });

  it('keeps http status', () => {
    const error = new HttpError(503);

    expect(error.status).toBe(503);
  });

  it('has name HttpError', () => {
    const error = new HttpError(500);

    expect(error.name).toBe('HttpError');
  });

  it('has status in message', () => {
    const error = new HttpError(429);

    expect(error.message).toContain('429');
  });
});

describe('classifyError', () => {
  it('returns "cancelled" for AbortError', () => {
    const error = new DOMException('The operation was aborted.', 'AbortError');

    expect(classifyError(error)).toBe('cancelled');
  });

  it('returns "timeout" for TimeoutError', () => {
    const error = new DOMException('The operation timed out.', 'TimeoutError');

    expect(classifyError(error)).toBe('timeout');
  });

  it('returns "http" for HttpError', () => {
    expect(classifyError(new HttpError(500))).toBe('http');
  });

  it('returns "network" for TypeError from fetch', () => {
    const error = new TypeError('Failed to fetch');

    expect(classifyError(error)).toBe('network');
  });

  it('returns "network" for other DOMException', () => {
    const error = new DOMException('Something else', 'NetworkError');

    expect(classifyError(error)).toBe('network');
  });

  it('returns "network" for plain Error', () => {
    expect(classifyError(new Error('boom'))).toBe('network');
  });

  it('returns "network" for values that are not errors', () => {
    expect(classifyError('text')).toBe('network');
    expect(classifyError(undefined)).toBe('network');
    expect(classifyError(null)).toBe('network');
  });
});
