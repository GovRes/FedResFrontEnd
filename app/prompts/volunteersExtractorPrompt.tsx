import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
const technicalRequirements =
  'Additionally, for each volunteer experience, generate a random string that is 10 characters long, consisting only of letters and numbers (no special characters and no white space). Assign this string to the "id" attribute on the job object. Do not fill in any optional values on the returned object.';

export const volunteersExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `Given an array of resumes for the same person, extract each of their volunteer or community service experiences into a separate object. Return an array of volunteer objects, filling in as much information as you can, for title, organization, weekly hours, start date, end date, and key responsibilities. Do not attempt to provide any values for userJobQualifications.

    ${technicalRequirements} 
    An example would be: {id: "12fiwceiwe", title: "Tax Preparer", organization: "Your Taxes Done Right (non-profit)", hours: "15 hours per week", startDate: "2022-04-01", endDate: "2025-01-01", responsibilities: "Assist more than 250 individuals each year with filing their taxes
Stay abreast of new tax laws and advise peers of changes
Interpret tax laws for colleagues and clients to ensure accurate submission of information"}.`,
};
