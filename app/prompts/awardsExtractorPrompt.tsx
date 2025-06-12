import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each award (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each award object
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

const deduplicationInstructions = `
STRICT DEDUPLICATION RULES:
An award is considered a DUPLICATE if it matches an existing award record on ALL of these criteria:

1. EXACT AWARD TITLE MATCH (case-insensitive):
   - "Employee of the Year" = "employee of the year" = "Employee Of The Year"
   - "Dean's List" = "dean's list" = "Deans List"
   - "Outstanding Service Award" = "outstanding service award"
   - Must be EXACT match after normalizing case and basic punctuation

2. SAME OR OVERLAPPING DATE:
   - "2023" = "2023"
   - "2019-2021" overlaps with "2020" or "2019-2020"
   - Consider awards with overlapping years as potential duplicates

DUPLICATE IDENTIFICATION LOGIC:
- If award title + date/year match exactly → DEFINITE DUPLICATE, skip it
- If award title matches but dates are different → Could be recurring award, NOT a duplicate
- If similar but not identical titles → NOT a duplicate (e.g., "Employee of the Month" vs "Employee of the Year")

CRITICAL: You must check EVERY potential award against EVERY existing award record in the provided array.

EXAMPLES OF DUPLICATES TO AVOID:
- "Employee of the Year, 2023" + "Employee of the Year, 2023" → SAME AWARD
- "Dean's List, 2019-2021" + "Deans List, 2019-2021" → SAME AWARD
- "Outstanding Service Award, 2022" + "outstanding service award, 2022" → SAME AWARD

EXAMPLES OF NON-DUPLICATES:
- "Employee of the Year, 2023" + "Employee of the Year, 2024" → DIFFERENT YEARS (recurring award)
- "Employee of the Month, January 2023" + "Employee of the Year, 2023" → DIFFERENT AWARDS
- "Dean's List, Fall 2019" + "Dean's List, Spring 2020" → DIFFERENT SEMESTERS
`;

const sectionTargetingInstructions = `
CRITICAL SECTION TARGETING RULES:
You must ONLY extract awards from sections that have headings explicitly indicating awards/recognition. 

LOOK FOR THESE SECTION HEADINGS (case-insensitive):
- "Awards"
- "Achievements" 
- "Honors"
- "Recognition"
- "Accomplishments"
- "Distinctions"
- "Certificates" (if it's clearly awards/certifications, not education)
- "Professional Recognition"
- "Academic Honors"
- Any variation that clearly indicates awards/recognition

DO NOT EXTRACT FROM THESE SECTIONS:
- Work Experience / Employment History
- Education (unless there's a separate "Academic Honors" subsection)
- Skills / Technical Skills
- Summary / Profile
- Projects
- Publications
- Any section without a clear awards/recognition heading

VALIDATION PROCESS:
1. First, identify if there are any sections with awards/recognition headings
2. If NO such sections exist, return empty array []
3. If such sections exist, extract ONLY from those sections
4. Do NOT extract achievements mentioned casually in work experience or other sections

EXAMPLES OF WHAT NOT TO EXTRACT:
- "Led team that won company contract" (this is in work experience, not awards section)
- "Graduated magna cum laude" (this is in education, not a separate honor)
- "Achieved 150% of sales target" (this is work accomplishment, not formal award)

ONLY EXTRACT IF:
- It appears under a clear awards/recognition section heading
- It's a formal, named award or recognition
- It has a specific title and date
`;

export const awardsExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `You are tasked with extracting awards and achievements from a resume while avoiding duplicates with existing award records and preventing hallucination by only looking in dedicated awards sections.

EXISTING AWARDS CONTEXT:
You will be provided with a list of existing award records that the user already has in their system. Your task is to extract ONLY NEW awards from the resume that are NOT already represented in the existing records.

CRITICAL INSTRUCTION: Before outputting ANY award, you must verify it doesn't already exist in the provided existing award records array. If you find even ONE match based on award title + date, DO NOT include that award in your output.

${sectionTargetingInstructions}

WHAT TO EXTRACT:
- Look ONLY for sections with headings like: "Awards", "Achievements", "Honors", "Recognition", "Accomplishments"
- Extract legitimate awards, honors, certifications, and notable achievements FROM THESE SECTIONS ONLY
- Include professional recognition, academic honors (beyond degrees), scholarships, competitions won, etc.
- Must be formal, named awards with specific titles

WHAT NOT TO EXTRACT:
- Do NOT invent or hallucinate any awards not explicitly mentioned
- Do NOT include basic degree completions (high school diploma, bachelor's degree, etc.)
- Do NOT include job titles, work experience, or skills
- Do NOT include general statements without specific award names
- Do NOT extract achievements from work experience or other non-award sections
- Do NOT create duplicate entries for awards that already exist in the user's records (THIS IS CRITICAL)
- When uncertain if an award is a duplicate of an existing record, exclude it (err on the side of caution)
- When uncertain if something is in an appropriate awards section, exclude it

${deduplicationInstructions}

OUTPUT FORMAT:
Return a valid JSON array of award objects with this structure:
- id: string (10-character alphanumeric identifier)
- title: string (name of the award)
- date: string (year or date range when awarded, e.g., "2023" or "2018-2022")

FORMATTING NOTES:
- Use exact award titles as they appear
- Include year even if month/day is unknown
- For recurring awards (like Dean's List), include the specific time period
- CRITICAL: Always cross-reference against existing award records before adding new entries

${technicalRequirements}

PROCESSING WORKFLOW:
1. Scan the resume for sections with awards/recognition headings
2. If NO such sections exist, return empty array []
3. If such sections exist, extract all potential awards from ONLY those sections
4. For EACH potential award, systematically check it against EVERY award record in the existing records array
5. Use the strict matching criteria: award title + date
6. If ANY match is found, EXCLUDE that award from the output
7. Return only the genuinely new awards from dedicated awards sections

EXAMPLES:
[
  {"id": "a1b2c3d4e5", "title": "Employee of the Year", "date": "2023"},
  {"id": "f6g7h8i9j0", "title": "Dean's List", "date": "2019-2021"},
  {"id": "k1l2m3n4o5", "title": "Outstanding Service Award", "date": "2022"}
]

If no awards sections are found in the resume OR all awards are duplicates of existing records, return an empty array: []`,
};
