// error-handling.ts
import ContextNamespace from "./namespace";
import { ContextData } from "./types/namespace";

/**
 * Create error boundary for the context and handle it with a function
 * @param namespace Namespace to create context error boundary for
 * @param errorHandler Async Function error hanlder to use when error is thrown
 * @returns
 */
export function createErrorBoundary<T extends (...args: any[]) => any>(
  namespace: ContextNamespace,
  errorHandler: (error: Error, context: ContextData) => void
): (fn: T) => Promise<ReturnType<T>> {
  return async function errorBoundary<T extends (...args: any[]) => any>(
    fn: T
  ) {
    try {
      return await fn();
    } catch (error) {
      if (namespace.current) {
        errorHandler(error as Error, namespace.current);
      }
      throw error;
    }
  };
}
