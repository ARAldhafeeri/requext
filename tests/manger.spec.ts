import ContextManager from "../src/manager";
import ContextNamespace from "../src/namespace";

jest.mock("@/namespace");

describe("ContextManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createNamespace", () => {
    it("creates and registers a new namespace", () => {
      const manager = new ContextManager();
      const namespace = manager.createNamespace("test");

      expect(ContextNamespace).toHaveBeenCalledWith("test");
      expect(manager.getNamespace("test")).toBe(namespace);
    });
  });

  describe("getNamespace", () => {
    it("returns undefined for non-existent namespace", () => {
      const manager = new ContextManager();
      expect(manager.getNamespace("test")).toBeUndefined();
    });

    it("returns the namespace when it exists", () => {
      const manager = new ContextManager();
      const namespace = manager.createNamespace("test");
      expect(manager.getNamespace("test")).toBe(namespace);
    });
  });

  describe("run", () => {
    it("throws an error if namespace does not exist", async () => {
      const manager = new ContextManager();
      await expect(manager.run("test", {}, () => {})).rejects.toThrow(
        "Namespace 'test' not found."
      );
    });

    it("executes the function within the namespace context", async () => {
      const manager = new ContextManager();
      manager.createNamespace("test");
      const mockNamespace = (ContextNamespace as jest.Mock).mock.instances[0];
      const mockRun = mockNamespace.run;
      mockRun.mockResolvedValue("result");

      const data = { key: "value" };
      const fn = jest.fn();
      await manager.run("test", data, fn);

      expect(mockRun).toHaveBeenCalledWith(data, fn);
    });
  });

  describe("getCurrent", () => {
    it("throws an error if namespace does not exist", () => {
      const manager = new ContextManager();
      expect(() => manager.getCurrent("test")).toThrow(
        "Namespace 'test' not found."
      );
    });

    it("returns current context data of the namespace", () => {
      const manager = new ContextManager();
      manager.createNamespace("test");
      const mockNamespace = (ContextNamespace as jest.Mock).mock.instances[0];
      const mockData = { data: "test" };
      mockNamespace.current = mockData;

      expect(manager.getCurrent("test")).toEqual(mockData);
    });
  });

  describe("addHook", () => {
    it("throws an error if namespace does not exist", () => {
      const manager = new ContextManager();
      expect(() => manager.addHook("test", "pre", jest.fn())).toThrow(
        "Namespace 'test' not found."
      );
    });

    it("adds a lifecycle hook to the namespace", () => {
      const manager = new ContextManager();
      manager.createNamespace("test");
      const mockNamespace = (ContextNamespace as jest.Mock).mock.instances[0];
      const hook = jest.fn();

      manager.addHook("test", "post", hook);
      expect(mockNamespace.addHook).toHaveBeenCalledWith("post", hook);
    });
  });

  describe("get", () => {
    it("throws an error if namespace does not exist", () => {
      const manager = new ContextManager();
      expect(() => manager.get("test", "key")).toThrow(
        "Namespace 'test' not found."
      );
    });

    it("retrieves a value from the namespace context", () => {
      const manager = new ContextManager();
      manager.createNamespace("test");
      const mockNamespace = (ContextNamespace as jest.Mock).mock.instances[0];
      mockNamespace.get.mockReturnValue("test-value");

      expect(manager.get("test", "key")).toBe("test-value");
      expect(mockNamespace.get).toHaveBeenCalledWith("key");
    });
  });

  describe("set", () => {
    it("throws an error if namespace does not exist", () => {
      const manager = new ContextManager();
      expect(() => manager.set("test", "key", "value")).toThrow(
        "Namespace 'test' not found."
      );
    });

    it("sets a value in the namespace context", () => {
      const manager = new ContextManager();
      manager.createNamespace("test");
      const mockNamespace = (ContextNamespace as jest.Mock).mock.instances[0];
      mockNamespace.set.mockReturnValue(true);

      expect(manager.set("test", "key", "value")).toBe(true);
      expect(mockNamespace.set).toHaveBeenCalledWith("key", "value");
    });
  });

  describe("enterWith", () => {
    it("throws an error if namespace does not exist", async () => {
      const manager = new ContextManager();
      await expect(manager.enterWith("test", {})).rejects.toThrow(
        "Namespace 'test' not found."
      );
    });

    it("enters the namespace context with data", async () => {
      const manager = new ContextManager();
      manager.createNamespace("test");
      const mockNamespace = (ContextNamespace as jest.Mock).mock.instances[0];
      mockNamespace.enterWith.mockResolvedValue(undefined);

      const data = { key: "value" };
      await manager.enterWith("test", data);

      expect(mockNamespace.enterWith).toHaveBeenCalledWith(data);
    });
  });

  describe("exit", () => {
    it("throws an error if namespace does not exist", async () => {
      const manager = new ContextManager();
      await expect(manager.exit("test", jest.fn())).rejects.toThrow(
        "Namespace 'test' not found."
      );
    });

    it("exits the namespace context and runs a function", async () => {
      const manager = new ContextManager();
      manager.createNamespace("test");
      const mockNamespace = (ContextNamespace as jest.Mock).mock.instances[0];
      mockNamespace.exit.mockResolvedValue(undefined);

      const fn = jest.fn();
      await manager.exit("test", fn);

      expect(mockNamespace.exit).toHaveBeenCalledWith(fn);
    });
  });
});
