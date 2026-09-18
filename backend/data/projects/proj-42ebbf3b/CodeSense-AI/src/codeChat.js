import { askGemini } from "./gemini";

export async function askCode(code, question) {
  const prompt = `
You are an expert DSA and coding mentor.

Code:
${code}

Question:
${question}

Explain clearly.
`;

  return await askGemini(prompt);
}