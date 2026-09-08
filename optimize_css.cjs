const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/0\.8s forwards/g, '0.25s forwards');
css = css.replace(/1s forwards/g, '0.25s forwards');
css = css.replace(/0\.7s ease/g, '0.15s ease');
css = css.replace(/2s ease-in-out/g, '0.3s ease-in-out');

fs.writeFileSync('src/index.css', css);
console.log("Optimized CSS durations to sub-300ms");
