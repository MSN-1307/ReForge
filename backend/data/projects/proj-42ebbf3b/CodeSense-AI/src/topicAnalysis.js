import { askGemini } from "./gemini";

export async function analyzeTopic(problem) {
  const prompt = `
You are a DSA mentor.

Analyze this coding problem and return ONLY JSON.

{
  "primaryTopic":"",
  "subTopics":[],
  "difficulty":"",
  "targetComplexity":"",
  "companies":[],
  "nextProblems":[]
}

Problem:
${problem}
`;

  try {
    const response = await askGemini(prompt);

    const cleaned = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}