/**
 * Races a promise (or PostgREST/Supabase thenable) against a timeout so the UI never hangs
 * indefinitely (e.g. when the Supabase project is paused/unreachable). On timeout, the
 * returned promise rejects with a clear, user-facing error instead of waiting forever.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
export const DEFAULT_TIMEOUT_MESSAGE =
  'The request took too long to respond. Check your internet connection and that your Supabase project is active, then try again.';

export function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
  timeoutMessage: string = DEFAULT_TIMEOUT_MESSAGE,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);

    Promise.resolve(promise).then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}
