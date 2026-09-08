const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import { AmbientConstellations }')) {
  code = code.replace(
    "import { Camera, Mic, PenTool, LogOut, Orbit, Flower2 } from 'lucide-react';",
    "import { Camera, Mic, PenTool, LogOut, Orbit, Flower2 } from 'lucide-react';\nimport { AmbientConstellations } from './components/AmbientConstellations';"
  );
}

const oldConstellations = `{/* 1. Ambient Constellations */}
      {moodData.concepts.map((concept, i) => (
        <div key={i} className="ambient-constellation" style={{
          left: \`\${20 + (i * 25)}%\`,
          top: \`\${30 + ((i % 2) * 30)}%\`,
          animationDelay: \`\${i * 2}s\`
        }}>
          {concept}
        </div>
      ))}`;

const newConstellations = `{/* 1. Ambient Constellations */}
      <AmbientConstellations concepts={moodData.concepts} />`;

code = code.replace(oldConstellations, newConstellations);

fs.writeFileSync('src/App.tsx', code);
console.log("Extracted AmbientConstellations and updated App.tsx");
