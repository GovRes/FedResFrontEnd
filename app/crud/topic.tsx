import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { TopicType } from "../utils/responseSchemas";

export const createOrFindSimilarTopics = async ({
  topics,
  jobId,
}: {
  topics: TopicType[];
  jobId: string; // Added jobId parameter
}) => {
  try {
    // Verify user is authenticated
    const session = await fetchAuthSession();
    if (!session.tokens) {
      throw new Error("No valid authentication session found");
    }
  } catch (error) {
    console.error("No user is signed in");
    return;
  }

  const client = generateClient();
  try {
    // Validate required parameters
    if (!topics || !topics.length) {
      throw new Error("topics array is required and must not be empty");
    }

    // Validate jobId is provided
    if (!jobId) {
      throw new Error("jobId is required");
    }

    // First, list all topics to check for similarity - do this once for efficiency
    const listResponse = await client.graphql({
      query: `
        query ListTopics {
          listTopics {
            items {
              id
              title
              keywords
              description
              evidence
              question
              jobId
            }
          }
        }
      `,
      authMode: "userPool",
    });

    if (!("data" in listResponse)) {
      throw new Error("Unexpected response format from GraphQL operation");
    }

    const existingTopics = listResponse.data.listTopics.items;
    const results = [];

    // Process each topic sequentially
    for (const topic of topics) {
      // Validate each topic has required fields
      if (!topic.title || !topic.keywords || !topic.keywords.length) {
        console.error("Skipping invalid topic:", topic);
        continue;
      }

      // Check for similar topics - now we also consider jobId
      const similarTopic = findSimilarTopic(
        existingTopics,
        topic.title,
        topic.keywords,
        jobId // Pass jobId to the similarity check function
      );

      if (similarTopic) {
        // Found similar topic, add it to results
        results.push({
          topic: similarTopic,
          isNew: false,
        });
        continue;
      }

      // No similar topic found, create a new one with the jobId
      const createResponse = await client.graphql({
        query: `
          mutation CreateTopic($input: CreateTopicInput!) {
            createTopic(input: $input) {
              id
              title
              keywords
              description
              evidence
              question
              jobId
            }
          }
        `,
        variables: {
          input: {
            title: topic.title,
            keywords: topic.keywords,
            description: topic.description,
            evidence: topic.evidence,
            question: topic.question,
            jobId: jobId, // Include jobId in the creation input
          },
        },
        authMode: "userPool",
      });

      if (!("data" in createResponse)) {
        console.error("Failed to create topic:", topic);
        continue;
      }

      // Add newly created topic to existing topics list for future comparisons
      const newTopic = createResponse.data.createTopic;
      existingTopics.push(newTopic);

      // Add to results
      results.push({
        topic: newTopic,
        isNew: true,
      });
    }

    return results;
  } catch (error) {
    console.error("Error creating or finding Topics:", error);
    throw error;
  }
};
/**
 * Fetches all topics associated with a specific job
 * @param jobId - The ID of the job to fetch topics for
 * @returns An array of topics associated with the job
 */
export const fetchTopicsByJobId = async (
  jobId: string
): Promise<TopicType[]> => {
  try {
    // Verify user is authenticated
    const session = await fetchAuthSession();
    if (!session.tokens) {
      throw new Error("No valid authentication session found");
    }
  } catch (error) {
    console.error("No user is signed in");
    throw new Error("Authentication required");
  }

  // Validate jobId
  if (!jobId) {
    throw new Error("jobId is required");
  }

  const client = generateClient();

  try {
    // Query for topics with the specified jobId
    const response = await client.graphql({
      query: `
        query GetTopicsByJobId($jobId: ID!) {
          listTopics(filter: { jobId: { eq: $jobId } }) {
            items {
              id
              title
              keywords
              description
              evidence
              question
              jobId
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: {
        jobId,
      },
      authMode: "userPool",
    });

    if (!("data" in response)) {
      throw new Error("Unexpected response format from GraphQL operation");
    }

    return response.data.listTopics.items;
  } catch (error) {
    console.error(`Error fetching topics for job ${jobId}:`, error);
    throw error;
  }
};
// Updated helper function to find similar topics that also considers jobId
function findSimilarTopic(
  existingTopics: TopicType[],
  title: string,
  newKeywords: string[],
  jobId: string // Added jobId parameter
) {
  // First filter by exact title match AND matching jobId
  const titleAndJobMatches = existingTopics.filter(
    (topic) =>
      topic.title.toLowerCase() === title.toLowerCase() && topic.jobId === jobId // Only consider topics with the same jobId
  );

  if (titleAndJobMatches.length === 0) {
    return null;
  }

  // For topics with matching titles and jobId, check keyword overlap
  for (const topic of titleAndJobMatches) {
    const existingKeywords = topic.keywords.map((k) => k.toLowerCase());
    const normalizedNewKeywords = newKeywords.map((k) => k.toLowerCase());

    // Calculate overlap percentage
    let matchCount = 0;
    for (const keyword of normalizedNewKeywords) {
      if (existingKeywords.includes(keyword)) {
        matchCount++;
      }
    }

    // Calculate overlap percentage in both directions to handle different array sizes
    const overlapPercentage1 = matchCount / normalizedNewKeywords.length;
    const overlapPercentage2 = matchCount / existingKeywords.length;

    // Use the smaller percentage to ensure at least 80% of both sets match
    const overlapPercentage = Math.min(overlapPercentage1, overlapPercentage2);

    // Check if overlap is at least 80%
    if (overlapPercentage >= 0.8) {
      return topic;
    }
  }

  return null;
}
