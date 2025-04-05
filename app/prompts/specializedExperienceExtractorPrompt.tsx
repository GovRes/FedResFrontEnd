import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
const technicalRequirements =
  'Additionally, for each specialized experience, generate a random string that is 10 characters long, consisting only of letters and numbers (no special characters and no white space). Assign this string to the "id" attribute on the specialized experience object. Do not fill in any optional values on the returned object.';

export const specializedExperienceExtractorPrompt: ChatCompletionSystemMessageParam =
  {
    //tk should it be based just on the qualifications summary? or more of the job?
    role: "system",
    content: `Given a summary of qualifications for a job, return the specialized experience required to apply for the job. Return only specialized experience, not general qualifications. These specialized experiences may be a degree program, licensure, experience with a particular kind of software, etc. In addition to a short name of the experience, return a sentence or two describing it, and a question that you would ask a user to begin helping them write a paragraph about that experience. The question should include the job title and department as well as the name of the specialized experience.
    ${technicalRequirements} 
    An example would be: {id: "12fiwceiwe", title: "BS in Computer Science", description: "Bachelor's degree in Computer Science or a related field.", initialMessage: "I'm going to help you write a paragraph about getting your BS in computer science. We will include this in your application to become an IT security engineer at the Department of Defense. Can you tell me a bit about your undergraduate degree experience?"}.`,
  };
