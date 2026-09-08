const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const testRoute = `
app.get('/api/test-db', async (req, res) => {
  try {
    const testDoc = getFirestore().collection('system_tests').doc('connection_check');
    await testDoc.set({ 
      timestamp: FieldValue.serverTimestamp(),
      status: 'success' 
    });
    
    res.status(200).json({ message: "FIRESTORE WRITE SUCCESSFUL. The bug is in Auth." });
  } catch (error: any) {
    console.error("Firestore Test Error:", error);
    res.status(500).json({ 
      message: "FIRESTORE WRITE FAILED. The database might not exist.",
      error: error.message 
    });
  }
});
`;

code = code.replace("// verifyAuth middleware", testRoute + "\n// verifyAuth middleware");

fs.writeFileSync('server.ts', code);
console.log("Test route added");
