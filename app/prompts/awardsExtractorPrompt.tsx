import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
const technicalRequirements =
  'Additionally, for each award, generate a random string that is 10 characters long, consisting only of letters and numbers (no special characters and no white space). Assign this string to the "id" attribute on the job object. Do not fill in any optional values on the returned object.';

export const awardsExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `Given an array of resumes for the same person, extract their awards and achievements. 

  Awards and achievements will probably be in a section of the resume with a heading like "Awards", "Achievements", or "Honors"
  
  Return an array of award objects, filling in as much information as you can for title or name of the award, and the year or range of years it was awarded.

  Do not invent any awards or achievements. Only include awards that are mentioned in the resumes.

  Degree programs like a high school diploma or a bachelors degree do not count as awards. Do not include them in the returned array.
    ${technicalRequirements} 
    An example would be: {id: "12fiwceiwe", title: "Sustained Outstanding Performance Ratings", date: "2018-2022"}.`,
};
