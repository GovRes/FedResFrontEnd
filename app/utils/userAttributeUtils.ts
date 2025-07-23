import {
  updateUserAttribute,
  getCurrentUser,
  type FetchUserAttributesOutput,
  type UpdateUserAttributeOutput,
} from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import z from "zod";

// Generate typed client for database operations
const client = generateClient<Schema>();

export async function handleUpdateUserAttribute(
  attributeKey: string,
  value: string
) {
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
    } else {
      // Create new user record
      await client.models.User.create(userTypeData);
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
    } else {
      await client.models.User.create(userTypeData);
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
    email: anyItem.email,
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
  birthdate?: string | null | undefined;
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
  isActive?: boolean | null; // Optional, defaults to true
}

export const userZodSchema = z.object({
  birthdate: z.string().nullable().optional(),
  email: z.string().email(),
  familyName: z.string().nullable().optional(),
  givenName: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  academicLevel: z.string().nullable().optional(),
  currentAgency: z.string().nullable().optional(),
  citizen: z.boolean().nullable().optional(),
  disabled: z.boolean().nullable().optional(),
  fedEmploymentStatus: z.string().nullable().optional(),
  militarySpouse: z.boolean().nullable().optional(),
  veteran: z.boolean().nullable().optional(),
  id: z.string(),
  isActive: z.boolean().nullable().optional(), // Optional, defaults to true
});
