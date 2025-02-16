import ContextNamespace from "@/namespace";

export type MiddlewareCreator = (namespace: ContextNamespace) => any;
