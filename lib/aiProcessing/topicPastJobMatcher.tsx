import { topicPastJobMatcherInstructions } from "@/lib/prompts/topicPastJobMatcherPrompt";
import { TopicType, PastJobType } from "@/lib/utils/responseSchemas";
import { sendMessages } from "@/lib/utils/api";

export const topicPastJobMatcher = async ({
  pastJobs,
  topics,
}: {
  topics: TopicType[]; // Changed from single topic to array
  pastJobs: PastJobType[];
}) => {
  console.log("=== topicPastJobMatcher BATCH DEBUG ===");
  console.log(`Processing ${topics.length} topics in a single batch`);

  // Validate topics array
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    console.error("❌ TOPICS ARRAY IS INVALID!");
    return [];
  }

  console.log(
    "Topics to process:",
    topics.map((t) => ({
      id: t.id,
      title: t.title,
    }))
  );

  console.log("Past jobs received:", pastJobs?.length || 0, "jobs");

  const pastJobsJson = JSON.stringify(pastJobs, null, 2);
  const topicsJson = JSON.stringify(topics, null, 2);

  console.log("Past jobs JSON length:", pastJobsJson.length, "characters");
  console.log("Topics JSON length:", topicsJson.length, "characters");
  console.log("Number of topics in batch:", topics.length);

  const combinedInput = `${topicPastJobMatcherInstructions}

Past jobs data to analyze:
${pastJobsJson}
      
Job requirements topics with keywords (PROCESS ALL TOPICS IN THIS BATCH):
${topicsJson}

Please identify which past jobs are most relevant to EACH topic in the array above and explain the connections. Process all ${topics.length} topics in a single response.`;

  console.log(
    "Combined input total length:",
    combinedInput.length,
    "characters"
  );
  console.log("================================");

  try {
    const res = await sendMessages({
      input: combinedInput,
      name: "pastJobs",
      route: "/api/ai-topic-past-job-matcher",
      temperature: 0.1,
    });

    console.log("=== RAW BATCH RESPONSE ===");
    console.log(res);
    console.log("=== END RAW BATCH RESPONSE ===");

    return res.pastJobs || [];
  } catch (error) {
    console.error("Batch topic matching failed:", error);
    return [];
  }
};
