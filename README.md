# requext

Rich-API, user friendly, performant, modern request context for Nodejs server-side applications.

## Motivation

Existing libraries ethier pass context using weekmap or interfering with req objects or poor APIs around the async local storage.

This library is different, as I had the opprotunity to explore the async_hooks localstorage for a while, this library solve all of the problems I seen in the existing libraries in the nodejs eco-system as well provide extensive extra APIs around the core functaionlty of Asynchronous context tracking.

## Core features:

1. **Context Initialization**

- Created separate namespaces for request and session contexts
- Used middleware to initialize contexts for each request

1. **Error Handling**

- Global error boundary middleware for request processing
- Automatic error logging and error responses

1. **Context Access**

- Direct access to request and response objects in context
- Session management through separate namespace

1. **Lifecycle Hooks**

- Pre-request logging
- Post-request performance monitoring

1. **Asynchronous Operations**

- `contextTimeout` maintaining context
- `withContext` wrapper for async operations

1. **Namespace Isolation**

- Separate values in different namespaces using same key
- Independent context management for different concerns

1. **Advanced Operations**

- Manual context entry/exit
- Context-aware async operations

1. **Data Management**

- Storing timing information
- Sharing data across middleware and handlers

This example shows a complete implementation of:

- Request-scoped context
- Session management
- Error boundaries
- Async operation support
- Context-aware logging
- Performance monitoring
- Namespace isolation
- Lifecycle hooks

## Usage

```
npm i node-requext
```

## Examples

- All current examples with expressjs , theortically should work with other server-side nodejs frameworks.

```Javascript
const {
  ContextManager,
  createErrorBoundary,
  createMiddleware,
  withContext,
  contextTimeout,
  ContextDiagnostics,
  MemoryStats,
  ContextData,
  LifecycleHook,
} = require("requext");
const express = require("express");
const { memoryUsage } = require("process");

// Initialize context manager and namespaces
const manager = new ContextManager();
const requestNamespace = manager.createNamespace('request');
const sessionNamespace = manager.createNamespace('session');

const app = express();

// 1. Basic Context Middleware
app.use(createMiddleware(requestNamespace, { req: true, res: true }));

// 2. Error Boundary Middleware
app.use((req, res, next) => {
  const errorHandler = (error) => {
    console.error('Request failed:', error);
    res.status(500).json({ error: error.message });
  };

  // set requestnameSpace.set("something", "something")
  createErrorBoundary(requestNamespace, errorHandler);
  next();
});

// 3. Session Context Middleware
app.use(async (req, res, next) => {
  await sessionNamespace.run({ sessionId: generateSessionId() }, next);
});

// Route with context access
// response:
// {"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36","sessionId":"blp39f8im"}
app.get('/user', (req, res) => {
  // 4. Accessing context data
  const requestContext = manager.getCurrent('request');
  const sessionContext = manager.getCurrent('session');

  // 5. Modifying context
  requestNamespace.set('startTime', Date.now());

  res.json({
    userAgent: requestContext?.req.headers['user-agent'],
    sessionId: sessionContext?.sessionId
  });
});

// Route with async operations
app.get('/async-data', async (req, res) => {
  // 6. Context-aware timeout
  await contextTimeout(requestNamespace, 1000, () => {
    requestNamespace.set('asyncCompleted', true);
  });

  // 7. WithContext utility
  const fetchData = withContext(requestNamespace, async () => {
    const context = manager.getCurrent('request');
    return mockDatabaseQuery(context?.req);
  });

  const data = await fetchData();
  res.json(data);
});

async function contextFunc(){
  requestNamespace.set("I need something", "who's calling me ?")
}
app.get("/diagnose", async (req, res) => {
  await contextFunc();
  const {stop} = ContextDiagnostics.trackMemoryUsage(requestNamespace);
  res.json({
    depth: ContextDiagnostics.getContextDepth(requestNamespace),
    memory: ContextDiagnostics.stats
  })

  stop();

})

// 8. Lifecycle Hooks
requestNamespace.addHook('pre', async () => {
  console.log('Starting request');
});

requestNamespace.addHook('post', async () => {
  console.log(`Request completed`);
});

// 9. Namespace Isolation Example
app.get('/isolated', (req, res) => {
  requestNamespace.set('shared', 'request-value');
  sessionNamespace.set('shared', 'session-value');

  res.json({
    requestValue: requestNamespace.get('shared'),
    sessionValue: sessionNamespace.get('shared')
  });
});

// 10. Advanced Context Operations
app.get('/admin', async (req, res) => {
  // Enter temporary context
  await requestNamespace.enterWith({ admin: true });

  // Context-aware operations
  await requestNamespace.exit(async () => {
    console.log('Exited admin context');
  });

  res.send('Admin operations complete');
});

// Helper functions
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9);
}

async function mockDatabaseQuery(query) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { results: [], query };
}

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

```

## API Reference

This documentation provides the API reference for the context management utilities used for tracking context depth, memory usage, managing namespaces, and handling errors in an application.

---

## **Classes**

### **`ContextManager`**

A class that manages multiple namespaces. It allows for creating namespaces, adding hooks, running functions within a namespace, and getting/setting context data.

---

#### **Methods**

##### **`createNamespace(name: string): ContextNamespace`**

Creates and registers a new namespace.

- **Parameters**:
  - `name` (string): The name of the namespace.
- **Returns**: The created `ContextNamespace` instance.

##### **`getNamespace(name: string): ContextNamespace | undefined`**

Retrieves an existing namespace by name.

- **Parameters**:
  - `name` (string): The name of the namespace.
- **Returns**: The `ContextNamespace` instance or `undefined` if not found.

##### **`run<R>(namespaceName: string, data: Partial<ContextData>, fn: () => R): Promise<R>`**

Runs a function within the specified namespace's context.

- **Parameters**:
  - `namespaceName` (string): The name of the namespace.
  - `data` (Partial<ContextData>): Context data to be used in the execution.
  - `fn` (Function): The function to execute within the context.
- **Returns**: A Promise that resolves to the function's result.

##### **`getCurrent(namespaceName: string): ContextData | null`**

Retrieves the current context data for the specified namespace.

- **Parameters**:
  - `namespaceName` (string): The name of the namespace.
- **Returns**: The current context data or `null` if no context exists.

##### **`addHook(namespaceName: string, type: "pre" | "post", hook: LifecycleHook): void`**

Adds a lifecycle hook (pre or post) to the specified namespace.

- **Parameters**:
  - `namespaceName` (string): The name of the namespace.
  - `type` ("pre" | "post"): The type of hook to add.
  - `hook` (LifecycleHook): The hook function to add.

##### **`get(namespaceName: string, key: string): string | null`**

Retrieves a value from the context store for the specified key in a namespace.

- **Parameters**:
  - `namespaceName` (string): The name of the namespace.
  - `key` (string): The key of the context data.
- **Returns**: The value associated with the key or `null` if not found.

##### **`set(namespaceName: string, key: string, value: any): boolean`**

Sets a value in the context store for the specified key in a namespace.

- **Parameters**:
  - `namespaceName` (string): The name of the namespace.
  - `key` (string): The key to set.
  - `value` (any): The value to set.
- **Returns**: `true` if the value was set successfully, otherwise `false`.

##### **`enterWith(namespaceName: string, data: any): Promise<void>`**

Enters a context with the provided data for the specified namespace.

- **Parameters**:
  - `namespaceName` (string): The name of the namespace.
  - `data` (any): The data to enter into the context.
- **Returns**: A Promise that resolves when the context is entered.

##### **`exit(namespaceName: string, fn: Function): Promise<void>`**

Exits the current context and runs a function outside of it for the specified namespace.

- **Parameters**:
  - `namespaceName` (string): The name of the namespace.
  - `fn` (Function): The function to execute outside the context.
- **Returns**: A Promise that resolves after the function has been executed.

---

### **`ContextNamespace`**

Represents a single namespace for storing and running context-related data and operations.

#### **Methods**

##### **`run(data: Partial<ContextData>, fn: () => any): Promise<any>`**

Runs a function within the current context, passing the given data.

- **Parameters**:
  - `data` (Partial<ContextData>): Context data to use in the execution.
  - `fn` (Function): The function to run in the context.
- **Returns**: A Promise that resolves to the result of the function execution.

##### **`addHook(type: "pre" | "post", hook: LifecycleHook): void`**

Adds a lifecycle hook (pre or post) for the current namespace.

- **Parameters**:
  - `type` ("pre" | "post"): The type of hook to add.
  - `hook` (LifecycleHook): The hook function to execute.

##### **`get(key: string): string | null`**

Retrieves a value from the context store for the given key.

- **Parameters**:
  - `key` (string): The key of the context data.
- **Returns**: The value associated with the key or `null` if not found.

##### **`set(key: string, value: any): boolean`**

Sets a value in the context store for the specified key.

- **Parameters**:
  - `key` (string): The key to set.
  - `value` (any): The value to set.
- **Returns**: `true` if the value was set successfully, otherwise `false`.

##### **`enterWith(data: any): Promise<void>`**

Enters a context with the provided data.

- **Parameters**:
  - `data` (any): The data to enter into the context.
- **Returns**: A Promise that resolves once the context has been entered.

##### **`exit(fn: Function): Promise<void>`**

Exits the current context and runs a function outside of it.

- **Parameters**:
  - `fn` (Function): The function to execute outside the context.
- **Returns**: A Promise that resolves once the function has been executed.

---

### **`ContextDiagnostics`**

A class providing utilities for diagnosing the usage of context within applications.

---

#### **Methods**

##### **`getContextDepth(namespace: ContextNamespace): number`**

Returns the depth of the context within the request handling.

- **Parameters**:
  - `namespace` (ContextNamespace): The namespace to be diagnosed.
- **Returns**: The depth of the context.

##### **`trackMemoryUsage(namespace: ContextNamespace): MemoryUsageTracking`**

Tracks memory usage for a specific namespace.

- **Parameters**:
  - `namespace` (ContextNamespace): The namespace for which to track memory usage.
- **Returns**: An object with memory tracking stats and a method to stop tracking.

#### **`MemoryUsageTracking` Interface**

- **`stats`**:
  - `peakMemory` (number): The peak memory usage.
  - `currentMemory` (number): The current memory usage.
- **`stop`**: A function to stop memory tracking.

---

## **Functions**

### **`createMiddleware(namespace: ContextNamespace)`**

Creates middleware to be used with server-side frameworks (like ExpressJS) for handling context.

- **Parameters**:
  - `namespace` (ContextNamespace): The namespace to be used in the middleware.
- **Returns**: A middleware function that integrates with the ExpressJS request handling cycle.

---

### **`createErrorBoundary(namespace: ContextNamespace, errorHandler: (error: Error, context: ContextData) => void)`**

Creates an error boundary for the context and handles errors using the provided error handler function.

- **Parameters**:
  - `namespace` (ContextNamespace): The namespace to create the context error boundary for.
  - `errorHandler` ((error: Error, context: ContextData) => void): An asynchronous function to handle errors thrown in the context.
- **Returns**: A higher-order function that executes a function within the error boundary.

---

### **`withContext<R extends (...args: any[]) => any>(namespace: ContextNamespace, fn: R): (...args: Parameters<R>) => any`**

A higher-order function that wraps a function to run it within the context of the specified namespace.

- **Parameters**:
  - `namespace` (ContextNamespace): The namespace in which the function will run.
  - `fn` (R): The function to wrap.
- **Returns**: A function that runs the original function within the namespace context.

---

### **`contextTimeout(namespace: ContextNamespace, ms: number, handler?: () => void)`**

Runs a function after a specified timeout, preserving the namespace context.

- **Parameters**:
  - `namespace` (ContextNamespace): The namespace to use for the context.
  - `ms` (number): The timeout duration in milliseconds.
  - `handler` (() => void): Optional callback to execute after the timeout.
- **Returns**: A Promise that resolves after the timeout and callback execution.
