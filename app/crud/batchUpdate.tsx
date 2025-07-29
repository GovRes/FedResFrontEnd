// Client-side utility function using GraphQL approach matching your genericUpdate pattern
import { generateClient } from "aws-amplify/api";

export async function updateExistingEducationTypes(
  defaultType: string = "education"
) {
  const client = generateClient();

  try {
    // First, fetch all Education records with null, empty, or undefined type
    const listQuery = `
      query ListEducations {
        listEducations {
          items {
            id
            type
          }
        }
      }
    `;

    const listResult = await client.graphql({
      query: listQuery,
      authMode: "userPool",
    });

    if (!("data" in listResult) || !listResult.data?.listEducations?.items) {
      throw new Error("Failed to fetch Education records");
    }

    // Filter records that need updating (null, empty, or undefined type)
    const educationsToUpdate = listResult.data.listEducations.items.filter(
      (education: any) => !education.type || education.type === ""
    );

    if (educationsToUpdate.length === 0) {
      console.log("No Education records found to update");
      return { success: true, updated: 0 };
    }

    console.log(
      `Found ${educationsToUpdate.length} Education records to update`
    );

    // Update records using GraphQL mutations (matching your approach)
    const updateMutation = `
      mutation UpdateEducation($input: UpdateEducationInput!) {
        updateEducation(input: $input) {
          id
          type
          createdAt
          updatedAt
        }
      }
    `;

    const results = [];
    const batchSize = 25; // Process in batches to avoid overwhelming the API

    for (let i = 0; i < educationsToUpdate.length; i += batchSize) {
      const batch = educationsToUpdate.slice(i, i + batchSize);

      const batchPromises = batch.map(async (education: any) => {
        try {
          const updateResult = await client.graphql({
            query: updateMutation,
            variables: {
              input: {
                id: education.id,
                type: defaultType,
              },
            },
            authMode: "userPool",
          });

          if ("data" in updateResult && updateResult.data?.updateEducation) {
            return updateResult.data.updateEducation;
          } else {
            throw new Error(
              `Failed to update Education record with ID: ${education.id}`
            );
          }
        } catch (error) {
          console.error(
            `Failed to update Education with ID ${education.id}:`,
            error
          );
          return null; // Continue with other updates even if one fails
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((result) => result !== null));
    }

    console.log(`Successfully updated ${results.length} Education records`);
    return { success: true, updated: results.length };
  } catch (error) {
    console.error("Error updating education types:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

// Usage example:
// await updateExistingEducationTypes("education");
