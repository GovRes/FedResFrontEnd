import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each volunteer experience (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each volunteer object
- Set "type" field to "Volunteer" for all entries
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

export const volunteersExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `You are tasked with extracting volunteer and community service experience from a resume.

WHAT TO EXTRACT:
- Formal volunteer positions with organizations
- Community service activities
- Pro bono professional work
- Religious or faith-based service roles
- Board memberships for non-profits
- Unpaid internships or fellowships
- Charitable work and fundraising activities
- Civic engagement and public service roles

WHAT NOT TO EXTRACT:
- Do NOT invent or hallucinate any volunteer experiences not explicitly mentioned
- Do NOT include paid employment positions
- Do NOT include educational experiences or coursework
- Do NOT include personal hobbies or activities without organizational involvement
- Do NOT include awards, certifications, or memberships without active service

OUTPUT FORMAT:
Return a valid JSON array of volunteer objects with this structure:
- id: string (10-character alphanumeric identifier)
- type: string (always "Volunteer")
- title: string (volunteer position/role title)
- organization: string (organization or group name)
- hours: string (time commitment, e.g., "15 hours per week", "5 hours per month", "Seasonal")
- startDate: string (start date in YYYY-MM-DD format, or YYYY-MM, or YYYY if only year available)
- endDate: string (end date in same format, or "Present" for ongoing volunteer work)
- responsibilities: string (key duties and accomplishments, 2-4 sentences)

FORMATTING NOTES:
- Use "Present" for ongoing volunteer work
- If hours aren't specified, estimate based on context or use "Part-time" or "Occasional"
- Keep responsibilities concise but highlight impact and skills developed
- Include quantifiable achievements when mentioned

${technicalRequirements}

EXAMPLES:
[
  {
    "id": "a1b2c3d4e5",
    "type": "Volunteer",
    "title": "Tax Preparer",
    "organization": "Your Taxes Done Right (non-profit)",
    "hours": "15 hours per week",
    "startDate": "2022-04-01",
    "endDate": "2025-01-01",
    "responsibilities": "Assist more than 250 individuals annually with tax preparation and filing. Stay current with tax law changes and provide guidance to fellow volunteers. Interpret complex tax regulations for clients to ensure accurate and compliant submissions."
  },
  {
    "id": "f6g7h8i9j0",
    "type": "Volunteer",
    "title": "Youth Mentor",
    "organization": "Big Brothers Big Sisters",
    "hours": "4 hours per week",
    "startDate": "2020-09",
    "endDate": "Present",
    "responsibilities": "Provide mentorship and guidance to at-risk youth through weekly meetings and activities. Support academic achievement and personal development goals. Collaborate with program staff to track progress and adjust mentoring approach."
  },
  {
    "id": "k1l2m3n4o5",
    "type": "Volunteer",
    "title": "Board Member",
    "organization": "Local Food Bank",
    "hours": "10 hours per month",
    "startDate": "2019-01",
    "endDate": "2022-12",
    "responsibilities": "Served on governing board providing strategic oversight and policy guidance. Led fundraising committee that increased annual donations by 30%. Participated in monthly board meetings and quarterly strategic planning sessions."
  },
  {
    "id": "m6n7o8p9q0",
    "type": "Volunteer",
    "title": "Emergency Response Volunteer",
    "organization": "American Red Cross",
    "hours": "On-call basis",
    "startDate": "2021-03",
    "endDate": "Present",
    "responsibilities": "Respond to local disasters and emergencies to provide immediate assistance to affected families. Set up emergency shelters and distribute relief supplies. Complete ongoing training in disaster response protocols and first aid."
  }
]

If no volunteer experience is found in the resume, return an empty array: []`,
};
