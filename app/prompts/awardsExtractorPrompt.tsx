import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each award (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each award object
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

export const awardsExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `You are tasked with extracting awards and achievements from a resume.

WHAT TO EXTRACT:
- Look for sections with headings like: "Awards", "Achievements", "Honors", "Recognition", "Accomplishments"
- Extract legitimate awards, honors, certifications, and notable achievements
- Include professional recognition, academic honors (beyond degrees), scholarships, competitions won, etc.

WHAT NOT TO EXTRACT:
- Do NOT invent or hallucinate any awards not explicitly mentioned
- Do NOT include basic degree completions (high school diploma, bachelor's degree, etc.)
- Do NOT include job titles, work experience, or skills
- Do NOT include general statements without specific award names

OUTPUT FORMAT:
Return a valid JSON array of award objects with this structure:
- id: string (10-character alphanumeric identifier)
- title: string (name of the award)
- date: string (year or date range when awarded, e.g., "2023" or "2018-2022")

${technicalRequirements}

EXAMPLES:
[
  {"id": "a1b2c3d4e5", "title": "Employee of the Year", "date": "2023"},
  {"id": "f6g7h8i9j0", "title": "Dean's List", "date": "2019-2021"},
  {"id": "k1l2m3n4o5", "title": "Outstanding Service Award", "date": "2022"}
]

If no awards are found in the resume, return an empty array: []`,
};
