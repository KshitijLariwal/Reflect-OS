const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update firebase-admin/app import
code = code.replace(
  "import { initializeApp } from 'firebase-admin/app';",
  "import { initializeApp, getApps, getApp } from 'firebase-admin/app';"
);

// Add health check route before verifyAuth
const healthRoute = `
app.get('/api/health', (req, res) => {
  try {
    const firebaseStatus = getApps().length > 0 ? "Initialized" : "NOT Initialized";
    const projectId = getApps().length > 0 ? getApp().options.projectId : "Unknown";
    const geminiKey = process.env.GEMINI_API_KEY ? "Present" : "Missing";
    
    res.status(200).json({
      status: "Server is running",
      firebase: firebaseStatus,
      projectId: projectId,
      geminiKey: geminiKey,
      env: process.env.NODE_ENV
    });
  } catch (error: any) {
    res.status(500).send(\`Health Check Failed: \${error.message}\`);
  }
});

// verifyAuth middleware`;

code = code.replace("// verifyAuth middleware", healthRoute);

// Add global error handler before app.listen
const globalErrorHandler = `
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Server Error:", err);
    res.status(500).json({ 
      error: "Fatal Server Error", 
      message: err.message || err.toString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  app.listen(PORT`;

code = code.replace("  app.listen(PORT", globalErrorHandler);

fs.writeFileSync('server.ts', code);
console.log("server.ts diagnostics added");
