require('dotenv').config();

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const models = data.models.filter(m => m.name.includes("flash"));
  console.log(models.map(m => m.name));
}
test();
