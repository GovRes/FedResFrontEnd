import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { TopicType } from "../utils/responseSchemas";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export const createOrFindSimilarTopics = async ({
  topics,
  jobId,
}: {
  topics: TopicType[];
  jobId: string;
}): Promise<ApiResponse<{ topic: TopicType; isNew: boolean }[]>> => {
  // Verify user is authenticated
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "Authentication required",
      statusCode: 401,
    };
  }

  // Validate required parameters
  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return {
      success: false,
      error: "topics array is required and must not be empty",
      statusCode: 400,
    };
  }

  // Validate jobId is provided
  if (!jobId || typeof jobId !== "string" || jobId.trim() === "") {
    return {
      success: false,
      error: "jobId is required and must be a non-empty string",
      statusCode: 400,
    };
  }

  // Validate each topic has required fields
  const invalidTopics = topics.filter(
    (topic) =>
      !topic.title ||
      !topic.keywords ||
      !Array.isArray(topic.keywords) ||
      topic.keywords.length === 0
  );

  if (invalidTopics.length > 0) {
    return {
      success: false,
      error: `${invalidTopics.length} topics are missing required fields (title, keywords)`,
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
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
              jobId
              createdAt
              updatedAt
            }
          }
        }
      `,
      authMode: "userPool",
    });

    if (!("data" in listResponse)) {
      return {
        success: false,
        error: "Unexpected response format from GraphQL operation",
        statusCode: 500,
      };
    }

    const existingTopics = listResponse.data.listTopics.items;
    const results: { topic: TopicType; isNew: boolean }[] = [];
    const errors: string[] = [];

    // Process each topic sequentially
    for (const topic of topics) {
      try {
        // Check for similar topics - now we also consider jobId
        const similarTopic = findSimilarTopic(
          existingTopics,
          topic.title,
          topic.keywords,
          jobId
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
                jobId
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            input: {
              title: topic.title,
              keywords: topic.keywords,
              description: topic.description,
              jobId: jobId,
            },
          },
          authMode: "userPool",
        });

        if (!("data" in createResponse) || !createResponse.data.createTopic) {
          errors.push(`Failed to create topic: ${topic.title}`);
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
      } catch (error) {
        console.error(`Error processing topic "${topic.title}":`, error);
        errors.push(
          `Failed to process topic "${topic.title}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Determine success status
    const hasResults = results.length > 0;
    const hasErrors = errors.length > 0;
    const allFailed = results.length === 0 && errors.length > 0;

    if (allFailed) {
      return {
        success: false,
        error: `Failed to process all topics: ${errors.join(", ")}`,
        statusCode: 500,
      };
    }

    return {
      success: hasResults,
      data: results,
      statusCode: hasResults ? 200 : 500,
      ...(hasErrors && {
        error: `${errors.length} topics failed to process: ${errors.join(", ")}`,
      }),
    };
  } catch (error) {
    console.error("Error creating or finding Topics:", error);
    return {
      success: false,
      error: `Failed to process topics: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
};

/**
 * Fetches all topics associated with a specific job
 * @param jobId - The ID of the job to fetch topics for
 * @returns An API response with an array of topics associated with the job
 */
export const fetchTopicsByJobId = async (
  jobId: string
): Promise<ApiResponse<TopicType[]>> => {
  // Verify user is authenticated
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "Authentication required",
      statusCode: 401,
    };
  }

  // Validate jobId
  if (!jobId || typeof jobId !== "string" || jobId.trim() === "") {
    return {
      success: false,
      error: "jobId is required and must be a non-empty string",
      statusCode: 400,
    };
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
      return {
        success: false,
        error: "Unexpected response format from GraphQL operation",
        statusCode: 500,
      };
    }

    const topics = response.data.listTopics.items;

    return {
      success: true,
      data: topics,
      statusCode: 200,
    };
  } catch (error) {
    console.error(`Error fetching topics for job ${jobId}:`, error);
    return {
      success: false,
      error: `Failed to fetch topics for job ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
};

// Updated helper function to find similar topics that also considers jobId
function findSimilarTopic(
  existingTopics: TopicType[],
  title: string,
  newKeywords: string[],
  jobId: string
): TopicType | null {
  // First filter by exact title match AND matching jobId
  const titleAndJobMatches = existingTopics.filter(
    (topic) =>
      topic.title.toLowerCase() === title.toLowerCase() && topic.jobId === jobId
  );

  if (titleAndJobMatches.length === 0) {
    return null;
  }

  // For topics with matching titles and jobId, check keyword overlap
  for (const topic of titleAndJobMatches) {
    if (!topic.keywords || !Array.isArray(topic.keywords)) {
      continue;
    }

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

/**
 * Example usage:
 *
 * // Create or find similar topics for a job
 * const topicsResult = await createOrFindSimilarTopics({
 *   topics: [
 *     {
 *       title: "React Development",
 *       keywords: ["React", "JavaScript", "Frontend"],
 *       description: "Frontend development with React",
 *       evidence: "Built multiple React applications"
 *     }
 *   ],
 *   jobId: "job123"
 * });
 *
 * if (topicsResult.success && topicsResult.data) {
 *   console.log("Topics processed:", topicsResult.data);
 *   topicsResult.data.forEach(result => {
 *     console.log(`Topic: ${result.topic.title}, New: ${result.isNew}`);
 *   });
 * } else {
 *   console.error(`Error ${topicsResult.statusCode}:`, topicsResult.error);
 * }
 *
 * // Fetch topics for a specific job
 * const fetchResult = await fetchTopicsByJobId("job123");
 * if (fetchResult.success && fetchResult.data) {
 *   console.log("Job topics:", fetchResult.data);
 * } else {
 *   console.error(`Error ${fetchResult.statusCode}:`, fetchResult.error);
 * }
 */
