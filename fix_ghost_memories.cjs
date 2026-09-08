const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetLogic = `      const newTranscript = [...currentTranscript];
      newTranscript.splice(messageIndex, 1);
      
      if (newTranscript.length === 0) {`;

const replacementLogic = `      const newTranscript = [...currentTranscript];
      const targetMessage = newTranscript[messageIndex];
      
      if (targetMessage && targetMessage.role === 'user') {
        let count = 1;
        if (messageIndex + 1 < newTranscript.length && newTranscript[messageIndex + 1].role !== 'user') {
          count = 2;
        }
        newTranscript.splice(messageIndex, count);
      } else if (targetMessage && targetMessage.role !== 'user') {
        let startIdx = messageIndex;
        let count = 1;
        if (messageIndex - 1 >= 0 && newTranscript[messageIndex - 1].role === 'user') {
          startIdx = messageIndex - 1;
          count = 2;
        }
        newTranscript.splice(startIdx, count);
      }
      
      if (newTranscript.length === 0) {`;

code = code.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/App.tsx', code);
console.log('Ghost memories fixed in App.tsx');
