const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const bgTarget = `    <div className="atmospheric-bg" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: \`radial-gradient(circle at top left, \${moodData.colors[2] || '#1a362d'} 0%, \${moodData.colors[0] || '#1a1a1a'} 100%)\`, fontFamily: 'serif' }}>`;

const newBgTarget = `    <div className="atmospheric-bg" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'serif',
      '--color-1': moodData.colors[2] || '#1a362d',
      '--color-2': moodData.colors[0] || '#1a1a1a',
      background: 'radial-gradient(circle at top left, var(--color-1) 0%, var(--color-2) 100%)'
    } as any}>`;

if (code.includes('className="atmospheric-bg"')) {
  code = code.replace(bgTarget, newBgTarget);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated App.tsx to use CSS vars for background transition");
}

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(
  '.atmospheric-bg {\n  transition: background 1.5s ease-in-out, background-color 1.5s ease-in-out;\n}',
  `@property --color-1 {
  syntax: '<color>';
  initial-value: #1a362d;
  inherits: false;
}
@property --color-2 {
  syntax: '<color>';
  initial-value: #1a1a1a;
  inherits: false;
}
.atmospheric-bg {
  transition: --color-1 2s ease-in-out, --color-2 2s ease-in-out;
}`
);
fs.writeFileSync('src/index.css', css);
