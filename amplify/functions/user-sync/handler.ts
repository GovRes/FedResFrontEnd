import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { userAttributes } = event.request;

  try {
    // Create user record with all available Cognito data
    const now = new Date().toISOString();

    await docClient.send(
      new PutCommand({
        TableName: process.env.USER_TABLE_NAME,
        Item: {
          id: crypto.randomUUID(), // Generate new UUID for database
          email: userAttributes.email,
          givenName: userAttributes.given_name || "",
          familyName: userAttributes.family_name || "",
          groups: ["users"],
          isActive: true,
          createdAt: now,
          updatedAt: now,
          // Set owner field for authorization - this is what Amplify uses for allow.owner()
          owner: userAttributes.sub,
        },
      })
    );

    console.log(`User ${userAttributes.sub} created in database`);
  } catch (error) {
    console.error("Error creating user in database:", error);
    throw error; // Fail the sign-up if database creation fails
  }

  return event;
};
