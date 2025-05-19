import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
const technicalRequirements =
  'Additionally, for each job, generate a random string that is 10 characters long, consisting only of letters and numbers (no special characters and no white space). Assign this string to the "id" attribute on the job object. Do not fill in any optional values on the returned object.';

export const pastJobsExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `Given an array of resumes for the same person, extract each of their jobs into a separate object. Return an array of job objects, filling in as much information as you can, for title, organization, weekly hours, start date, end date, and key responsibilities. Include GS level for any federal jobs. Set the attribute "type" to "PastJob". Do not attempt to provide any values for qualifications.

  Degree programs like a high school diploma or a bachelors degree do not count as jobs. Do not include them in the returned array. If you are unsure if a job is a degree program or not, do not include it in the returned array.
    ${technicalRequirements} 
    An example would be: {id: "12fiwceiwe", title: "Head of Engineering", organization: "Roundtable.org", hours: "40-60 hours per week", startDate: "2022-04-01", endDate: "2025-01-01", responsibilities: "Collaborated with internal clients to create and maintain a website that sells online courses. This includes a scheduling and content management administration panel, sales reports, user profile management, and more. Led an international team to successful completion of many major projects, including launching a subscription-based membership product."}.`,
};
