const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css += `
@keyframes burnToAsh {
  0% { opacity: 1; filter: sepia(0) brightness(1) blur(0px); transform: scale(1) translateY(0); color: inherit; }
  40% { filter: sepia(1) hue-rotate(-50deg) saturate(3) brightness(0.6) blur(1px); color: #c2410c; }
  100% { opacity: 0; filter: sepia(1) hue-rotate(-50deg) saturate(3) brightness(0.2) blur(4px); transform: scale(0.95) translateY(-10px); color: #000; }
}

.burn-to-ash {
  animation: burnToAsh 0.8s forwards cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

@keyframes inkBleed {
  0% { opacity: 1; filter: blur(0px); transform: scale(1); }
  50% { filter: blur(2px); transform: scale(1.02); }
  100% { opacity: 0; filter: blur(8px); transform: scale(1.05) translateY(5px); }
}

.ink-bleed {
  animation: inkBleed 1s forwards ease-in-out;
  pointer-events: none;
}

@keyframes drift {
  0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.1; }
  50% { transform: translate(15px, -20px) rotate(2deg); opacity: 0.3; }
  100% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.1; }
}

.ambient-constellation {
  position: absolute;
  font-family: var(--font-serif);
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  color: #143026;
  opacity: 0.3;
  transition: opacity 0.7s ease, color 0.7s ease;
  animation: drift 15s infinite ease-in-out alternate;
  pointer-events: none;
  z-index: 0;
}

.ambient-constellation:hover {
  opacity: 1 !important;
  color: #d9a05b;
}

/* Atmospheric Background Transition */
.atmospheric-bg {
  transition: background 1.5s ease-in-out, background-color 1.5s ease-in-out;
}
`;

fs.writeFileSync('src/index.css', css);
console.log("Added CSS animations and utilities");
