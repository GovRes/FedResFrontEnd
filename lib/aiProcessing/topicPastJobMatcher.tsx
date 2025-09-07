import { topicPastJobMatcherInstructions } from "@/lib/prompts/topicPastJobMatcherPrompt";
import { TopicType, PastJobType } from "@/lib/utils/responseSchemas";
import { sendMessages } from "@/lib/utils/api";

export const topicPastJobMatcher = async ({
  pastJobs,
  topic,
}: {
  topic: TopicType;
  pastJobs: PastJobType[];
}) => {
  const combinedInput = `${topicPastJobMatcherInstructions}

Past jobs data to analyze:
${JSON.stringify(pastJobs, null, 2)}
      
Job requirements topic with keywords:
${JSON.stringify(topic, null, 2)}

Please identify which past jobs are most relevant to this topic and explain the connections.`;

  try {
    const res = await sendMessages({
      input: combinedInput,
      name: "pastJobs",
      temperature: 0.1, // Consistent results for matching logic
    });

    console.log("Response from topic matcher:", res);
    return res.pastJobs || [];
  } catch (error) {
    console.error("Topic matching failed:", error);
    return [];
  }
};
