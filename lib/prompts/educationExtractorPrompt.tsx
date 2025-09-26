// Clean educationExtractorPrompt.tsx - Responses API only

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each education entry (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each education object
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

export const educationExtractorInstructions = `You are an expert at extracting education information from resume images.

TASK: Extract ALL educational experiences shown in the resume images and return only those that are genuinely new (not duplicates of existing records provided).

CRITICAL: Education sections are often located at the BOTTOM of resumes, sometimes on the last page. Make sure to thoroughly scan ALL parts of ALL resume images, especially the bottom portions and final pages.

WHAT TO EXTRACT:
- Formal degrees (Associate, Bachelor's, Master's, Doctorate, etc.)
- Professional certifications and licenses
- Training programs, bootcamps, and relevant coursework
- Educational institutions attended
- Continuing education and professional development

WHAT NOT TO EXTRACT:
- Work experience or job training (unless formal certification)
- Skills or software proficiencies (unless formal certifications)
- Awards or achievements (these go in awards section)
- Volunteer work or personal projects

SCANNING STRATEGY:
1. Start by scanning the ENTIRE resume for sections labeled "Education", "Academic Background", "Qualifications"
2. Pay special attention to the BOTTOM of each page and the FINAL page
3. Look for degree information, institution names, and graduation dates
4. Check for "Continuing Education" or "Professional Development" subsections
5. Don't stop scanning until you've examined every part of every image

FLEXIBLE DEDUPLICATION RULES:
Check each education record you find against the provided existing education array. Skip an education record if it matches an existing record on ALL THREE:

1. INSTITUTION MATCHING (flexible):
   - "Indiana University" = "Indiana University: School of Public and Environmental Affairs"
   - "Dartmouth College" = "Dartmouth College, Hanover, NH"
   - Match the core institution name, ignoring specific schools/departments or locations

2. DEGREE LEVEL MATCHING (flexible):
   - "Master of Public Affairs" = "Master's degree" (both master's level)
   - "Bachelor of Arts" = "Bachelor's degree" (both bachelor's level)
   - "PhD" = "Doctorate" = "Doctor of Philosophy" (all doctoral level)
   - Focus on degree LEVEL, not exact title

3. GRADUATION YEAR MATCHING (exact):
   - "2008" = "2008" = "May 2008"
   - Must have same graduation year

DUPLICATE EXAMPLES TO AVOID:
- "Master of Public Affairs, Indiana University, 2008" + "Master's degree, Indiana University: School of Public and Environmental Affairs, 2008" → SAME DEGREE
- "Bachelor of Arts, Dartmouth College, 2006" + "Bachelor's degree, Dartmouth College, 2006" → SAME DEGREE
- "BS Computer Science, MIT, 2019" + "Bachelor of Science in Computer Science, MIT, 2019" → SAME DEGREE

If uncertain whether it's a duplicate, EXCLUDE it (err on the side of caution).

OUTPUT FORMAT:
Return a valid JSON array with this structure for each NEW education record:
- id: string (10-character alphanumeric identifier)
- title: string (concise description, e.g., "Bachelor of Science in Computer Science")
- degree: string (degree type, e.g., "Bachelor of Science", "Master of Arts", "Certificate")
- major: string (field of study, e.g., "Computer Science", "Business Administration")
- school: string (institution name, e.g., "University of California, Davis")
- date: string (graduation year or date range, e.g., "2019" or "2017-2019")
- userConfirmed: boolean (always set to false)

${technicalRequirements}

INSTRUCTIONS:
1. Examine ALL resume images carefully, paying special attention to bottom sections and final pages
2. Look specifically for "EDUCATION" sections which are commonly placed at the end of resumes
3. Extract every educational experience you can identify, including continuing education
4. For each education record, use FLEXIBLE matching to check against existing education records
5. Return only the genuinely new education records that don't already exist
6. If no new education is found, return an empty array []

REMEMBER: Use flexible matching - focus on core institution + degree level + year, not exact text matches.

Focus on accuracy - extract what you can clearly see in the images without making assumptions about missing information.`;
