/**
 * Utility functions for model operations
 * This file contains shared functions used across generic database operations
 */

/**
 * List of valid model names based on your schema
 */
export const validModelNames = [
  "Application",
  "Award",
  "Education",
  "Job",
  "Resume",
  "SpecializedExperience",
  "Topic",
  "PastJob",
  "Qualification",
  "AwardApplication",
  "EducationApplication",
  "ResumeApplication",
  "SpecializedExperienceApplication",
  "PastJobApplication",
  "PastJobQualification",
];

/**
 * Model field definitions for GraphQL operations
 * Maps each model name to its list of fields
 */
export const modelFields: Record<string, string[]> = {
  Application: ["completedSteps", "jobId", "status", "userId"],
  Award: ["title", "date", "userId"],
  Education: [
    "date",
    "degree",
    "gpa",
    "major",
    "school",
    "schoolCity",
    "schoolState",
    "title",
    "userConfirmed",
    "userId",
  ],
  Job: [
    "agencyDescription",
    "department",
    "duties",
    "evaluationCriteria",
    "qualificationsSummary",
    "questionnaire",
    "requiredDocuments",
    "title",
    "usaJobsId",
    // Nested topics with their qualifications
    `topics {
      items {
        id
        title
        keywords
        description
        evidence
        createdAt
        updatedAt
        qualifications {
          items {
            id
            title
            description
            paragraph
            question
            userConfirmed
            userId
            createdAt
            updatedAt
          }
        }
      }
    }`,
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
  Topic: ["title", "keywords", "description", "evidence", "jobId"],
  PastJob: [
    "endDate",
    "gsLevel",
    "hours",
    "organization",
    "organizationAddress",
    "responsibilities",
    "startDate",
    "supervisorMayContact",
    "supervisorName",
    "supervisorPhone",
    "title",
    "type",
    "userId",
  ],
  Qualification: [
    "title",
    "description",
    "paragraph",
    "question",
    "userConfirmed",
    "topicId",
    "userId",
  ],
  AwardApplication: ["awardId", "applicationId"],
  EducationApplication: ["educationId", "applicationId"],
  ResumeApplication: ["resumeId", "applicationId"],
  SpecializedExperienceApplication: [
    "specializedExperienceId",
    "applicationId",
  ],
  PastJobApplication: ["pastJobId", "applicationId"],
  PastJobQualification: ["pastJobId", "qualificationId"],
};

/**
 * Helper function to get model-specific fields for GraphQL queries
 *
 * @param {string} modelName - The name of the model
 * @returns {string} - String containing the model-specific fields
 */
export function getModelFields(modelName: string) {
  // Return fields joined as a string
  return modelFields[modelName]?.join("\n          ") || "";
}

/**
 * Validates if a model name is supported
 *
 * @param {string} modelName - The name of the model to validate
 * @throws {Error} - If model name is not supported
 */
export function validateModelName(modelName: string) {
  if (!validModelNames.includes(modelName)) {
    throw new Error(
      `Invalid model name: ${modelName}. Must be one of: ${validModelNames.join(
        ", "
      )}`
    );
  }
}
