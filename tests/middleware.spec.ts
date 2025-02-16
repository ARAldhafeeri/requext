import createMiddleware from "../src/middleware";

describe("createMiddleware middleware", () => {
  it("should call namespace.run with req and res, and then call next", () => {
    const req = { user: "test" };
    const res = { status: jest.fn() };
    const next = jest.fn();
    const run = jest.fn((context, callback) => {
      // Immediately call the callback to simulate synchronous behavior
      callback();
    });
    const namespace: any = { run };

    const middleware = createMiddleware(namespace);
    middleware(req, res, next);

    expect(run).toHaveBeenCalledWith({ req, res }, expect.any(Function));
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should not call next if namespace.run does not invoke the callback", () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    // Here, run does nothing (i.e. never calls the callback)
    const run = jest.fn();
    const namespace: any = { run };

    const middleware = createMiddleware(namespace);
    middleware(req, res, next);

    expect(run).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next asynchronously if namespace.run callback is executed asynchronously", (done) => {
    const req = {};
    const res = {};
    const next = jest.fn(() => {
      // This assertion ensures that next is called once the callback executes
      expect(next).toHaveBeenCalledTimes(1);
      done();
    });
    const run = jest.fn((context, callback) => {
      // Simulate asynchronous behavior with a timeout
      setTimeout(callback, 10);
    });
    const namespace: any = { run };

    const middleware = createMiddleware(namespace);
    middleware(req, res, next);
  });
});
