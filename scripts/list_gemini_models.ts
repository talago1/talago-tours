async function listModels() {
  const key = process.env.GEMINI_API_KEY ?? '';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await res.json();
  if (data.models) {
    console.log('Available models:');
    for (const m of data.models) {
      if (m.supportedGenerationMethods?.includes('generateContent')) {
        console.log(`- ${m.name} (${m.displayName})`);
      }
    }
  } else {
    console.log('Error listing models:', data);
  }
}
listModels();
