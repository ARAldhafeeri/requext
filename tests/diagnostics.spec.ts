import { ContextDiagnostics } from "../src/diagnostics";
import ContextNamespace from "../src/namespace";

describe("ContextDiagnostics", () => {
  let mockNamespace: any;
  let mockContext: any;

  beforeEach(() => {
    mockContext = { parentContext: null };
    mockNamespace = { current: mockContext };
  });

  describe("getContextDepth", () => {
    it("should return 0 for a single context with no parent", () => {
      const depth = ContextDiagnostics.getContextDepth(mockNamespace);
      expect(depth).toBe(0);
    });

    it("should return correct depth for a context with multiple parents", () => {
      const parentContext = { parentContext: null };
      mockContext.parentContext = parentContext;
      const depth = ContextDiagnostics.getContextDepth(mockNamespace);
      expect(depth).toBe(1);
    });

    it("should return correct depth when there are nested parent contexts", () => {
      const grandParentContext = { parentContext: null };
      const parentContext = { parentContext: grandParentContext };
      mockContext.parentContext = parentContext;
      const depth = ContextDiagnostics.getContextDepth(mockNamespace);
      expect(depth).toBe(2);
    });
  });

  describe("trackMemoryUsage", () => {
    let stopMemoryTracking: any;

    beforeAll(() => {
      jest
        .spyOn(global.process, "memoryUsage")
        .mockReturnValue({ heapTotal: 1024 } as any); // jest heapTotal
    });

    afterEach(() => {
      if (stopMemoryTracking) {
        stopMemoryTracking();
      }
    });

    it("should track memory usage", async () => {
      const { stop } = ContextDiagnostics.trackMemoryUsage(mockNamespace);

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      await delay(100);
      expect(ContextDiagnostics.stats.heapTotal).toBeGreaterThan(0);

      stopMemoryTracking = stop;
      stop();
    });

    it("should stop tracking memory usage when stop is called", () => {
      const { stop } = ContextDiagnostics.trackMemoryUsage(mockNamespace);

      stop();
      jest.clearAllMocks();
    });
  });
});
