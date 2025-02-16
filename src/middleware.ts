import ContextNamespace from "./namespace";
import { MiddlewareCreator } from "./types/middleware";

/**
 * Creates middleware to use with server-side nodejs framworks like expressjs
 * @param namespace context namespace
 * @returns
 */
const createMiddleware: MiddlewareCreator = (namespace: ContextNamespace) => {
  return (req: any, res: any, next: any) => {
    namespace.run({ req, res }, () => next());
  };
};

export default createMiddleware;
