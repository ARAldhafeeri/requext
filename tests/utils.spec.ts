import { withContext, contextTimeout } from "../src/utils"; // adjust the import path as needed

describe("withContext", () => {
  it("should wrap a function and run it within the namespace context", () => {
    const fn = jest.fn().mockReturnValue("result");
    const run = jest.fn((context, callback) => callback());
    // current is not used in withContext but is defined on the namespace
    const namespace: any = { run, current: {} };
    const wrappedFn = withContext(namespace, fn);
    const result = wrappedFn(1, 2, 3);
    expect(run).toHaveBeenCalledWith({}, expect.any(Function));
    expect(fn).toHaveBeenCalledWith(1, 2, 3);
    expect(result).toBe("result");
  });
});

describe("contextTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should execute handler in context after timeout", async () => {
    const originalContext = { some: "context" };
    const run = jest.fn((ctx, callback) => callback());
    const namespace: any = { current: originalContext, run };
    const handler = jest.fn();

    const promise = contextTimeout(namespace, 1000, handler);

    // Before advancing timers, nothing should have been called.
    expect(run).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    await promise;
    expect(run).toHaveBeenCalledWith(originalContext, expect.any(Function));
    expect(handler).toHaveBeenCalled();
  });

  it("should resolve promise even if handler is not provided", async () => {
    const originalContext = { some: "context" };
    const run = jest.fn((ctx, callback) => callback());
    const namespace: any = { current: originalContext, run };
    const promise = contextTimeout(namespace, 500);
    jest.advanceTimersByTime(500);
    await promise;

    expect(run).toHaveBeenCalledWith(originalContext, expect.any(Function));
  });

  it("should not schedule timeout if no original context is available", () => {
    const run = jest.fn();
    const handler = jest.fn();
    const namespace: any = { current: null, run };

    const promise = contextTimeout(namespace, 1000, handler);
    jest.advanceTimersByTime(1000);

    expect(run).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    // Note: In this case the returned promise remains pending.
    // We do not await it to avoid hanging the test.
  });
});
