import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each job (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each job object
- Set "type" field to "PastJob" for all entries
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

export const pastJobsExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `You are tasked with extracting work experience from a resume.

WHAT TO EXTRACT:
- Full-time and part-time employment positions
- Contract work and consulting roles
- Internships and temporary positions
- Volunteer work with significant responsibilities
- Military service positions
- Self-employment and freelance work

WHAT NOT TO EXTRACT:
- Do NOT invent or hallucinate any work experiences not explicitly mentioned
- Do NOT include educational programs, degrees, or academic coursework
- Do NOT include awards, certifications, or skills sections
- Do NOT include references or personal projects unless they were paid positions
- When uncertain if something is a job or education, exclude it

OUTPUT FORMAT:
Return a valid JSON array of job objects with this structure:
- id: string (10-character alphanumeric identifier)
- type: string (always "PastJob")
- title: string (job title/position name)
- organization: string (company/employer name)
- hours: string (work schedule, e.g., "40 hours per week", "Part-time", "Full-time")
- startDate: string (start date in YYYY-MM-DD format, or YYYY-MM, or YYYY if only year available)
- endDate: string (end date in same format, or "Present" for current positions)
- responsibilities: string (key duties and accomplishments, 2-4 sentences)
- gsLevel: string (for federal jobs only, e.g., "GS-12", "GS-13")

SPECIAL NOTES:
- For federal positions, include GS level if mentioned
- Use "Present" for current positions
- If hours aren't specified, use "Full-time" for regular positions
- Keep responsibilities concise but comprehensive

${technicalRequirements}

EXAMPLES:
[
  {
    "id": "a1b2c3d4e5",
    "type": "PastJob",
    "title": "Head of Engineering",
    "organization": "Roundtable.org",
    "hours": "Full-time",
    "startDate": "2022-04-01",
    "endDate": "2025-01-01",
    "responsibilities": "Led engineering team to develop and maintain e-learning platform with course sales, scheduling, and content management features. Managed international team across multiple major projects including launch of subscription-based membership product. Collaborated with internal stakeholders to deliver comprehensive web solutions."
  },
  {
    "id": "f6g7h8i9j0",
    "type": "PastJob",
    "title": "Software Developer",
    "organization": "Department of Defense",
    "hours": "Full-time",
    "startDate": "2019-06",
    "endDate": "2022-03",
    "responsibilities": "Developed secure software applications for military operations. Maintained legacy systems and implemented new security protocols.",
    "gsLevel": "GS-12"
  },
  {
    "id": "k1l2m3n4o5",
    "type": "PastJob",
    "title": "Marketing Intern",
    "organization": "Tech Startup Inc.",
    "hours": "20 hours per week",
    "startDate": "2018-06",
    "endDate": "2018-08",
    "responsibilities": "Assisted with social media campaigns and market research. Created content for company blog and supported lead generation initiatives."
  }
]

If no work experience is found in the resume, return an empty array: []`,
};
