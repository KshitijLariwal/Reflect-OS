const fs = require('fs');
let lines = fs.readFileSync('server.ts', 'utf8').split('\n');
// We want to delete lines 85 through 224 (0-indexed 84 through 223)
lines.splice(84, 224 - 84 + 1);
fs.writeFileSync('server.ts', lines.join('\n'));
console.log("Removed duplicate routes");
