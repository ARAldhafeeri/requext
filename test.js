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