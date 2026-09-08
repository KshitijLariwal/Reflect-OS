const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = "Distill this journal transcript into a raw JSON object: { \"title\": \"string\", \"summary\": \"string\", \"mood\": \"string\", \"tags\": [\"string\"] }\\n\\nFocus strictly on the core intellectual, technical, or structural themes. Do not let fleeting conversational phrases or temporary fatigue hijack the summary into a 'burnout' or 'solace' narrative. Maintain grounded, objective insights.\\n\\n${transcriptString}";

const replace = "Distill this journal transcript into a raw JSON object: { \"title\": \"string\", \"summary\": \"string\", \"mood\": \"string\", \"tags\": [\"string\"] }\\n\\nMaintain a scholarly, objective tone. DO NOT invent forced 'burnout' or 'melancholy' narratives. HOWEVER, you MUST accurately capture all concrete factual events, technical issues, and specific physical occurrences (e.g., hardware damage, specific tools used, life events) mentioned by the user. Do not omit factual details in the pursuit of abstraction.\\n\\n${transcriptString}";

code = code.split(target).join(replace);

fs.writeFileSync('server.ts', code);
console.log('Prompts updated');
