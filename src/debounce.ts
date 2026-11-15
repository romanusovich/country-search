export type DebouncedFunction<T extends unknown[]> = {
  (...args: T): void;
  cancel: () => void;
};

export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number,
): DebouncedFunction<T> {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: T) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  // нужно, чтобы отменять отложенный вызов, например когда поле очистили
  debounced.cancel = () => {
    clearTimeout(timerId);
  };

  return debounced;
}
