const fs = require('fs');

const content = `import React from 'react';

interface AmbientConstellationsProps {
  concepts: string[];
}

export const AmbientConstellations: React.FC<AmbientConstellationsProps> = ({ concepts }) => {
  if (!concepts || concepts.length === 0) return null;

  return (
    <>
      {concepts.map((concept, i) => (
        <div 
          key={i} 
          className="ambient-constellation pointer-events-none" 
          style={{
            left: \`\${10 + (i * 25)}%\`,
            top: \`\${20 + ((i % 3) * 25)}%\`,
            animationDelay: \`\${i * 1.5}s\`
          }}
        >
          {concept}
        </div>
      ))}
    </>
  );
};
`;

fs.writeFileSync('src/components/AmbientConstellations.tsx', content);
console.log("Fixed AmbientConstellations.tsx syntax");
