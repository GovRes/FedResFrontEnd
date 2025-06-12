import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each job (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each job object
- Set "type" field to "PastJob" for all entries
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

const deduplicationInstructions = `
STRICT DEDUPLICATION RULES:
A job is considered a DUPLICATE if it matches an existing job on ALL of these criteria:

1. EXACT ORGANIZATION MATCH (case-insensitive):
   - "NextStreet" = "nextstreet" = "NextStreet"
   - "MoveOn.org" = "moveon.org" = "MoveOn"
   - "Roundtable from the 92nd Street Y" = "roundtable from the 92nd street y"
   - Must be EXACT match after normalizing case and basic punctuation

2. EXACT OR EQUIVALENT TITLE MATCH (case-insensitive):
   - "Fractional engineering lead" = "fractional engineering lead"
   - "Software engineer" = "software engineer"
   - "CTO and lead engineer" = "cto and lead engineer"
   - Must be EXACT match after normalizing case

3. DATE RANGE OVERLAP OR EXACT MATCH:
   - Same start date: "2022" = "2022"
   - Same end date: "2022" = "2022" OR "Present" = "Present"
   - OR significant overlap in date ranges

DUPLICATE IDENTIFICATION LOGIC:
- If organization + title + date range all match → DEFINITE DUPLICATE, skip it
- If organization + title match but dates are different → POSSIBLE DUPLICATE, skip it to be safe
- If only organization matches but title is different → NOT a duplicate (could be promotion/different role)

CRITICAL: You must check EVERY potential job against EVERY existing job in the provided array.

EXAMPLES:
These are ALL duplicates and should NOT be extracted again:
- NextStreet + "Fractional engineering lead" + 2022-2023/Present → Already exists multiple times
- MoveOn.org + "Software engineer" + 2019-2022 → Already exists multiple times  
- TechOut + "CTO and lead engineer" + 2018-2022 → Already exists multiple times
- Roundtable from the 92nd Street Y + "Fractional head of engineering" + 2022-Present → Already exists multiple times
- Henslowe's Cloud Creative Consulting + "Founder" + 2011-Present → Already exists multiple times
- Rosetta Stone + "Researcher" + 2008-2011 → Already exists
- Rosetta Stone + "Educational Software Content Architect" + 2005-2008 → Already exists
`;

export const pastJobsExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `You are tasked with extracting work experience from a resume while avoiding duplicates with existing job records.

EXISTING JOBS CONTEXT:
You will be provided with a list of existing job records that the user already has in their system. Your task is to extract ONLY NEW jobs from the resume that are NOT already represented in the existing records.

CRITICAL INSTRUCTION: Before outputting ANY job, you must verify it doesn't already exist in the provided existing jobs array. If you find even ONE match based on organization + title + similar dates, DO NOT include that job in your output.

WHAT TO EXTRACT:
- Full-time and part-time employment positions
- Contract work and consulting roles  
- Internships and temporary positions
- Military service positions
- Self-employment and freelance work

WHAT NOT TO EXTRACT:
- Do NOT invent or hallucinate any work experiences not explicitly mentioned
- Do NOT include educational programs, degrees, or academic coursework
- Do NOT include awards, certifications, or skills sections
- Do NOT include references or personal projects unless they were paid positions
- Do NOT include volunteer work unless it is explicitly stated as a job or paid position
- Do NOT create duplicate entries for jobs that already exist in the user's records (THIS IS CRITICAL)
- When uncertain if something is a job or education, exclude it
- When uncertain if a job is a duplicate of an existing record, exclude it (err on the side of caution)

${deduplicationInstructions}

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
- CRITICAL: Always cross-reference against existing jobs before adding new entries

${technicalRequirements}

PROCESSING WORKFLOW:
1. Extract all potential jobs from the resume text
2. For EACH potential job, systematically check it against EVERY job in the existing records array
3. Use the strict matching criteria: organization + title + date overlap
4. If ANY match is found, EXCLUDE that job from the output
5. Only include jobs that have ZERO matches in the existing records
6. Return only the genuinely new jobs (likely an empty array if the resume has been processed before)

EXPECTED RESULT FOR THIS RESUME:
Based on the existing jobs provided, this resume appears to have been processed multiple times already. All major positions (NextStreet, Roundtable, MoveOn.org, TechOut, Henslowe's Cloud, Rosetta Stone) already exist in the records. You should return an empty array [] unless you find a job that is genuinely missing.

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

If no NEW work experience is found in the resume (i.e., all jobs are duplicates of existing records), return an empty array: []`,
};
