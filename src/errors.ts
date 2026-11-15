export class HttpError extends Error {
  status: number;

  constructor(status: number) {
    super(`HTTP error: ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

export type ErrorKind = 'cancelled' | 'timeout' | 'http' | 'network';

export function classifyError(error: unknown): ErrorKind {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'cancelled';
  }
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return 'timeout';
  }
  if (error instanceof HttpError) {
    return 'http';
  }
  return 'network';
}
