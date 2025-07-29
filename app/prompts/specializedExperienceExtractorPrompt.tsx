import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

const technicalRequirements = `
Technical requirements:
- Generate a unique 10-character alphanumeric ID for each specialized experience (letters and numbers only, no spaces or special characters)
- Assign this ID to the "id" field of each specialized experience object
- Only populate required fields; leave optional fields empty/undefined
- Return valid JSON array format
`;

export const specializedExperienceExtractorPrompt: ChatCompletionSystemMessageParam =
  {
    role: "system",
    content: `You are tasked with extracting specialized experience requirements ONLY from the "Qualifications" section of a job posting.

EXTRACTION FOCUS:
- Look specifically for the "Qualifications" section or similar heading
- Find text that says "Qualified specialized experience must demonstrate the following" or similar phrases like:
  - "Specialized experience must include"
  - "Qualified candidates must have specialized experience in"
  - "Required specialized experience includes"
  - "Specialized experience requirements"
- Extract ONLY the bulleted list items that follow this indicator phrase
- Ignore all other qualifications, requirements, or experience mentioned elsewhere in the job posting

WHAT TO EXTRACT FROM THE SPECIALIZED EXPERIENCE LIST:
- Specific degree requirements (not general education)
- Professional certifications and licenses
- Specialized software or technology experience
- Industry-specific experience requirements
- Technical skills with specific tools or platforms
- Years of experience in particular roles or domains
- Security clearance requirements
- Language proficiency requirements

WHAT NOT TO EXTRACT:
- Do NOT include general qualifications from other sections
- Do NOT include basic requirements like "high school diploma"
- Do NOT include items not in the specialized experience bulleted list
- Do NOT include soft skills or personality traits
- Do NOT include general work experience without specific specialization
- Do NOT extract from "Preferred Qualifications" or "Nice to Have" sections

CATEGORIZATION:
Use the most appropriate typeOfExperience from: ["degree", "certification", "license", "experience", "other"]

OUTPUT FORMAT:
Return a valid JSON array of specialized experience objects with this structure:
- id: string (10-character alphanumeric identifier)
- title: string (concise name of the requirement)
- description: string (1-2 sentence explanation of the requirement, using the exact wording from the job posting when possible)
- initialMessage: string (conversational question to help user write about this experience)
- typeOfExperience: string (category from the list above)

INITIAL MESSAGE GUIDELINES:
- Include the job title and department/organization name if available
- Reference the specific specialized experience requirement
- Ask an open-ended question to gather relevant details
- Keep tone conversational and helpful

${technicalRequirements}

EXAMPLES:
[
  {
    "id": "a1b2c3d4e5",
    "title": "Bachelor's in Cybersecurity",
    "description": "Bachelor's degree in Cybersecurity, Computer Science, Information Technology, or closely related field from an accredited institution.",
    "initialMessage": "I'm going to help you write about your cybersecurity degree for your IT Security Specialist application. Can you tell me about your undergraduate program - what university you attended, your major focus areas, and any relevant coursework or projects?",
    "typeOfExperience": "degree"
  },
  {
    "id": "f6g7h8i9j0",
    "title": "3+ Years Network Security Experience",
    "description": "At least three years of specialized experience in network security, including firewall configuration, intrusion detection, and vulnerability assessment.",
    "initialMessage": "For your Network Security Analyst position, I need to help you describe your network security experience. Can you walk me through your experience with firewall configuration, intrusion detection systems, and vulnerability assessments over the past three years?",
    "typeOfExperience": "experience"
  },
  {
    "id": "k1l2m3n4o5",
    "title": "CISSP or CISM Certification",
    "description": "Current CISSP, CISM, or equivalent information security certification, or ability to obtain within 12 months of employment.",
    "initialMessage": "I'm helping you write about your information security certification for this Cybersecurity Manager role. Can you describe your current certification status, when you earned it, and how you've maintained your professional development in this area?",
    "typeOfExperience": "certification"
  },
  {
    "id": "m6n7o8p9q0",
    "title": "Secret Clearance Eligibility",
    "description": "Ability to obtain and maintain a Secret security clearance as required for access to classified systems and information.",
    "initialMessage": "For this Defense Contractor position, I'll help you address the security clearance requirement. Can you describe your eligibility for obtaining a Secret clearance, including any previous clearance history or relevant background factors?",
    "typeOfExperience": "other"
  }
]

IMPORTANT: If no "Qualifications" section is found, or if no specialized experience indicator phrase is present, or if the specialized experience list is empty, return an empty array: []

Only extract from the specific bulleted list that follows the specialized experience indicator phrase in the Qualifications section.`,
  };
