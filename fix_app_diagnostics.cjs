const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldErrorHandling = `      if (!response.ok) {
        const errorText = await response.text();
        alert(errorText);
        return;
      }`;

const newErrorHandling = `      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch (e) {
          // It's raw text/html
        }
        throw new Error(\`Server Error (\${response.status}): \${errorMessage}\`);
      }`;

code = code.replace(oldErrorHandling, newErrorHandling);

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx error handling added");
