export type ContextData = Record<string | symbol, any>;
export type LifecycleHook = (context: ContextData) => void | Promise<void>;

export interface IContextNamespace {
  readonly name: string;
  run<R>(data: Partial<ContextData>, fn: () => R): Promise<R>;
  readonly current: ContextData | null;
  addHook(type: "pre" | "post", hook: LifecycleHook): void;
  get(key: string): string | null;
  set(key: string, value: any): boolean;
  enterWith(data: ContextData): Promise<void>;
  exit(fn: Function): Promise<void>;
}
