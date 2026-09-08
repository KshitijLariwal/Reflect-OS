const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/animation: burnToAsh [^ ]+ forwards/, 'animation: burnToAsh 0.8s forwards');
css = css.replace(/animation: inkBleed [^ ]+ forwards/, 'animation: inkBleed 1.0s forwards');
fs.writeFileSync('src/index.css', css);

let code = fs.readFileSync('src/App.tsx', 'utf8');

// The first }, 250); belongs to deleteEntry
code = code.replace(/void deleteDoc\(docRef\)\.catch\(err => console\.error\('Background delete failed', err\)\);\n    \}, 250\);/,
                    `void deleteDoc(docRef).catch(err => console.error('Background delete failed', err));\n    }, 800);`);

// The second }, 250); belongs to removeMessage
code = code.replace(/\}\)\(\);\n    \}, 250\);\n  \};/,
                    `})();\n    }, 1000);\n  };`);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated timings in CSS and React");
