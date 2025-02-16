// core.ts
import { AsyncLocalStorage } from "async_hooks";
import {
  ContextData,
  IContextNamespace,
  LifecycleHook,
} from "./types/namespace";

/**
 * ContextNamespace create async local storage namespace with rich apis
 */
class ContextNamespace implements IContextNamespace {
  private storage = new AsyncLocalStorage<ContextData>();
  public readonly preHooks = new Set<LifecycleHook>();
  public readonly postHooks = new Set<LifecycleHook>();

  // ContextNamespace constructor
  /**
   * Intialize the async local storage name space with a name.
   * @param  {[string]} name Name of the namespace to intialize and identify through the codebase.
   *
   */
  constructor(public readonly name: string) {}

  /**
   * Run the function with context with the added pre and post hooks.
   * @param  {[string]} data Extra data to run with the context
   */
  public run<R>(data: Partial<ContextData> = {}, fn: () => R): Promise<R> {
    return this.storage.run(data, async () => {
      await this.executeHooks(this.preHooks, data);
      try {
        return await fn();
      } finally {
        await this.executeHooks(this.postHooks, data);
      }
    });
  }

  /**
   * Get the current store for the namespace
   */
  public get current(): ContextData | null {
    return this.storage.getStore() || null;
  }

  /**
   * Add pre or post hook to the namespace
   * @param  {[string]} type Post or pre request type of hook
   * @param  {[LifecycleHook]} hook Async hook to run before or after.
   */
  public addHook(type: "pre" | "post", hook: LifecycleHook): void {
    const collection = type === "pre" ? this.preHooks : this.postHooks;
    collection.add(hook);
  }

  /**
   * Execute added hooks
   * @param  {[Set<LifecycleHook>]} hooks Hooks to be executed before or afer the request.
   * @param  {[LifecycleHook]} context Context to execute the hooks with
   */
  private async executeHooks(hooks: Set<LifecycleHook>, context: ContextData) {
    for (const hook of hooks) {
      await hook(context);
    }
  }

  /**
   * Get key from namespace
   * @param  {[string]} key String key to get data from namespace with
   */
  public get(key: string): string | null {
    const context = this.storage.getStore();
    if (!context) return null;
    return context[key];
  }

  /**
   * Set a key with specific value.
   * @param  {[string]} key String value to get data from namespace with.
   * @param  {[any]} value Value associated with the key.
   */
  public set(key: string, value: any): boolean {
    const context = this.storage.getStore();
    if (!context) return false;
    context[key] = value;
    return true;
  }

  /**
   * Replace given store with the given store object.
   * @param data - The data to replace the store with
   */
  async enterWith(data: any): Promise<void> {
    this.storage.enterWith(data);
  }

  /**
   * Runs a function synchronously outside of a context and returns its return value.
   * @param fn - Function to run within the exit store method
   */
  async exit(fn: Function): Promise<void> {
    this.storage.exit(() => fn());
  }
}

export default ContextNamespace;
