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
  console.log("=== topicPastJobMatcher DEBUG ===");

  // Check if topic is valid
  console.log("Topic raw value:", topic);
  console.log("Topic is undefined?", topic === undefined);
  console.log("Topic is null?", topic === null);
  console.log("Topic type:", typeof topic);

  if (!topic) {
    console.error("❌ TOPIC IS NULL OR UNDEFINED!");
    return [];
  }

  console.log("Topic properties:", {
    id: topic.id,
    title: topic.title,
    description: topic.description,
    keywords: topic.keywords,
    hasId: !!topic.id,
    hasTitle: !!topic.title,
  });

  console.log("Past jobs received:", pastJobs?.length || 0, "jobs");

  const pastJobsJson = JSON.stringify(pastJobs, null, 2);
  const topicJson = JSON.stringify(topic, null, 2);

  console.log("Past jobs JSON length:", pastJobsJson.length, "characters");
  console.log("Topic JSON length:", topicJson.length, "characters");
  console.log("Topic JSON content:", topicJson);
  console.log("First past job sample:", pastJobs[0]?.title || "NO JOBS");

  const combinedInput = `${topicPastJobMatcherInstructions}

Past jobs data to analyze:
${pastJobsJson}
      
Job requirements topic with keywords:
${topicJson}

Please identify which past jobs are most relevant to this topic and explain the connections.`;

  console.log(
    "Combined input total length:",
    combinedInput.length,
    "characters"
  );
  console.log(
    "Topic section of combined input:",
    combinedInput.substring(
      combinedInput.indexOf("Job requirements topic"),
      combinedInput.indexOf("Job requirements topic") + 500
    )
  );
  console.log("================================");

  try {
    const res = await sendMessages({
      input: combinedInput,
      name: "pastJobs",
      route: "/api/ai-topic-past-job-matcher",
      temperature: 0.1,
    });

    console.log("=== RAW RESPONSE ===");
    console.log(res);
    console.log("=== END RAW RESPONSE ===");

    return res.pastJobs || [];
  } catch (error) {
    console.error("Topic matching failed:", error);
    return [];
  }
};
