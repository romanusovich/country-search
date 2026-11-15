export function createFakeFetch(delay: number, body: unknown, status = 200) {
  return (_url: string, options?: { signal?: AbortSignal }) => {
    return new Promise<Response>((resolve, reject) => {
      const signal = options?.signal;

      // если запрос уже отменён, сразу отклоняемся
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }

      const timer = setTimeout(() => {
        resolve(new Response(JSON.stringify(body), { status }));
      }, delay);

      // если отменят во время ожидания, сбрасываем таймер и отклоняемся
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(signal.reason);
      });
    });
  };
}
