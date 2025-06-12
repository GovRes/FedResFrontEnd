import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each volunteer experience (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each volunteer object
- Set "type" field to "Volunteer" for all entries
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

const deduplicationInstructions = `
STRICT DEDUPLICATION RULES:
A volunteer experience is considered a DUPLICATE if it matches an existing volunteer record on ALL of these criteria:

1. EXACT ORGANIZATION MATCH (case-insensitive):
   - "American Red Cross" = "american red cross" = "American Red Cross"
   - "Big Brothers Big Sisters" = "big brothers big sisters"
   - "Local Food Bank" = "local food bank"
   - Must be EXACT match after normalizing case and basic punctuation

2. EXACT OR EQUIVALENT TITLE MATCH (case-insensitive):
   - "Tax Preparer" = "tax preparer"
   - "Youth Mentor" = "youth mentor"
   - "Board Member" = "board member"
   - "Volunteer" = "volunteer" (generic titles)
   - Must be EXACT match after normalizing case

3. DATE RANGE OVERLAP OR EXACT MATCH:
   - Same start date: "2022" = "2022"
   - Same end date: "2022" = "2022" OR "Present" = "Present"
   - OR significant overlap in date ranges

DUPLICATE IDENTIFICATION LOGIC:
- If organization + title + date range all match → DEFINITE DUPLICATE, skip it
- If organization + title match but dates are different → POSSIBLE DUPLICATE, skip it to be safe
- If only organization matches but title is different → NOT a duplicate (could be different volunteer roles)

CRITICAL: You must check EVERY potential volunteer experience against EVERY existing volunteer record in the provided array.

SPECIAL CONSIDERATIONS FOR VOLUNTEERS:
- Many people have multiple volunteer roles at the same organization over time
- Only consider it a duplicate if the role/title is also the same
- Board positions vs. general volunteer work are different roles
- Different program areas within same org (e.g., "Reading Tutor" vs "Fundraising Volunteer") are separate roles
`;

export const volunteersExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `You are tasked with extracting volunteer and community service experience from a resume while avoiding duplicates with existing volunteer records.

EXISTING VOLUNTEERS CONTEXT:
You will be provided with a list of existing volunteer records that the user already has in their system. Your task is to extract ONLY NEW volunteer experiences from the resume that are NOT already represented in the existing records.

CRITICAL INSTRUCTION: Before outputting ANY volunteer experience, you must verify it doesn't already exist in the provided existing volunteer records array. If you find even ONE match based on organization + title + similar dates, DO NOT include that volunteer experience in your output.

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
- Do NOT create duplicate entries for volunteer experiences that already exist in the user's records (THIS IS CRITICAL)
- When uncertain if something is a volunteer role or paid work, exclude it
- When uncertain if a volunteer experience is a duplicate of an existing record, exclude it (err on the side of caution)

${deduplicationInstructions}

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
- CRITICAL: Always cross-reference against existing volunteer records before adding new entries

${technicalRequirements}

PROCESSING WORKFLOW:
1. Extract all potential volunteer experiences from the resume text
2. For EACH potential volunteer experience, systematically check it against EVERY volunteer record in the existing records array
3. Use the strict matching criteria: organization + title + date overlap
4. If ANY match is found, EXCLUDE that volunteer experience from the output
5. Only include volunteer experiences that have ZERO matches in the existing records
6. Return only the genuinely new volunteer experiences

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

If no NEW volunteer experience is found in the resume (i.e., all volunteer experiences are duplicates of existing records), return an empty array: []`,
};
