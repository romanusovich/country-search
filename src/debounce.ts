export type DebouncedFunction<T extends unknown[]> = {
  (...args: T): void;
  cancel: () => void;
};

export function debounce<T extends unknown[]>(
  _fn: (...args: T) => void,
  _delay: number,
): DebouncedFunction<T> {
  throw new Error('not implemented');
}
