import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each education entry (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each education object
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

const deduplicationInstructions = `
STRICT DEDUPLICATION RULES:
An education record is considered a DUPLICATE if it matches an existing education record on ALL of these criteria:

1. EXACT INSTITUTION MATCH (case-insensitive):
   - "Hiram College" = "hiram college" = "Hiram College"
   - "University of California, Davis" = "university of california, davis" = "UC Davis"
   - "Mary Baldwin College" = "mary baldwin college"
   - Must be EXACT match after normalizing case and basic punctuation

2. DEGREE LEVEL AND TYPE EQUIVALENCE (case-insensitive):
   - "Bachelor's Degree" = "Bachelor of Arts" = "Bachelor of Science" = "BA" = "BS" (same degree level)
   - "Master's Degree" = "Master of Arts" = "Master of Fine Arts" = "MA" = "MFA" (same degree level)
   - "Associate Degree" = "Associate of Arts" = "AA" (same degree level)
   - Focus on degree LEVEL rather than exact wording

3. SAME GRADUATION YEAR OR DATE:
   - "2004" = "2004" = "May 2004"
   - Must have same year, regardless of month specificity

4. SAME OR RELATED FIELD OF STUDY (if specified):
   - "English and Theater" = "English" = "Theater" (overlapping fields)
   - "Computer Science" = "Computer Science"
   - If major/field matches or overlaps significantly

DUPLICATE IDENTIFICATION LOGIC:
- If institution + degree level + graduation year all match → DEFINITE DUPLICATE, skip it
- If institution + graduation year match but degree level is different → Could be multiple degrees, NOT a duplicate
- If only institution matches but year is different → Different degrees/programs, NOT a duplicate

CRITICAL: You must check EVERY potential education record against EVERY existing education record in the provided array.

EXAMPLES OF DUPLICATES TO AVOID:
- "Bachelor's Degree from Hiram College, 2004" + "Bachelor of Arts, Hiram College, 2004" → SAME DEGREE (both bachelor's level)
- "Master of Fine Arts, Mary Baldwin College, 2010" + "MFA in Directing, Mary Baldwin College, 2010" → SAME DEGREE
- "BS Computer Science, MIT, 2019" + "Bachelor of Science in Computer Science, MIT, 2019" → SAME DEGREE

EXAMPLES OF NON-DUPLICATES:
- "Bachelor of Arts, Harvard, 2015" + "Master of Arts, Harvard, 2017" → DIFFERENT DEGREES (different levels, years)
- "Certificate in Project Management, PMI, 2020" + "Bachelor of Science, MIT, 2020" → DIFFERENT DEGREES (different levels, institutions)
`;

export const educationExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `You are tasked with extracting education information from a resume while avoiding duplicates with existing education records.

EXISTING EDUCATION CONTEXT:
You will be provided with a list of existing education records that the user already has in their system. Your task is to extract ONLY NEW education records from the resume that are NOT already represented in the existing records.

CRITICAL INSTRUCTION: Before outputting ANY education record, you must verify it doesn't already exist in the provided existing education records array. If you find even ONE match based on institution + degree level + graduation year, DO NOT include that education record in your output.

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
- Do NOT create duplicate entries for education records that already exist in the user's records (THIS IS CRITICAL)
- When uncertain if an education record is a duplicate of an existing record, exclude it (err on the side of caution)

${deduplicationInstructions}

OUTPUT FORMAT:
Return a valid JSON array of education objects with this structure:
- id: string (10-character alphanumeric identifier)
- title: string (concise description, e.g., "Bachelor of Science in Computer Science")
- degree: string (degree type, e.g., "Bachelor of Science", "Master of Arts", "Certificate")
- major: string (field of study, e.g., "Computer Science", "Business Administration")
- school: string (institution name, e.g., "University of California, Davis")
- date: string (graduation year or date range, e.g., "2019" or "2017-2019")
- userConfirmed: boolean (always set to false)

FORMATTING NOTES:
- Keep titles concise but descriptive
- Use full institution names when possible
- Include graduation year even if month/day is unknown
- For certifications, use the issuing organization as the "school"
- CRITICAL: Always cross-reference against existing education records before adding new entries

${technicalRequirements}

PROCESSING WORKFLOW:
1. Extract all potential education records from the resume text
2. For EACH potential education record, systematically check it against EVERY education record in the existing records array
3. Use the strict matching criteria: institution + degree level + graduation year
4. If ANY match is found, EXCLUDE that education record from the output
5. Only include education records that have ZERO matches in the existing records
6. Return only the genuinely new education records

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

If no NEW education information is found in the resume (i.e., all education records are duplicates of existing records), return an empty array: []`,
};
