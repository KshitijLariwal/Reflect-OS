const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const omitStartIndex = code.indexOf("app.patch('/api/journal/entries/:id/omit'");
const omitEndIndex = code.indexOf("app.post('/api/vision/scan'", omitStartIndex);

if (omitStartIndex !== -1 && omitEndIndex !== -1) {
  code = code.substring(0, omitStartIndex) + code.substring(omitEndIndex);
}

const delStartIndex = code.indexOf("app.delete('/api/journal/entries/:id'");
const delEndIndex = code.indexOf("app.listen(PORT", delStartIndex);

if (delStartIndex !== -1 && delEndIndex !== -1) {
  code = code.substring(0, delStartIndex) + code.substring(delEndIndex);
}

fs.writeFileSync('server.ts', code);
console.log("Removed dead routes from server.ts");
