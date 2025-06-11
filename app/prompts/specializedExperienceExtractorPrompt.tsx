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
    content: `You are tasked with extracting specialized experience requirements from a job posting or qualifications summary.

WHAT TO EXTRACT:
- Specific degree requirements (not general education)
- Professional certifications and licenses
- Specialized software or technology experience
- Industry-specific experience requirements
- Technical skills with specific tools or platforms
- Years of experience in particular roles or domains
- Security clearance requirements
- Language proficiency requirements

WHAT NOT TO EXTRACT:
- Do NOT include general qualifications like "good communication skills"
- Do NOT include basic requirements like "high school diploma"
- Do NOT invent requirements not explicitly mentioned
- Do NOT include soft skills or personality traits
- Do NOT include general work experience without specific specialization

CATEGORIZATION:
Use the most appropriate typeOfExperience from: ["degree", "certification", "license", "experience", "other"]

OUTPUT FORMAT:
Return a valid JSON array of specialized experience objects with this structure:
- id: string (10-character alphanumeric identifier)
- title: string (concise name of the requirement)
- description: string (1-2 sentence explanation of the requirement)
- initialMessage: string (conversational question to help user write about this experience)
- typeOfExperience: string (category from the list above)

INITIAL MESSAGE GUIDELINES:
- Include the job title and department/organization name
- Reference the specific specialized experience
- Ask an open-ended question to gather relevant details
- Keep tone conversational and helpful

${technicalRequirements}

EXAMPLES:
[
  {
    "id": "a1b2c3d4e5",
    "title": "Bachelor's in Computer Science",
    "description": "Bachelor's degree in Computer Science, Information Technology, or closely related field from an accredited institution.",
    "initialMessage": "I'm going to help you write about your computer science degree for your IT Security Engineer application at the Department of Defense. Can you tell me about your undergraduate program - what university you attended, your major focus areas, and any relevant coursework or projects?",
    "typeOfExperience": "degree"
  },
  {
    "id": "f6g7h8i9j0",
    "title": "CISSP Certification",
    "description": "Current Certified Information Systems Security Professional (CISSP) certification from (ISC)² or ability to obtain within 6 months.",
    "initialMessage": "For your Cybersecurity Analyst position at the Department of Homeland Security, I need to help you describe your CISSP certification experience. When did you earn your CISSP, what domains did you focus on, and how have you maintained your certification?",
    "typeOfExperience": "certification"
  },
  {
    "id": "k1l2m3n4o5",
    "title": "Secret Security Clearance",
    "description": "Active Secret security clearance or ability to obtain and maintain clearance as required for access to classified information.",
    "initialMessage": "I'm helping you write about your security clearance for the Intelligence Analyst role at the Central Intelligence Agency. Can you describe your current clearance level, when it was granted, and any relevant background investigation experience?",
    "typeOfExperience": "other"
  },
  {
    "id": "m6n7o8p9q0",
    "title": "5+ Years Cybersecurity Experience",
    "description": "Minimum of five years of progressive experience in cybersecurity, network security, or information assurance roles.",
    "initialMessage": "For your Senior Security Engineer application at the National Security Agency, I'll help you describe your cybersecurity experience. Can you walk me through your career progression in cybersecurity - your roles, key responsibilities, and major accomplishments over the past five years?",
    "typeOfExperience": "experience"
  }
]

If no specialized experience requirements are found, return an empty array: []`,
  };
