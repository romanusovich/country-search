export class HttpError extends Error {
  status = 0;

  constructor(_status: number) {
    super('not implemented');
    throw new Error('not implemented');
  }
}

export type ErrorKind = 'cancelled' | 'timeout' | 'http' | 'network';

export function classifyError(_error: unknown): ErrorKind {
  throw new Error('not implemented');
}
