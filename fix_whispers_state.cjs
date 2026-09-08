const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the localStorage dependency to just hardcode it to true
// so the features are permanently on without the button.

const targetState = `const [isWhispersActive, setIsWhispersActive] = useState(() => {
    const saved = localStorage.getItem('reflectos_whispers_v2_enabled');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('reflectos_whispers_v2_enabled', String(isWhispersActive));
  }, [isWhispersActive]);`;

const replacementState = `const [isWhispersActive, setIsWhispersActive] = useState(true); // Hardcoded to true since button was removed`;

code = code.replace(targetState, replacementState);

fs.writeFileSync('src/App.tsx', code);
console.log("Hardcoded isWhispersActive to true.");
