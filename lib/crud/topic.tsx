import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import { TopicType } from "../utils/responseSchemas";
import {
  validateAndSanitizeId,
  validateAndSanitizeObject,
  sanitizeOrError,
  sanitizeString,
  sanitizeStringArray,
} from "../utils/validators";
import {
  getRetryConfigForOperation,
  MATCHING_CONFIG,
} from "../utils/constants";
import { withRetry, RetryConfig } from "../utils/retry";

import { ApiResponse } from "../utils/api";
const READ_RETRY_CONFIG = getRetryConfigForOperation("read");
const WRITE_RETRY_CONFIG = getRetryConfigForOperation("write");
export const createOrFindSimilarTopics = async ({
  topics,
  jobId,
  retryConfig,
}: {
  topics: TopicType[];
  jobId: string;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse<{ topic: TopicType; isNew: boolean }[]>> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate that topics is a non-empty array
  if (!Array.isArray(topics) || topics.length === 0) {
    return {
      success: false,
      error: "Invalid topics: topics must be a non-empty array",
      statusCode: 400,
    };
  }

  // Validate and sanitize jobId
  const jobIdResult = sanitizeOrError(validateAndSanitizeId(jobId, "jobId"));
  if (!jobIdResult.success) return jobIdResult.error;
  const sanitizedJobId = jobIdResult.sanitized;

  // Sanitize each topic in the array
  const sanitizedTopics: TopicType[] = [];
  for (const topic of topics) {
    // Validate topic structure
    if (!topic || typeof topic !== "object") {
      return {
        success: false,
        error: "Invalid topic: each topic must be an object",
        statusCode: 400,
      };
    }

    // Sanitize topic object
    const topicResult = validateAndSanitizeObject(topic, "topic", {
      preserveFields: ["id", "createdAt", "updatedAt"],
      escapeHtml: false,
      maxLength: 5000,
    });
    if (!topicResult.isValid) {
      return {
        success: false,
        error: `Invalid topic object: ${topicResult.error}`,
        statusCode: 400,
      };
    }

    const sanitizedTopic = topicResult.sanitized;

    // Validate and sanitize required fields
    if (!sanitizedTopic.title || typeof sanitizedTopic.title !== "string") {
      return {
        success: false,
        error: "Each topic must have a title field",
        statusCode: 400,
      };
    }

    if (!sanitizedTopic.keywords || !Array.isArray(sanitizedTopic.keywords)) {
      return {
        success: false,
        error: "Each topic must have a keywords array",
        statusCode: 400,
      };
    }

    // Sanitize title
    const sanitizedTitle = sanitizeString(sanitizedTopic.title, {
      escapeHtml: false,
      maxLength: 300,
    });

    if (!sanitizedTitle || sanitizedTitle.length === 0) {
      return {
        success: false,
        error: "Topic title cannot be empty",
        statusCode: 400,
      };
    }

    // Sanitize keywords array
    const sanitizedKeywords = sanitizeStringArray(sanitizedTopic.keywords, {
      escapeHtml: false,
      maxLength: 100,
    });

    if (sanitizedKeywords.length === 0) {
      return {
        success: false,
        error: "Topic keywords array cannot be empty",
        statusCode: 400,
      };
    }

    // Sanitize optional description
    let sanitizedDescription = sanitizedTopic.description;
    if (sanitizedDescription) {
      sanitizedDescription = sanitizeString(sanitizedDescription, {
        escapeHtml: false,
        maxLength: 2000,
      });
    }

    sanitizedTopics.push({
      ...sanitizedTopic,
      title: sanitizedTitle,
      keywords: sanitizedKeywords,
      description: sanitizedDescription,
    });
  }

  const client = generateClient();

  try {
    const listQuery = buildQueryWithFragments(`
      query ListTopics {
        listTopics {
          items {
            ...TopicFields
          }
        }
      }
    `);

    const listResponse = await withRetry(async () => {
      return await client.graphql({
        query: listQuery,
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

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
    for (const topic of sanitizedTopics) {
      try {
        // Check for similar topics - now we also consider jobId
        const similarTopic = findSimilarTopic(
          existingTopics,
          topic.title,
          topic.keywords,
          sanitizedJobId
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
        const createMutation = buildQueryWithFragments(`
          mutation CreateTopic($input: CreateTopicInput!) {
            createTopic(input: $input) {
              ...TopicFields
            }
          }
        `);

        const createResponse = await withRetry(async () => {
          return await client.graphql({
            query: createMutation,
            variables: {
              input: {
                title: topic.title,
                keywords: topic.keywords,
                description: topic.description,
                jobId: sanitizedJobId,
              },
            },
            authMode: "userPool",
          });
        }, retryConfig || WRITE_RETRY_CONFIG);

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
        const errorResult = handleError("process", "Topic", error);
        errors.push(
          `Failed to process topic "${topic.title}": ${errorResult.error}`
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
    const errorResult = handleError(
      "create or find",
      "Topics",
      error,
      sanitizedJobId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
};

/**
 * Fetches all topics associated with a specific job
 * @param jobId - The ID of the job to fetch topics for
 * @returns An API response with an array of topics associated with the job
 */
export const fetchTopicsByJobId = async (
  jobId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<TopicType[]>> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize jobId
  const jobIdResult = sanitizeOrError(validateAndSanitizeId(jobId, "jobId"));
  if (!jobIdResult.success) return jobIdResult.error;
  const sanitizedJobId = jobIdResult.sanitized;

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query GetTopicsByJobId($jobId: ID!) {
        listTopics(filter: { jobId: { eq: $jobId } }) {
          items {
            ...TopicFields
          }
        }
      }
    `);

    const response = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: {
          jobId: sanitizedJobId,
        },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);
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
      data: topics || [],
      statusCode: 200,
    };
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "Topics for job",
      error,
      sanitizedJobId
    );
    return {
      success: false,
      ...errorResult,
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
    if (overlapPercentage >= MATCHING_CONFIG.TOPIC_SIMILARITY_THRESHOLD) {
      return topic;
    }
  }

  return null;
}
