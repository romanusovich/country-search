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
  _onChange: (state: SearchState) => void,
  _delay = 300,
): SearchController {
  throw new Error('not implemented');
}
