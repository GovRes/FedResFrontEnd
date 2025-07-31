import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
import { agencies } from "@/app/utils/usaJobsCodes";
export const usaJobObjectExtractorPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `Given a USA jobs object, extract the following details and return them in a JSON object:
     agencyDescription: information about the agency;
      department: the department of the job, which may be a two-letter code. If it is a code, it should be expanded to the full name using the provided mapping;
      duties: a summary of the job duties, which may be a long text;
      evaluationCriteria: the evaluation criteria for the job, which may be a long text;
      qualificationsSummary: a summary of the qualifications required for the job, which may be a long text;
      requiredDocuments: the documents required for the job, which may be a long text;
      title: the job title;
      usaJobsId: this will be a number identified as usajobsControlNumber. Convert it to a string if necessary.

      IT IS IMPERATIVE THAT YOU DO NOT INVENT INFORMATION. If you are not sure, leave it blank or null.
        Here is the mapping of agency codes to full names:
      ${JSON.stringify(agencies, null, 2)}
  `,
};
