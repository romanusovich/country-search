// возвращает ошибку, с которой завершился промис
export async function getError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected promise to reject, but it resolved');
}
