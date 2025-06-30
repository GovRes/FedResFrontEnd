import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { userAttributes } = event.request;

  try {
    // Create user record in your database
    await docClient.send(
      new PutCommand({
        TableName: process.env.USER_TABLE_NAME,
        Item: {
          id: userAttributes.sub, // Use the user's unique ID
          email: userAttributes.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Add default group as 'users'
          groups: ["users"],
          // Add other default fields as needed
          firstName: userAttributes.given_name || "",
          lastName: userAttributes.family_name || "",
        },
      })
    );

    console.log(`User ${userAttributes.email} synced to database`);
  } catch (error) {
    console.error("Error syncing user to database:", error);
    // Don't throw error here as it would prevent user creation
  }

  return event;
};
