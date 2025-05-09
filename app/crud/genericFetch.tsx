import { generateClient } from "aws-amplify/api";

/**
 * Generic function to fetch any model type from the database
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "pastJob")
 * @param {string} id - The ID of the record to fetch
 * @returns {Promise<Object>} - The fetched record data
 * @throws {Error} - If fetching fails or model type is unsupported
 */
export async function fetchModelRecord(modelName: string, id: string) {
  const client = generateClient();

  // List of valid model names based on your schema
  const validModelNames = [
    "Application",
    "Award",
    "Education",
    "Job",
    "Resume",
    "SpecializedExperience",
    "Topic",
    "pastJob",
    "pastJobQualification",
    "Volunteer",
    "AwardApplication",
    "EducationApplication",
    "ResumeApplication",
    "SpecializedExperienceApplication",
    "pastJobApplication",
    "VolunteerApplication",
    "pastJobpastJobQualification",
    "pastJobQualificationVolunteer",
  ];

  // Validate the model name
  if (!validModelNames.includes(modelName)) {
    throw new Error(
      `Invalid model name: ${modelName}. Must be one of: ${validModelNames.join(
        ", "
      )}`
    );
  }

  try {
    // Create the GraphQL query
    const query = `
      query Get${modelName}($id: ID!) {
        get${modelName}(id: $id) {
          id
          createdAt
          updatedAt
          ${getModelFields(modelName)}
        }
      }
    `;

    // Execute the GraphQL query
    const fetchResult = await client.graphql({
      query: query,
      variables: {
        id,
      },
      authMode: "userPool",
    });

    // Verify successful fetch
    if ("data" in fetchResult && fetchResult.data?.[`get${modelName}`]) {
      return fetchResult.data[`get${modelName}`];
    } else {
      throw new Error(`Failed to fetch ${modelName} record with ID: ${id}`);
    }
  } catch (error) {
    console.error(`Error fetching ${modelName} record:`, error);
    throw error;
  }
}

/**
 * Helper function to get model-specific fields for the GraphQL query
 *
 * @param {string} modelName - The name of the model
 * @returns {string} - String containing the model-specific fields
 */
function getModelFields(modelName: string) {
  // Define specific fields for each model type
  const modelFields: Record<string, string[]> = {
    Application: ["completedSteps", "jobId", "status", "userId"],
    Award: ["title", "date", "userId"],
    Education: [
      "degree",
      "major",
      "school",
      "date",
      "title",
      "gpa",
      "userConfirmed",
      "userId",
    ],
    Job: [
      "agencyDescription",
      "department",
      "duties",
      "evaluationCriteria",
      "qualificationsSummary",
      "requiredDocuments",
      "title",
      "usaJobsId",
    ],
    Resume: ["fileName", "userId"],
    SpecializedExperience: [
      "title",
      "description",
      "userConfirmed",
      "paragraph",
      "initialMessage",
      "userId",
    ],
    Topic: [
      "title",
      "keywords",
      "description",
      "evidence",
      "jobId",
      "question",
    ],
    pastJob: [
      "title",
      "organization",
      "startDate",
      "endDate",
      "hours",
      "gsLevel",
      "responsibilities",
      "userId",
    ],
    pastJobQualification: [
      "title",
      "description",
      "paragraph",
      "userConfirmed",
      "topicId",
      "userId",
    ],
    Volunteer: [
      "title",
      "organization",
      "startDate",
      "endDate",
      "hours",
      "gsLevel",
      "responsibilities",
      "userId",
    ],
    AwardApplication: ["awardId", "applicationId"],
    EducationApplication: ["educationId", "applicationId"],
    ResumeApplication: ["resumeId", "applicationId"],
    SpecializedExperienceApplication: [
      "specializedExperienceId",
      "applicationId",
    ],
    pastJobApplication: ["pastJobId", "applicationId"],
    VolunteerApplication: ["volunteerId", "applicationId"],
    pastJobpastJobQualification: ["pastJobId", "pastJobQualificationId"],
    pastJobQualificationVolunteer: ["pastJobQualificationId", "volunteerId"],
  };

  // Return fields joined as a string
  return modelFields[modelName]?.join("\n          ") || "";
}

/**
 * Function to fetch multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "pastJob")
 * @param {Object} filter - Optional filter object for the query
 * @param {number} limit - Optional limit for the number of records to fetch
 * @param {string} nextToken - Optional pagination token
 * @returns {Promise<{items: Object[], nextToken?: string}>} - Array of fetched records and next pagination token if available
 */
export async function listModelRecords(
  modelName: string,
  filter?: object,
  limit?: number,
  nextToken?: string
) {
  const client = generateClient();

  // List of valid model names based on your schema
  const validModelNames = [
    "Application",
    "Award",
    "Education",
    "Job",
    "Resume",
    "SpecializedExperience",
    "Topic",
    "pastJob",
    "pastJobQualification",
    "Volunteer",
    "AwardApplication",
    "EducationApplication",
    "ResumeApplication",
    "SpecializedExperienceApplication",
    "pastJobApplication",
    "VolunteerApplication",
    "pastJobPastJobQualification",
    "pastJobQualificationVolunteer",
  ];

  // Validate the model name
  if (!validModelNames.includes(modelName)) {
    throw new Error(
      `Invalid model name: ${modelName}. Must be one of: ${validModelNames.join(
        ", "
      )}`
    );
  }

  try {
    // Create the GraphQL query
    const query = `
      query List${modelName}s($filter: Model${modelName}FilterInput, $limit: Int, $nextToken: String) {
        list${modelName}s(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            createdAt
            updatedAt
            ${getModelFields(modelName)}
          }
          nextToken
        }
      }
    `;

    // Execute the GraphQL query
    const listResult = await client.graphql({
      query: query,
      variables: {
        filter,
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    // Verify successful fetch
    if ("data" in listResult && listResult.data?.[`list${modelName}s`]) {
      return {
        items: listResult.data[`list${modelName}s`].items,
        nextToken: listResult.data[`list${modelName}s`].nextToken,
      };
    } else {
      throw new Error(`Failed to list ${modelName} records`);
    }
  } catch (error) {
    console.error(`Error listing ${modelName} records:`, error);
    throw error;
  }
}

/**
 * Example usage:
 *
 * // Fetch a single education record
 * const education = await fetchModelRecord("Education", "abc123");
 *
 * // List all pastJob records for a specific user
 * const { items: userJobs, nextToken } = await listModelRecords("pastJob", { userId: { eq: "user123" } }, 10);
 *
 * // Fetch the next page of results
 * const { items: moreJobs } = await listModelRecords("pastJob", { userId: { eq: "user123" } }, 10, nextToken);
 */
