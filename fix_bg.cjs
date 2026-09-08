const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldOuter = `    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', fontFamily: 'serif' }}>`;
const newOuter = `    <div className="atmospheric-bg" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: \`radial-gradient(circle at top left, \${moodData.colors[2] || '#1a362d'} 0%, \${moodData.colors[0] || '#1a1a1a'} 100%)\`, fontFamily: 'serif' }}>
      
      {/* 1. Ambient Constellations */}
      {moodData.concepts.map((concept, i) => (
        <div key={i} className="ambient-constellation" style={{
          left: \`\${20 + (i * 25)}%\`,
          top: \`\${30 + ((i % 2) * 30)}%\`,
          animationDelay: \`\${i * 2}s\`
        }}>
          {concept}
        </div>
      ))}`;

code = code.replace(oldOuter, newOuter);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated background and added ambient constellations");
