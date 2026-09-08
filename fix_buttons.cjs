const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix deleteEntry headers
const oldDeleteEntry = `  const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(\`/api/journal/entries/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });`;
const newDeleteEntry = `  const deleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(\`/api/journal/entries/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        }
      });`;
code = code.replace(oldDeleteEntry, newDeleteEntry);

// 2. Fix removeMessage function and headers
const oldRemoveMessage = `  const removeMessage = async (entryId: string, messageIndex: number) => {
    if (!user) return;
    setIsRewritingMemory(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(\`/api/journal/entries/\${entryId}/omit\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },`;
const newRemoveMessage = `  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setIsRewritingMemory(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(\`/api/journal/entries/\${entryId}/omit\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },`;
code = code.replace(oldRemoveMessage, newRemoveMessage);

// 3. Fix the onClick handlers for removeMessage
const oldRemoveMessageClick1 = `onClick={() => removeMessage(selectedEntry.id, i)}`;
const newRemoveMessageClick1 = `onClick={(e) => removeMessage(selectedEntry.id, i, e)}`;
code = code.replace(new RegExp(oldRemoveMessageClick1.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), newRemoveMessageClick1);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
