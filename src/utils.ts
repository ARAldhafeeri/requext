import ContextNamespace from "./namespace";

/**
 * Wraps a function in the provided context namespace and ensures it runs within that context.
 * @param namespace - The context namespace.
 * @param fn - The function to run within the context.
 * @returns A new function that will run in the specified context when invoked.
 */
export function withContext<R extends (...args: any[]) => any>(
  namespace: ContextNamespace,
  fn: R
): (...args: Parameters<R>) => ReturnType<R> {
  return (...args: Parameters<R>): ReturnType<R> => {
    return namespace.run({}, () => fn(...args)) as ReturnType<R>;
  };
}

/**
 * Creates a timeout that runs a handler in the context of the provided namespace.
 * @param namespace - The context namespace.
 * @param ms - The timeout duration in milliseconds.
 * @param handler - An optional handler to execute when the timeout expires.
 * @returns A promise that resolves after the handler is executed in the context.
 */
export function contextTimeout(
  namespace: ContextNamespace,
  ms: number,
  handler?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    const originalContext = namespace.current;
    if (!originalContext) return;
    const timer = setTimeout(() => {
      namespace.run(originalContext, () => {
        handler?.();
        resolve();
      });
    }, ms);

    // Optional cleanup for the timer if needed in the future.
    return () => clearTimeout(timer);
  });
}
