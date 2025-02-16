import { IContextNamespace } from "./namespace";

export interface MemoryStats {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

interface MemoryUsageTracking {
  stats: MemoryStats;
  stop: () => void;
}

interface ContextDiagnosticsInterface {
  /**
   * Returns the context depth within the request handling.
   * @param namespace - The namespace to be diagnosed.
   * @returns The depth of the current context.
   */
  getContextDepth(namespace: IContextNamespace): number;

  /**
   * Tracks memory usage of the current context in the given namespace.
   * @param namespace - The namespace to track memory usage for.
   * @returns An object with stats and a `stop` function to halt memory tracking.
   */
  trackMemoryUsage(namespace: IContextNamespace): MemoryUsageTracking;
}

export default ContextDiagnosticsInterface;
