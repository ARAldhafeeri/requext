// error-handling.test.ts
import { createErrorBoundary } from "../src/error";
import type { IContextNamespace, ContextData } from "../src/types/namespace";

describe("createErrorBoundary", () => {
  const mockContext: ContextData = { some: "context" };
  let mockNamespace: any;
  let mockErrorHandler: jest.Mock;

  beforeEach(() => {
    mockNamespace = { current: mockContext };
    mockErrorHandler = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the result when the wrapped function succeeds", async () => {
    const mockFn = jest.fn().mockResolvedValue("success");
    const errorBoundary = createErrorBoundary(mockNamespace, mockErrorHandler);
    await expect(errorBoundary(mockFn)).resolves.toBe("success");
    expect(mockErrorHandler).not.toHaveBeenCalled();
  });

  it("should call the error handler and rethrow when the wrapped function throws", async () => {
    const error = new Error("test error");
    const mockFn = jest.fn().mockRejectedValue(error);
    const errorBoundary = createErrorBoundary(mockNamespace, mockErrorHandler);

    await expect(errorBoundary(mockFn)).rejects.toThrow(error);
    expect(mockErrorHandler).toHaveBeenCalledWith(error, mockContext);
  });

  it("should not call the error handler if namespace.current is null", async () => {
    const error = new Error("test error");
    const mockFn = jest.fn().mockRejectedValue(error);
    const namespaceWithNull = { current: null };
    const errorBoundary = createErrorBoundary(
      namespaceWithNull as any,
      mockErrorHandler
    );

    await expect(errorBoundary(mockFn)).rejects.toThrow(error);
    expect(mockErrorHandler).not.toHaveBeenCalled();
  });

  it("should not call the error handler if namespace.current is undefined", async () => {
    const error = new Error("test error");
    const mockFn = jest.fn().mockRejectedValue(error);
    const namespaceUndefined: any = { current: undefined };
    const errorBoundary = createErrorBoundary(
      namespaceUndefined,
      mockErrorHandler
    );

    await expect(errorBoundary(mockFn)).rejects.toThrow(error);
    expect(mockErrorHandler).not.toHaveBeenCalled();
  });

  it("should handle synchronous errors", async () => {
    const error = new Error("sync error");
    const mockFn = jest.fn().mockImplementation(() => {
      throw error;
    });
    const errorBoundary = createErrorBoundary(mockNamespace, mockErrorHandler);

    await expect(errorBoundary(mockFn)).rejects.toThrow(error);
    expect(mockErrorHandler).toHaveBeenCalledWith(error, mockContext);
  });
});
