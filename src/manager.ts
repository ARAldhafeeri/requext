// contextManager.ts
import ContextNamespace from "./namespace";
import { ContextData, LifecycleHook } from "./types/namespace";
import { IContextManager } from "./types/manager";

/**
 * ContextManager is a registry of ContextNamespace instances.
 * It provides public APIs to interact with the async local storage contexts,
 * such as running functions within a context, adding hooks, and getting/setting data.
 */
class ContextManager implements IContextManager {
  private namespaces = new Map<string, ContextNamespace>();

  /**
   * Creates a new namespace with the given name and registers it.
   * @param name - Name of the namespace.
   * @returns The created ContextNamespace.
   */
  public createNamespace(name: string): ContextNamespace {
    const ns = new ContextNamespace(name);
    this.namespaces.set(name, ns);
    return ns;
  }

  /**
   * Retrieves an existing namespace by name.
   * @param name - Name of the namespace.
   * @returns The ContextNamespace if found, otherwise undefined.
   */
  public getNamespace(name: string): ContextNamespace | undefined {
    return this.namespaces.get(name);
  }

  /**
   * Runs a function within the context of the specified namespace.
   * Executes pre and post hooks (if defined) around the function execution.
   * @param namespaceName - Name of the namespace.
   * @param data - Partial context data to be used for the run.
   * @param fn - The function to execute within the context.
   * @returns A Promise that resolves to the function's return value.
   * @throws Error if the namespace does not exist.
   */
  public async run<R>(
    namespaceName: string,
    data: Partial<ContextData>,
    fn: () => R
  ): Promise<R> {
    const ns = this.getNamespace(namespaceName);
    if (!ns) {
      throw new Error(`Namespace '${namespaceName}' not found.`);
    }
    return ns.run(data, fn);
  }

  /**
   * Retrieves the current context data for the specified namespace.
   * @param namespaceName - Name of the namespace.
   * @returns The current context data or null if no context exists.
   * @throws Error if the namespace does not exist.
   */
  public getCurrent(namespaceName: string): ContextData | null {
    const ns = this.getNamespace(namespaceName);
    if (!ns) {
      throw new Error(`Namespace '${namespaceName}' not found.`);
    }
    return ns.current;
  }

  /**
   * Adds a lifecycle hook (pre or post) to the specified namespace.
   * @param namespaceName - Name of the namespace.
   * @param type - The type of hook: 'pre' or 'post'.
   * @param hook - The lifecycle hook function.
   * @throws Error if the namespace does not exist.
   */
  public addHook(
    namespaceName: string,
    type: "pre" | "post",
    hook: LifecycleHook
  ): void {
    const ns = this.getNamespace(namespaceName);
    if (!ns) {
      throw new Error(`Namespace '${namespaceName}' not found.`);
    }
    ns.addHook(type, hook);
  }

  /**
   * Retrieves a value from the context store by key for the specified namespace.
   * @param namespaceName - Name of the namespace.
   * @param key - The key whose value is to be retrieved.
   * @returns The value associated with the key or null if not found.
   * @throws Error if the namespace does not exist.
   */
  public get(namespaceName: string, key: string): string | null {
    const ns = this.getNamespace(namespaceName);
    if (!ns) {
      throw new Error(`Namespace '${namespaceName}' not found.`);
    }
    return ns.get(key);
  }

  /**
   * Sets a value in the context store by key for the specified namespace.
   * @param namespaceName - Name of the namespace.
   * @param key - The key to set.
   * @param value - The value to set.
   * @returns True if the value was set successfully, otherwise false.
   * @throws Error if the namespace does not exist.
   */
  public set(namespaceName: string, key: string, value: any): boolean {
    const ns = this.getNamespace(namespaceName);
    if (!ns) {
      throw new Error(`Namespace '${namespaceName}' not found.`);
    }
    return ns.set(key, value);
  }

  /**
   * Enters a context with the specified data for the given namespace.
   * @param namespaceName - Name of the namespace.
   * @param data - The data to enter into the context.
   * @returns A Promise that resolves once the context has been entered.
   * @throws Error if the namespace does not exist.
   */
  public async enterWith(namespaceName: string, data: any): Promise<void> {
    const ns = this.getNamespace(namespaceName);
    if (!ns) {
      throw new Error(`Namespace '${namespaceName}' not found.`);
    }
    return ns.enterWith(data);
  }

  /**
   * Exits the current context and runs a function outside of it for the specified namespace.
   * @param namespaceName - Name of the namespace.
   * @param fn - The function to run outside the context.
   * @returns A Promise that resolves once the function has been executed.
   * @throws Error if the namespace does not exist.
   */
  public async exit(namespaceName: string, fn: Function): Promise<void> {
    const ns = this.getNamespace(namespaceName);
    if (!ns) {
      throw new Error(`Namespace '${namespaceName}' not found.`);
    }
    return ns.exit(fn);
  }
}

export default ContextManager;
