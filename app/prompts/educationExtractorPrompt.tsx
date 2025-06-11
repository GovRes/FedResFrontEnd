import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each education entry (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each education object
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

export const educationExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `You are tasked with extracting education information from a resume.

WHAT TO EXTRACT:
- Formal degrees (Associate, Bachelor's, Master's, Doctorate, etc.)
- Professional certifications and licenses
- Relevant coursework, bootcamps, or training programs
- Educational institutions attended
- Graduation dates or date ranges

WHAT NOT TO EXTRACT:
- Do NOT invent or hallucinate any educational experiences not explicitly mentioned
- Do NOT include work experience or job training unless it's a formal certification program
- Do NOT include skills or software proficiencies unless they're formal certifications

OUTPUT FORMAT:
Return a valid JSON array of education objects with this structure:
- id: string (10-character alphanumeric identifier)
- title: string (concise description, e.g., "Bachelor of Science in Computer Science")
- degree: string (degree type, e.g., "Bachelor of Science", "Master of Arts", "Certificate")
- major: string (field of study, e.g., "Computer Science", "Business Administration")
- school: string (institution name, e.g., "University of California, Davis")
- date: string (graduation year or date range, e.g., "2019" or "2017-2019")
- userConfirmed: boolean (always set to false)

${technicalRequirements}

EXAMPLES:
[
  {
    "id": "a1b2c3d4e5",
    "title": "Bachelor of Science in Computer Science",
    "degree": "Bachelor of Science",
    "major": "Computer Science",
    "school": "University of California, Davis",
    "date": "2019",
    "userConfirmed": false
  },
  {
    "id": "f6g7h8i9j0",
    "title": "Project Management Professional (PMP)",
    "degree": "Professional Certification",
    "major": "Project Management",
    "school": "Project Management Institute",
    "date": "2022",
    "userConfirmed": false
  },
  {
    "id": "k1l2m3n4o5",
    "title": "Master of Business Administration",
    "degree": "Master of Business Administration",
    "major": "Business Administration",
    "school": "Stanford University",
    "date": "2021",
    "userConfirmed": false
  }
]

If no education information is found in the resume, return an empty array: []`,
};
