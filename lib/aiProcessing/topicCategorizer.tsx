import {
  topicsCategorizerInstructions,
  topicsCategorizerCheckerInstructions,
} from "@/lib/prompts/topicsCategorizer";
import { JobType } from "@/lib/utils/responseSchemas";
import { sendMessages } from "@/lib/utils/api";
import { TopicType } from "@/lib/utils/responseSchemas";
import { formatJobDescriptionForAI } from "@/lib/utils/aiInteractionUtils";

export const topicsCategorizer = async ({
  job,
  keywords,
}: {
  job: JobType;
  keywords?: Array<string>;
}) => {
  const jobDescription = formatJobDescriptionForAI({ job });

  const userRequest = `Job description: ${jobDescription}. Key words: ${
    Array.isArray(keywords) ? keywords.join(", ") : ""
  }`;

  const combinedInput = `${topicsCategorizerInstructions}

${userRequest}`;

  console.log("Sending request to topics categorizer...");

  let res = await sendMessages({
    input: combinedInput,
    name: "topics",
    temperature: 0.3,
    route: "/api/ai-topic-categorizer",
  });

  console.log("topicsCategorizer res:", res.topics);

  if (res && res.topics && res.topics.length > 0) {
    console.log("Running checker on topics...");

    const checkerInputWithTopics = `${topicsCategorizerCheckerInstructions}

Original request: ${userRequest}

Generated topics to review:
${JSON.stringify(res.topics, null, 2)}

Please review these topics and return an improved version with duplicates removed or combined.`;

    let checkerRes = await sendMessages({
      input: checkerInputWithTopics,
      name: "topics",
      temperature: 0.1,
    });

    console.log("Checker result:", checkerRes.topics);

    if (checkerRes && checkerRes.topics && Array.isArray(checkerRes.topics)) {
      return checkerRes.topics as TopicType[];
    } else {
      console.warn("Checker didn't return valid topics, using original result");
      return res.topics as TopicType[];
    }
  }

  return res.topics as TopicType[];
};
