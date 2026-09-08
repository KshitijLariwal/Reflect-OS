const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `className="bg-white/40 rounded-xl p-5 border border-[#143026]/5 shadow-sm hover:shadow-md hover:bg-white/60 transition-all cursor-pointer relative group"`,
  `className={\`bg-white/40 rounded-xl p-5 border border-[#143026]/5 shadow-sm hover:shadow-md hover:bg-white/60 transition-all cursor-pointer relative group \${deletingIds.includes(entry.id) ? 'burn-to-ash' : ''}\`}`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated archive items class");
