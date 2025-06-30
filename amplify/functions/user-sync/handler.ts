import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { userAttributes } = event.request;

  try {
    await docClient.send(
      new PutCommand({
        TableName: process.env.USER_TABLE_NAME,
        Item: {
          id: userAttributes.sub,
          email: userAttributes.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          groups: ["users"],
          givenName: userAttributes.given_name || "",
          familyName: userAttributes.family_name || "",
        },
      })
    );

    console.log(`User ${userAttributes.sub} synced to database`);
  } catch (error) {
    console.error("Error syncing user to database:", error);
  }

  return event;
};
