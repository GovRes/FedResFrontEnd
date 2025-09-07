import { jobDescriptionKeywordFinderInstructions } from "@/lib/prompts/jobDescriptionKeywordFinder";
import { JobType } from "@/lib/utils/responseSchemas";
import { formatJobDescriptionForAI } from "@/lib/utils/aiInteractionUtils";
import { sendMessages } from "@/lib/utils/api";

export const jobDescriptionKeywordFinder = async ({
  job,
}: {
  job: JobType;
}) => {
  const jobDescription = formatJobDescriptionForAI({ job });

  const combinedInput = `${jobDescriptionKeywordFinderInstructions}

Job Description to analyze:
${jobDescription}`;

  let res = await sendMessages({
    input: combinedInput,
    name: "keywords",
    temperature: 0.1, // Low temperature for consistent keyword extraction
  });

  const result = res.keywords as Array<string>;
  return result;
};
