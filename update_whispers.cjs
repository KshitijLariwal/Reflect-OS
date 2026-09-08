const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state variable and useEffect
const stateTarget = "const [burningMessages, setBurningMessages] = useState<number[]>([]);";
const stateReplacement = `const [burningMessages, setBurningMessages] = useState<number[]>([]);
  const [isWhispersActive, setIsWhispersActive] = useState(() => {
    const saved = localStorage.getItem('reflectos_whispers_v2_enabled');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('reflectos_whispers_v2_enabled', String(isWhispersActive));
  }, [isWhispersActive]);`;
code = code.replace(stateTarget, stateReplacement);

// 2. Update background and AmbientConstellations
const bgTarget = `    <div className="atmospheric-bg" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'serif',
      '--color-1': moodData.colors[2] || '#1a362d',
      '--color-2': moodData.colors[0] || '#1a1a1a',
      background: 'radial-gradient(circle at top left, var(--color-1) 0%, var(--color-2) 100%)'
    } as any}>
      
      {/* 1. Ambient Constellations */}
      <AmbientConstellations concepts={moodData.concepts} />`;

const bgReplacement = `    <div className="atmospheric-bg" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'serif',
      '--color-1': isWhispersActive ? (moodData.colors[2] || '#1a362d') : '#e8ddcb',
      '--color-2': isWhispersActive ? (moodData.colors[0] || '#1a1a1a') : '#dfd6c2',
      background: 'radial-gradient(circle at top left, var(--color-1) 0%, var(--color-2) 100%)'
    } as any}>
      
      {/* 1. Ambient Constellations */}
      {isWhispersActive && <AmbientConstellations concepts={moodData.concepts} />}`;
code = code.replace(bgTarget, bgReplacement);

// 3. Update the button
const buttonTarget = `<button 
                    className="w-full text-left px-4 py-3 text-sm font-serif text-[#143026]/50 hover:bg-white/30 transition-colors"
                    disabled
                  >
                    Visual Whispers (v2)
                  </button>`;
const buttonReplacement = `<button 
                    className={\`w-full text-left px-4 py-3 text-sm font-serif transition-colors \${isWhispersActive ? 'text-emerald-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}\`}
                    onClick={() => setIsWhispersActive(!isWhispersActive)}
                  >
                    Visual Whispers (v2) {isWhispersActive && '✓'}
                  </button>`;
code = code.replace(buttonTarget, buttonReplacement);

// 4. Conditional Mood Landscape Header
const landscapeTarget = `<div className="absolute -top-10 -left-10 w-48 h-48 rounded-[40%_60%_70%_30%] mix-blend-multiply blur-[20px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[0], animationDuration: '4s' }} />
                <div className="absolute top-0 left-1/4 w-56 h-40 rounded-[60%_40%_30%_70%] mix-blend-multiply blur-[25px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[1], animationDuration: '5s' }} />
                <div className="absolute -bottom-10 right-1/4 w-48 h-48 rounded-[30%_70%_70%_30%] mix-blend-multiply blur-[20px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[2], animationDuration: '6s' }} />
                <div className="absolute -top-12 -right-10 w-56 h-56 rounded-[50%_50%_20%_80%] mix-blend-multiply blur-[25px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[3], animationDuration: '7s' }} />`;
const landscapeReplacement = `{isWhispersActive && (
                  <>
                    <div className="absolute -top-10 -left-10 w-48 h-48 rounded-[40%_60%_70%_30%] mix-blend-multiply blur-[20px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[0], animationDuration: '4s' }} />
                    <div className="absolute top-0 left-1/4 w-56 h-40 rounded-[60%_40%_30%_70%] mix-blend-multiply blur-[25px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[1], animationDuration: '5s' }} />
                    <div className="absolute -bottom-10 right-1/4 w-48 h-48 rounded-[30%_70%_70%_30%] mix-blend-multiply blur-[20px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[2], animationDuration: '6s' }} />
                    <div className="absolute -top-12 -right-10 w-56 h-56 rounded-[50%_50%_20%_80%] mix-blend-multiply blur-[25px] animate-pulse transition-colors duration-1000" style={{ backgroundColor: moodData.colors[3], animationDuration: '7s' }} />
                  </>
                )}`;
code = code.replace(landscapeTarget, landscapeReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated Visual Whispers logic.");
