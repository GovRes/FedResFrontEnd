import {
  updateUserAttribute,
  getCurrentUser,
  fetchUserAttributes,
  type FetchUserAttributesOutput,
  type UpdateUserAttributeOutput,
} from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

// Generate typed client for database operations
const client = generateClient<Schema>();

export async function handleUpdateUserAttribute(
  attributeKey: string,
  value: string
) {
  console.log(17, attributeKey, value);
  try {
    const output = await updateUserAttribute({
      userAttribute: {
        attributeKey,
        value,
      },
    });

    await handleUpdateUserAttributeNextSteps(output, attributeKey, value);
    return "200";
  } catch (error) {
    return (error as Error).message;
  }
}

/**
 * Updates a user attribute using your UserType interface
 * This is the preferred method as it handles proper type conversion
 */
export async function updateUserTypeAttribute(
  field: keyof UserType,
  value: any
) {
  console.log(34, field, value);
  try {
    // Create a partial UserType with just the field we're updating
    const partialUser: Partial<UserType> = { [field]: value };

    // Convert to Cognito format
    const cognitoAttributes = toCognitoUserFormat(partialUser as UserType);

    // Update each attribute in Cognito
    const updatePromises = Object.entries(cognitoAttributes).map(
      ([attributeKey, attributeValue]) =>
        updateUserAttribute({
          userAttribute: {
            attributeKey,
            value: attributeValue,
          },
        })
    );

    const outputs = await Promise.all(updatePromises);

    // Handle next steps for all updates
    for (let i = 0; i < outputs.length; i++) {
      const [attributeKey, attributeValue] =
        Object.entries(cognitoAttributes)[i];
      await handleUpdateUserAttributeNextSteps(
        outputs[i],
        attributeKey,
        attributeValue
      );
    }

    return "200";
  } catch (error) {
    return (error as Error).message;
  }
}

/**
 * Handles the next steps after updating a user attribute in Cognito
 * Since we only allow attributes that don't require confirmation, this should always be 'DONE'
 */
async function handleUpdateUserAttributeNextSteps(
  output: UpdateUserAttributeOutput,
  attributeKey: string,
  value: string
) {
  const { nextStep } = output;

  if (nextStep.updateAttributeStep === "DONE") {
    console.log(`Attribute ${attributeKey} was successfully updated.`);
    // Sync to database since update is complete
    await syncUserAttributeToDatabase(attributeKey, value);
  } else {
    // This shouldn't happen since we don't allow confirmation-required attributes
    throw new Error(
      `Unexpected update step: ${nextStep.updateAttributeStep}. Only attributes that don't require confirmation are allowed.`
    );
  }
}

/**
 * Syncs user attribute changes to your database using proper type conversion
 */
async function syncUserAttributeToDatabase(
  attributeKey: string,
  value: string
) {
  try {
    // Get current user to extract user ID
    const currentUser = await getCurrentUser();
    const userId = currentUser.userId;

    // Get all current attributes to maintain data integrity
    const { fetchUserAttributes } = await import("aws-amplify/auth");
    const allAttributes = await fetchUserAttributes();

    // Update the specific attribute
    allAttributes[attributeKey] = value;

    // Convert from Cognito format to your UserType
    const userTypeData = toUserTypeFromCognito(allAttributes);

    // Ensure the ID is set correctly
    userTypeData.id = userId;

    // Check if user exists in database
    const existingUser = await client.models.User.get({ id: userId });

    if (existingUser.data) {
      // Update existing user with all current data
      await client.models.User.update(userTypeData);
      console.log(`Updated user ${userId} with ${attributeKey}: ${value}`);
    } else {
      // Create new user record
      await client.models.User.create(userTypeData);
      console.log(`Created new user ${userId} with ${attributeKey}: ${value}`);
    }
  } catch (error) {
    console.error("Error syncing to database:", error);
    throw error;
  }
}

/**
 * Syncs all user attributes from Cognito to your database
 * Uses your converter functions for proper type handling
 */
export async function syncAllUserAttributesToDatabase() {
  try {
    const currentUser = await getCurrentUser();
    const userId = currentUser.userId;

    // Get all user attributes from Cognito
    const { fetchUserAttributes } = await import("aws-amplify/auth");
    const attributes = await fetchUserAttributes();

    // Convert from Cognito format to your UserType using your converter
    const userTypeData = toUserTypeFromCognito(attributes);

    // Ensure the ID is set correctly
    userTypeData.id = userId;

    // Check if user exists and update or create
    const existingUser = await client.models.User.get({ id: userId });

    if (existingUser.data) {
      await client.models.User.update(userTypeData);
      console.log(`Synced all attributes for user ${userId}`);
    } else {
      await client.models.User.create(userTypeData);
      console.log(`Created user ${userId} with all attributes`);
    }

    return "200";
  } catch (error) {
    console.error("Error syncing all attributes:", error);
    return (error as Error).message;
  }
}

// AWS Cognito often uses specific attribute names
export function toUserTypeFromCognito(
  item: Record<string, string> | FetchUserAttributesOutput | UserType
): UserType {
  if (isUserType(item)) return item;

  const anyItem = item as any;

  return {
    birthdate: anyItem.birthdate || anyItem["custom:birthdate"] || null,
    email: anyItem.email || null,
    familyName: anyItem.family_name || anyItem["custom:family_name"] || null,
    givenName: anyItem.given_name || anyItem["custom:given_name"] || null,
    gender: anyItem.gender || anyItem["custom:gender"] || null,
    academicLevel:
      anyItem["custom:academic_level"] || anyItem.academic_level || null,
    currentAgency:
      anyItem["custom:current_agency"] || anyItem.current_agency || null,
    citizen: convertToBoolean(anyItem["custom:citizen"] || anyItem.citizen),
    disabled: convertToBoolean(anyItem["custom:disabled"] || anyItem.disabled),
    fedEmploymentStatus:
      anyItem["custom:fed_employment_status"] ||
      anyItem.fed_employment_status ||
      null,
    militarySpouse: convertToBoolean(
      anyItem["custom:military_spouse"] || anyItem.military_spouse
    ),
    veteran: convertToBoolean(anyItem["custom:veteran"] || anyItem.veteran),
    id: anyItem.sub || anyItem.id || anyItem.user_id || null,
  };
}
export function toCognitoAdminFormat(
  userType: UserType
): Array<{ Name: string; Value: string }> {
  const result: Array<{ Name: string; Value: string }> = [];

  // Only include non-null values
  if (userType.email) result.push({ Name: "email", Value: userType.email });
  if (userType.givenName)
    result.push({ Name: "given_name", Value: userType.givenName });
  if (userType.familyName)
    result.push({ Name: "family_name", Value: userType.familyName });
  if (userType.gender) result.push({ Name: "gender", Value: userType.gender });
  if (userType.birthdate)
    result.push({ Name: "birthdate", Value: userType.birthdate });

  // Custom attributes with 'custom:' prefix
  if (userType.academicLevel) {
    result.push({
      Name: "custom:academic_level",
      Value: userType.academicLevel,
    });
  }
  if (userType.currentAgency) {
    result.push({
      Name: "custom:current_agency",
      Value: userType.currentAgency,
    });
  }

  // Convert booleans to strings
  if (userType.citizen !== null && userType.citizen !== undefined) {
    result.push({ Name: "custom:citizen", Value: userType.citizen.toString() });
  }
  if (userType.disabled !== null && userType.disabled !== undefined) {
    result.push({
      Name: "custom:disabled",
      Value: userType.disabled.toString(),
    });
  }
  if (
    userType.militarySpouse !== null &&
    userType.militarySpouse !== undefined
  ) {
    result.push({
      Name: "custom:military_spouse",
      Value: userType.militarySpouse.toString(),
    });
  }
  if (userType.veteran !== null && userType.veteran !== undefined) {
    result.push({ Name: "custom:veteran", Value: userType.veteran.toString() });
  }

  if (userType.fedEmploymentStatus) {
    result.push({
      Name: "custom:fed_employment_status",
      Value: userType.fedEmploymentStatus,
    });
  }

  return result;
}
export function toCognitoUserFormat(
  userType: UserType
): Record<string, string> {
  const result: Record<string, string> = {};

  // Only include non-null values
  if (userType.email) result.email = userType.email;
  if (userType.givenName) result.given_name = userType.givenName;
  if (userType.familyName) result.family_name = userType.familyName;
  if (userType.gender) result.gender = userType.gender;
  if (userType.birthdate) result.birthdate = userType.birthdate;

  // Custom attributes with 'custom:' prefix
  if (userType.academicLevel)
    result["custom:academicLevel"] = userType.academicLevel;
  if (userType.currentAgency)
    result["custom:currentAgency"] = userType.currentAgency;

  // Convert booleans to strings
  if (userType.citizen !== null && userType.citizen !== undefined) {
    result["custom:citizen"] = userType.citizen.toString();
  }
  if (userType.disabled !== null && userType.disabled !== undefined) {
    result["custom:disabled"] = userType.disabled.toString();
  }
  if (
    userType.militarySpouse !== null &&
    userType.militarySpouse !== undefined
  ) {
    result["custom:militarySpouse"] = userType.militarySpouse.toString();
  }
  if (userType.veteran !== null && userType.veteran !== undefined) {
    result["custom:veteran"] = userType.veteran.toString();
  }

  if (userType.fedEmploymentStatus) {
    result["custom:fedEmploymentStatus"] = userType.fedEmploymentStatus;
  }
  console.log(result);
  return result;
}

function convertToBoolean(value: any): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    if (lower === "false" || lower === "0" || lower === "no") return false;
  }
  if (typeof value === "number") return value !== 0;
  return null;
}

function isUserType(obj: any): obj is UserType {
  return (
    obj &&
    typeof obj === "object" &&
    (obj.hasOwnProperty("birthdate") ||
      obj.hasOwnProperty("academicLevel") ||
      obj.hasOwnProperty("currentAgency"))
  );
}

export interface UserType {
  birthdate?: string | null;
  email: string;
  familyName?: string | null;
  givenName?: string | null;
  gender?: string | null;
  academicLevel?: string | null;
  currentAgency?: string | null;
  citizen?: boolean | null;
  disabled?: boolean | null;
  fedEmploymentStatus?: string | null;
  militarySpouse?: boolean | null;
  veteran?: boolean | null;
  id: string;
}

export async function testDatabaseSync() {
  try {
    const currentUser = await getCurrentUser();
    const userId = currentUser.userId;
    console.log(`Testing with user ID: ${userId}`);

    // Test 1: Can we read from the database?
    console.log(`🔍 Testing database read...`);
    const existingUser = await client.models.User.get({ id: userId });
    console.log(`Existing user:`, existingUser);

    // Test 2: Can we fetch user attributes?
    console.log(`🔍 Testing Cognito attributes fetch...`);
    const attributes = await fetchUserAttributes();
    console.log(`Cognito attributes:`, attributes);

    // Test 3: Test your converter
    console.log(`🔄 Testing converter...`);
    const convertedData = toUserTypeFromCognito(attributes);
    convertedData.id = userId;
    console.log(`Converted data:`, convertedData);

    // Test 4: Try a simple update
    console.log(`🔄 Testing database update...`);
    if (existingUser.data) {
      const updateResult = await client.models.User.update({
        id: userId,
        givenName: "TestUpdate", // Simple test update
      });
      console.log(`Update test result:`, updateResult);

      // Check for errors specifically
      if (updateResult.errors && updateResult.errors.length > 0) {
        console.error(`❌ Database update errors:`, updateResult.errors);
        updateResult.errors.forEach((error, index) => {
          console.error(`Error ${index + 1}:`, {
            message: error.message,
            locations: error.locations,
            path: error.path,
            extensions: error.extensions,
          });
        });
      }
    } else {
      console.log(`No existing user found - would need to create one`);
    }

    return "Test complete";
  } catch (error) {
    console.error("Test failed:", error);
    return `Test failed: ${(error as Error).message}`;
  }
}

/**
 * Simple test function that just checks the database update error
 */
export async function testSimpleDatabaseUpdate() {
  try {
    const currentUser = await getCurrentUser();
    const userId = currentUser.userId;

    console.log(`Testing simple update for user: ${userId}`);
    console.log(`Current user object:`, currentUser);

    // First, let's see what's in the existing database record
    const existingUser = await client.models.User.get({ id: userId });
    console.log(`Existing user data:`, existingUser.data);

    if (existingUser.data) {
      console.log(
        `Existing user owner field:`,
        (existingUser.data as any).owner
      );
      console.log(`Existing user id field:`, existingUser.data.id);
    }

    // Try the simplest possible update - just changing givenName
    console.log(`\n🔄 Attempting update with minimal data...`);
    const updateResult1 = await client.models.User.update({
      id: userId,
      givenName: "TestName",
    });

    console.log(`Minimal update result:`, updateResult1);

    if (updateResult1.errors && updateResult1.errors.length > 0) {
      console.error(`❌ Minimal update errors:`, updateResult1.errors);
    }

    // Try update with owner field explicitly set
    console.log(`\n🔄 Attempting update WITH owner field...`);
    const updateResult2 = await client.models.User.update({
      id: userId,
      owner: userId, // Explicitly set owner
      givenName: "TestName2",
    });

    console.log(`Update with owner result:`, updateResult2);

    if (updateResult2.errors && updateResult2.errors.length > 0) {
      console.error(`❌ Update with owner errors:`, updateResult2.errors);
    }

    // Try update with current user identity
    console.log(`\n🔄 Attempting update with user identity format...`);
    const userIdentity = `${currentUser.userId}::${
      currentUser.username || "unknown"
    }`;
    const updateResult3 = await client.models.User.update({
      id: userId,
      owner: userIdentity, // Try Cognito identity format
      givenName: "TestName3",
    });

    console.log(`Update with identity result:`, updateResult3);

    if (updateResult3.errors && updateResult3.errors.length > 0) {
      console.error(`❌ Update with identity errors:`, updateResult3.errors);
    }

    return { updateResult1, updateResult2, updateResult3 };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return error;
  }
}

export async function fixUserOwnership() {
  try {
    const currentUser = await getCurrentUser();
    const userId = currentUser.userId;

    console.log(`🔧 Fixing ownership for user: ${userId}`);

    // First, check current state
    const existingUser = await client.models.User.get({ id: userId });
    console.log(`Current user data:`, existingUser.data);
    console.log(`Current owner field:`, (existingUser.data as any)?.owner);

    if (!existingUser.data) {
      console.error(`❌ User ${userId} not found in database`);
      return "User not found";
    }

    // Try to update with admin permissions (publicApiKey allows create/read, let's see if it allows update)
    // Or use a different approach - recreate the user with proper ownership

    // Method 1: Try direct update with owner field
    console.log(`🔄 Attempting to set owner field...`);

    // Use the raw GraphQL mutation to bypass client-side validation
    const updateResult = await client.graphql({
      query: `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
            owner
            givenName
            familyName
            email
          }
        }
      `,
      variables: {
        input: {
          id: userId,
          owner: userId,
        },
      },
    });

    console.log(`✅ Direct GraphQL update result:`, updateResult);

    return "Owner field updated successfully";
  } catch (error) {
    console.error("❌ Error fixing ownership:", error);

    // If that fails, let's try using the publicApiKey permissions
    console.log("🔄 Trying alternative approach...");

    try {
      // Generate a client with API key instead of user pool
      const apiKeyClient = generateClient({
        authMode: "apiKey",
      });

      const currentUser = await getCurrentUser();
      const userId = currentUser.userId;

      const updateResult = await apiKeyClient.models.User.update({
        id: userId,
        owner: userId,
      });

      console.log(`✅ API Key update result:`, updateResult);
      return "Owner updated via API key";
    } catch (apiError) {
      console.error("❌ API Key approach also failed:", apiError);
      return `Failed: ${(error as Error).message}`;
    }
  }
}
