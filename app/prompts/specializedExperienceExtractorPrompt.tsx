import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
const technicalRequirements =
  'Additionally, for each specialized experience, generate a random string that is 10 characters long, consisting only of letters and numbers (no special characters and no white space). Assign this string to the "id" attribute on the specialized experience object. Do not fill in any optional values on the returned object.';

export const specializedExperienceExtractorPrompt: ChatCompletionSystemMessageParam =
  {
    role: "system",
    content: `Given a summary of qualifications for a job, return the specialized experience required to apply for the job. Return only specialized experience, not general qualifications. ${technicalRequirements}`,
  };
