const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add the ref
code = code.replace(
  'const textareaRef = useRef<HTMLTextAreaElement>(null);',
  'const textareaRef = useRef<HTMLTextAreaElement>(null);\n  const featureMenuRef = useRef<HTMLDivElement>(null);'
);

// Add the useEffect for handling outside clicks
const clickOutsideEffect = `
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (featureMenuRef.current && !featureMenuRef.current.contains(event.target as Node)) {
        setIsFeatureMenuOpen(false);
      }
    }
    if (isFeatureMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFeatureMenuOpen]);
`;

code = code.replace(
  '  const [isArchivesOpen, setIsArchivesOpen] = useState(false);',
  clickOutsideEffect + '\n  const [isArchivesOpen, setIsArchivesOpen] = useState(false);'
);

// Attach the ref to the div wrapper
code = code.replace(
  '{/* THE ARCHIVIST\'S FLOWER (FEATURE MENU) */}\n            <div className="absolute top-2 right-4 z-50">',
  '{/* THE ARCHIVIST\'S FLOWER (FEATURE MENU) */}\n            <div ref={featureMenuRef} className="absolute top-2 right-4 z-50">'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated click outside handler for the flower icon");
