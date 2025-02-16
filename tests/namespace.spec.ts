// core.test.ts
import ContextNamespace from "../src/namespace";
import { AsyncLocalStorage } from "async_hooks";

describe("ContextNamespace", () => {
  describe("constructor", () => {
    it("initializes with the given name", () => {
      const ns = new ContextNamespace("test-namespace");
      expect(ns.name).toBe("test-namespace");
    });
  });

  describe("run()", () => {
    it("executes function within context", async () => {
      const ns = new ContextNamespace("test");
      const result = await ns.run({ foo: "bar" }, () => ns.current);
      expect(result).toEqual({ foo: "bar" });
    });

    it("executes pre and post hooks in correct order", async () => {
      const ns = new ContextNamespace("test");
      const order: string[] = [];

      ns.addHook("pre", async () => {
        order.push("pre-hook");
      });
      ns.addHook("post", async () => {
        order.push("post-hook");
      });

      await ns.run({}, async () => order.push("main-execution"));

      expect(order).toEqual(["pre-hook", "main-execution", "post-hook"]);
    });

    it("runs post hooks when main function throws", async () => {
      const ns = new ContextNamespace("test");
      const postHook = jest.fn();
      ns.addHook("post", postHook);

      await expect(
        ns.run({}, () => {
          throw new Error("Boom");
        })
      ).rejects.toThrow("Boom");

      expect(postHook).toHaveBeenCalled();
    });

    it("propagates context through async operations", async () => {
      const ns = new ContextNamespace("test");
      let asyncContext: any;

      await ns.run({ userId: 123 }, async () => {
        setTimeout(() => {
          asyncContext = ns.current;
        }, 10);
      });

      // Wait for setTimeout to complete
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(asyncContext).toEqual({ userId: 123 });
    });
  });

  describe("current", () => {
    it("returns null when outside context", () => {
      const ns = new ContextNamespace("test");
      expect(ns.current).toBeNull();
    });
  });

  describe("get() and set()", () => {
    it("manages context data", async () => {
      const ns = new ContextNamespace("test");

      await ns.run({ initial: "data" }, () => {
        ns.set("key", "value");
        expect(ns.get("key")).toBe("value");
        expect(ns.current).toEqual({ initial: "data", key: "value" });
      });
    });

    it("returns null for get and false for set outside context", () => {
      const ns = new ContextNamespace("test");
      expect(ns.get("key")).toBeNull();
      expect(ns.set("key", "value")).toBe(false);
    });
  });

  describe("hooks", () => {
    it("adds hooks to correct collections", () => {
      const ns = new ContextNamespace("test");
      const preHook = jest.fn();
      const postHook = jest.fn();

      ns.addHook("pre", preHook);
      ns.addHook("post", postHook);

      expect(ns.preHooks.has(preHook)).toBe(true);
      expect(ns.postHooks.has(postHook)).toBe(true);
    });

    it("executes async hooks sequentially", async () => {
      const ns = new ContextNamespace("test");
      const order: number[] = [];

      ns.addHook("pre", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push(1);
      });

      ns.addHook("pre", async () => {
        order.push(2);
      });

      await ns.run({}, () => order.push(3));

      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe("enterWith()", () => {
    it("sets context for subsequent operations", async () => {
      const ns = new ContextNamespace("test");
      const data = { custom: "context" };

      await ns.enterWith(data);
      expect(ns.current).toEqual(data);
    });
  });

  describe("exit()", () => {
    it("executes callback outside context", async () => {
      const ns = new ContextNamespace("test");
      let contextDuringExit: any;

      await ns.run({ inside: true }, async () => {
        await ns.exit(() => {
          contextDuringExit = ns.current;
        });
      });

      expect(contextDuringExit).toBeNull();
    });
  });
});
