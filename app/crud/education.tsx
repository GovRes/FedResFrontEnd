import { generateClient } from "aws-amplify/api";
import { EducationType } from "../utils/responseSchemas";

/**
 * Creates and saves multiple education records, checking if each one already exists.
 *
 * @param {Object[]} educationsInput - Array of education data objects
 * @param {string} educationsInput[].school - The school name
 * @param {string} educationsInput[].major - The major/field of study
 * @param {string} educationsInput[].degree - The degree earned
 * @param {string} educationsInput[].date - The date of completion
 * @param {string} educationsInput[].title - The title of the education
 * @param {string} [educationsInput[].gpa] - Optional GPA
 * @param {boolean} [educationsInput[].userConfirmed] - Whether the user confirmed this education
 * @param {string} userId - The user ID to associate with new education records
 * @returns {Promise<Object[]>} - The array of existing or newly created education records
 */
export async function createAndSaveEducations(
  educationsInput: EducationType[],
  userId: string
) {
  const client = generateClient();
  const results = [];

  // Process each education record in the input array
  for (const educationInput of educationsInput) {
    const { school, major, degree, date, title, gpa, userConfirmed } =
      educationInput;

    // Check if an education record with the same school, major, degree, and date exists
    const existingEducationsResult = await client.graphql({
      query: `
          query ListEducations($filter: ModelEducationFilterInput, $limit: Int) {
            listEducations(filter: $filter, limit: $limit) {
              items {
                id
                degree
                major
                school
                date
                title
                gpa
                userConfirmed
                userId
                createdAt
                updatedAt
              }
            }
          }
        `,
      variables: {
        filter: {
          and: [
            { school: { eq: school } },
            { major: { eq: major } },
            { degree: { eq: degree } },
            { date: { eq: date } },
          ],
        },
        limit: 1,
      },
      authMode: "userPool",
    });

    // Explicit type checking for the response
    if (
      "data" in existingEducationsResult &&
      existingEducationsResult.data?.listEducations?.items
    ) {
      const items = existingEducationsResult.data.listEducations.items;
      if (items.length > 0) {
        // Found existing education record, add to results
        results.push(items[0]);
        continue; // Skip to next education
      }
    }

    // No existing education found, create a new one
    const createEducationResult = await client.graphql({
      query: `
          mutation CreateEducation($input: CreateEducationInput!) {
            createEducation(input: $input) {
              id
              degree
              major
              school
              date
              title
              gpa
              userConfirmed
              userId
              createdAt
              updatedAt
            }
          }
        `,
      variables: {
        input: {
          degree,
          major,
          school,
          date,
          title,
          gpa,
          userConfirmed,
          userId,
        },
      },
      authMode: "userPool",
    });

    // Explicit type checking for the create response
    if (
      "data" in createEducationResult &&
      createEducationResult.data?.createEducation
    ) {
      results.push(createEducationResult.data.createEducation);
    } else {
      throw new Error(
        `Failed to create education record: ${school} - ${degree} in ${major} (${date})`
      );
    }
  }

  return results;
}

/**
 * Fetches all educations for the currently logged-in user.
 *
 * @returns {Promise<Object[]>} - Array of education objects belonging to the logged-in user
 */
export async function fetchUserEducations() {
  const client = generateClient();

  try {
    // Query all educations for the current user
    const userEducationsResult = await client.graphql({
      query: `
        query ListEducations($limit: Int) {
          listEducations(limit: $limit) {
            items {
              id
              degree
              major
              school
              date
              title
              gpa
            }
          }
        }
      `,
      variables: {
        limit: 1000, // Adjust based on expected number of educations
      },
      authMode: "userPool",
    });

    // Explicit type checking for the response
    if (
      "data" in userEducationsResult &&
      userEducationsResult.data?.listEducations?.items
    ) {
      return userEducationsResult.data.listEducations.items;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching user educations:", error);
    throw error;
  }
}
