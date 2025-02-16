import ContextNamespace from "./namespace";
import process from "process";
import { MemoryStats } from "./types/diagnostic";
/**
 * ContextDiagnostics utilities for diagnosing the usage of context within apps.
 */
export class ContextDiagnostics {
  // memory stats
  static stats: MemoryStats;
  /**
   * Return the context depth within the request handling.
   * @param namespace Name space to be diagnosed.
   * @returns
   */
  static getContextDepth(namespace: ContextNamespace): number {
    let depth = 0;
    let current = namespace.current;
    while (current?.parentContext) {
      depth++;
      current = current.parentContext;
    }
    return depth;
  }

  /**
   * Tracks memory usage of context update stats every 100 ms until stoped.
   * use it to track the context across multiple layer of abstraction
   * start at the top and then go to bottom.
   * @param namespace Namespace to track the memory usage of.
   * @returns
   */
  static trackMemoryUsage(namespace: ContextNamespace) {
    const interval = setInterval(() => {
      if (namespace.current) {
        const memory = process.memoryUsage();
        this.stats = memory;
      }
    }, 100);

    return {
      stop: () => {
        clearInterval(interval);
        this.stats = {
          rss: 0,
          heapTotal: 0,
          heapUsed: 0,
          external: 0,
          arrayBuffers: 0,
        };
      },
    };
  }
}
