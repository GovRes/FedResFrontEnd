import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { SpecializedExperienceType } from "../utils/responseSchemas";

export const createAndSaveSpecializedExperiences = async ({
  specializedExperiences,
  applicationId,
  userId,
}: {
  specializedExperiences: SpecializedExperienceType[];
  applicationId: string;
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
    if (!specializedExperiences.length || !applicationId || !userId) {
      throw new Error(
        "specializedExperiences array, applicationId, and userId are required parameters"
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
              typeOfExperience
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
            typeOfExperience: experience.typeOfExperience || null,
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
          mutation CreateSpecializedExperienceApplication($input: CreateSpecializedExperienceApplicationInput!) {
            createSpecializedExperienceApplication(input: $input) {
              id
              specializedExperienceId
              applicationId
            }
          }
        `,
        variables: {
          input: {
            specializedExperienceId: specializedExperience.id,
            applicationId: applicationId,
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
        specializedExperienceApplication:
          joinResponse.data.createSpecializedExperienceApplication,
      });
    }

    // Return all results
    return results;
  } catch (error) {
    console.error("Error creating SpecializedExperiences:", error);
    throw error;
  }
};

export const updateSpecializedExperience = async ({
  specializedExperienceId,
  title,
  description,
  initialMessage,
  paragraph,
  userConfirmed,
  typeOfExperience,
  userId,
}: {
  specializedExperienceId: string;
  title?: string;
  description?: string;
  initialMessage?: string;
  paragraph?: string | null;
  userConfirmed?: boolean;
  typeOfExperience?: string | null;
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
    throw new Error("Authentication required");
  }

  // Validate required parameters
  if (!specializedExperienceId || !userId) {
    throw new Error(
      "specializedExperienceId and userId are required parameters"
    );
  }

  const client = generateClient();
  try {
    // Prepare the input object with only the fields that are provided
    const updateInput: Record<string, any> = {
      id: specializedExperienceId,
    };

    // Add optional fields if they are provided
    if (title !== undefined) updateInput.title = title;
    if (description !== undefined) updateInput.description = description;
    if (initialMessage !== undefined)
      updateInput.initialMessage = initialMessage;
    if (paragraph !== undefined) updateInput.paragraph = paragraph;
    if (userConfirmed !== undefined) updateInput.userConfirmed = userConfirmed;
    if (typeOfExperience !== undefined)
      updateInput.typeOfExperience = typeOfExperience;

    // Execute the update mutation
    const response = await client.graphql({
      query: `
        mutation UpdateSpecializedExperience($input: UpdateSpecializedExperienceInput!) {
          updateSpecializedExperience(input: $input) {
            id
            title
            description
            initialMessage
            paragraph
            userConfirmed
            typeOfExperience
            userId
          }
        }
      `,
      variables: {
        input: updateInput,
      },
      authMode: "userPool",
    });

    if (!("data" in response)) {
      throw new Error("Unexpected response format");
    }

    return response.data.updateSpecializedExperience;
  } catch (error) {
    console.error("Error updating SpecializedExperience:", error);
    throw error;
  }
};
