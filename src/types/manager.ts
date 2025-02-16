// types/contextManager.ts
import { ContextData, LifecycleHook } from "./namespace";
import ContextNamespace from "../namespace";

export interface IContextManager {
  createNamespace(name: string): ContextNamespace;
  getNamespace(name: string): ContextNamespace | undefined;
  run<R>(
    namespaceName: string,
    data: Partial<ContextData>,
    fn: () => R
  ): Promise<R>;
  getCurrent(namespaceName: string): ContextData | null;
  addHook(
    namespaceName: string,
    type: "pre" | "post",
    hook: LifecycleHook
  ): void;
  get(namespaceName: string, key: string): string | null;
  set(namespaceName: string, key: string, value: any): boolean;
  enterWith(namespaceName: string, data: ContextData): Promise<void>;
  exit(namespaceName: string, fn: Function): Promise<void>;
}
