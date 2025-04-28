import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { SpecializedExperienceType } from "../utils/responseSchemas";

export const createAndSaveSpecializedExperiences = async ({
  specializedExperiences,
  userResumeId,
  userId,
}: {
  specializedExperiences: SpecializedExperienceType[];
  userResumeId: string;
  userId: string;
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
    if (!specializedExperiences.length || !userResumeId || !userId) {
      throw new Error(
        "specializedExperiences array, userResumeId, and userId are required parameters"
      );
    }

    // Create an array to store the results
    const results = [];

    // Process each specialized experience sequentially
    for (const experience of specializedExperiences) {
      // Validate each experience has required fields
      if (
        !experience.title ||
        !experience.description ||
        !experience.initialMessage
      ) {
        console.error("Skipping invalid experience:", experience);
        continue;
      }

      // Create the SpecializedExperience record
      const specializedExperienceResponse = await client.graphql({
        query: `
          mutation CreateSpecializedExperience($input: CreateSpecializedExperienceInput!) {
            createSpecializedExperience(input: $input) {
              id
              title
              description
              initialMessage
              paragraph
              userConfirmed
              userId
            }
          }
        `,
        variables: {
          input: {
            title: experience.title,
            description: experience.description,
            initialMessage: experience.initialMessage,
            paragraph: experience.paragraph || null,
            userConfirmed: experience.userConfirmed || false,
            userId,
          },
        },
        authMode: "userPool",
      });

      if (!("data" in specializedExperienceResponse)) {
        console.error("Unexpected response format for experience:", experience);
        continue;
      }

      const specializedExperience =
        specializedExperienceResponse.data.createSpecializedExperience;

      // Create the join table record
      const joinResponse = await client.graphql({
        query: `
          mutation CreateSpecializedExperienceUserResume($input: CreateSpecializedExperienceUserResumeInput!) {
            createSpecializedExperienceUserResume(input: $input) {
              id
              specializedExperienceId
              userResumeId
            }
          }
        `,
        variables: {
          input: {
            specializedExperienceId: specializedExperience.id,
            userResumeId: userResumeId,
          },
        },
        authMode: "userPool",
      });

      if (!("data" in joinResponse)) {
        console.error(
          "Failed to create join record for experience:",
          specializedExperience.id
        );
        continue;
      }

      // Add the result to our array
      results.push({
        specializedExperience,
        specializedExperienceUserResume:
          joinResponse.data.createSpecializedExperienceUserResume,
      });
    }

    // Return all results
    return results;
  } catch (error) {
    console.error("Error creating SpecializedExperiences:", error);
    throw error;
  }
};
