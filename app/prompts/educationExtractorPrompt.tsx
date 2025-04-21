import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
const technicalRequirements =
  'Additionally, for each award, generate a random string that is 10 characters long, consisting only of letters and numbers (no special characters and no white space). Assign this string to the "id" attribute on the job object. Do not fill in any optional values on the returned object.';

export const educationExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `Given an array of resumes for the same person, extract their education, which may include degrees, licenses, and certifications. 

  Return an array of education objects, filling in as much information as you can.

  Do not invent any educational experiences. Only include degrees, certificates, and licenses that are mentioned in the resumes.
  Add a "title" attribute which is a short description of the education, such as "Bachelor of Science in Computer Science" or "Certified Project Manager".
    ${technicalRequirements} 
    An example would be: {id: "12fiwceiwe", title: "Bachelor of Science in Computer Science", degree: "Bachelor of Science", major: "Computer Science", school: "University of California, Davis", date: "2019", title: "Bachelor of Science in Computer Science", userConfirmed: false}.`,
};
