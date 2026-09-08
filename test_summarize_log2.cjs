async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/journal/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: [{ role: 'user', content: 'hello' }] })
    });
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
