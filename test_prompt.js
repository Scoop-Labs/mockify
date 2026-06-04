const key = process.env.GEMINI_API_KEY || "";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

const prompt = `Generate exactly 10 technical interview questions for a "Docker" interview. 
The difficulty should be easy to medium, tailored for someone with 1-3 years of experience.
Format the output EXACTLY as a JSON array of objects. Do not include any markdown formatting, backticks, or other text outside the JSON array.
Each object must have this structure:
{
  "text": "The question text",
  "conceptGroups": [
    { "point": "The core concept the user should mention", "synonyms": ["synonym1", "synonym2", "synonym3"] },
    { "point": "Another core concept", "synonyms": ["word1", "word2"] }
  ]
}
Provide 3 to 5 conceptGroups for each question, representing the key points the candidate must cover to get a perfect score. Provide at least 4 synonyms for each point.`;

async function test() {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data).substring(0, 500) + "...");
    } catch (e) {
        console.error(e);
    }
}
test();