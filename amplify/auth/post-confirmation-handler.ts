// // amplify/auth/post-confirmation-handler.ts

// import type { PostConfirmationTriggerHandler } from "aws-lambda";
// import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({});
// const docClient = DynamoDBDocumentClient.from(client);

// // Cache the table name to avoid repeated lookups
// let userTableName: string | null = null;

// async function findUserTableName(): Promise<string> {
//   if (userTableName) {
//     return userTableName;
//   }

//   console.log("🔍 Discovering User table name...");

//   try {
//     const result = await client.send(new ListTablesCommand({}));
//     const tables = result.TableNames || [];

//     console.log("Available tables:", tables);

//     // Look for table names that contain "User" and look like Amplify tables
//     const userTable = tables.find(
//       (tableName) =>
//         tableName.includes("User") &&
//         (tableName.includes("amplify") ||
//           tableName.includes("sandbox") ||
//           tableName.includes("dev"))
//     );

//     if (!userTable) {
//       throw new Error(
//         "Could not find User table. Available tables: " + tables.join(", ")
//       );
//     }

//     userTableName = userTable;
//     console.log("✅ Found User table:", userTable);
//     return userTable;
//   } catch (error) {
//     console.error("❌ Error finding User table:", error);
//     throw error;
//   }
// }

// export const handler: PostConfirmationTriggerHandler = async (event) => {
//   const { userAttributes } = event.request;

//   console.log("🚀 Post-confirmation triggered");
//   console.log("👤 User ID:", userAttributes.sub);
//   console.log("📧 Email:", userAttributes.email);
//   console.log("🏷️ Table name from env:", process.env.USER_TABLE_NAME);

//   try {
//     // Try environment variable first, then fall back to discovery
//     const tableName =
//       process.env.USER_TABLE_NAME || (await findUserTableName());

//     const now = new Date().toISOString();
//     const userId = crypto.randomUUID();

//     const userData = {
//       id: userId,
//       email: userAttributes.email,
//       givenName: userAttributes.given_name || "",
//       familyName: userAttributes.family_name || "",
//       groups: ["users"],
//       isActive: true,
//       createdAt: now,
//       updatedAt: now,
//       cognitoUserId: userAttributes.sub, // Use cognitoUserId instead of owner
//     };

//     console.log(`💾 Creating user in table: ${tableName}`);
//     console.log("📋 User data:", JSON.stringify(userData, null, 2));

//     const result = await docClient.send(
//       new PutCommand({
//         TableName: tableName,
//         Item: userData,
//       })
//     );

//     console.log("✅ DynamoDB result:", result);
//     console.log(
//       `✅ SUCCESS: User ${userAttributes.sub} created with ID ${userId}`
//     );
//   } catch (error) {
//     console.error("❌ ERROR creating user:", error);

//     if (error instanceof Error) {
//       console.error("Error message:", error.message);
//       console.error("Error stack:", error.stack);
//     }

//     // Don't throw - let signup continue
//     console.warn("⚠️ Signup will continue despite database error");
//   }

//   return event;
// };
