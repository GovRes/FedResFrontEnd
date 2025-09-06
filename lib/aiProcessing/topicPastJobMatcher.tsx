import { topicPastJobMatcherPrompt } from "@/lib/prompts/topicPastJobMatcherPrompt";
import { TopicType, PastJobType } from "@/lib/utils/responseSchemas";
import { sendMessages } from "@/lib/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const topicPastJobMatcher = async ({
  pastJobs,
  topic,
}: {
  topic: TopicType;
  pastJobs: PastJobType[];
}) => {
  const messages = [
    topicPastJobMatcherPrompt,
    {
      role: "user" as const,
      content: `Past jobs: ${JSON.stringify(pastJobs)}
      
Job requirements topic with keywords: ${JSON.stringify(topic)}

Please identify which past jobs are most relevant to this topic and explain the connections.`,
    },
  ];

  try {
    const res = await sendMessages({
      messages,
      name: "pastJobs",
      // temperature: 0, // Consistent results for matching logic
      // maxTokens: 2000, // Adjust based on expected response size
    });

    console.log("Response from topic matcher:", res);
    return res.pastJobs || [];
  } catch (error) {
    console.error("Topic matching failed:", error);
    return [];
  }
};
