import request from "supertest";
import express from "express";
import ContextManager from "../src/manager";
import ContextNamespace from "../src/namespace";
import createMiddleware from "../src/middleware";
import { createErrorBoundary } from "../src/error";
import { contextTimeout } from "../src/utils";

describe("Express Integration Tests", () => {
  let manager: ContextManager;
  let requestNamespace: ContextNamespace;

  beforeEach(() => {
    manager = new ContextManager();
    requestNamespace = manager.createNamespace("request");
  });

  it("should establish context in route handlers", async () => {
    const app = express();
    app.use(createMiddleware(requestNamespace));

    app.get("/", (req, res) => {
      const context = manager.getCurrent("request");
      res.json({ exists: !!context });
    });

    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.exists).toBe(true);
  });

  it("should maintain context in async operations", async () => {
    const app = express();
    app.use(createMiddleware(requestNamespace));

    app.get("/async", (req, res) => {
      requestNamespace.set("key", "value");
      contextTimeout(requestNamespace, 10, () => {
        const value = requestNamespace.get("key");
        res.json({ value });
      });
    });

    const response = await request(app).get("/async");
    expect(response.body.value).toBe("value");
  });

  it("should execute lifecycle hooks in order", async () => {
    const app = express();
    app.use(createMiddleware(requestNamespace));
    const executionOrder: string[] = [];

    requestNamespace.addHook("pre", async () => {
      executionOrder.push("pre-hook");
    });
    requestNamespace.addHook("post", async () => {
      executionOrder.push("post-hook");
    });

    app.get("/hooks", (req, res) => {
      executionOrder.push("handler");
      res.sendStatus(200);
    });

    await request(app).get("/hooks");
    expect(executionOrder).toEqual(["pre-hook", "handler", "post-hook"]);
  });

  it("should isolate different context namespaces", async () => {
    const otherNamespace = manager.createNamespace("other");
    const app = express();

    // Apply both namespaces' middleware
    app.use(createMiddleware(requestNamespace));
    app.use(createMiddleware(otherNamespace));

    app.get("/isolate", (req, res) => {
      requestNamespace.set("shared", "request-value");
      otherNamespace.set("shared", "other-value");

      res.json({
        requestVal: requestNamespace.get("shared"),
        otherVal: otherNamespace.get("shared"),
      });
    });

    const response = await request(app).get("/isolate");
    expect(response.body).toEqual({
      requestVal: "request-value",
      otherVal: "other-value",
    });
  });
});
