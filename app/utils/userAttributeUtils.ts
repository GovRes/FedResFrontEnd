import {
  updateUserAttribute,
  type UpdateUserAttributeOutput,
} from "aws-amplify/auth";
import { FetchUserAttributesOutput } from "aws-amplify/auth";

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
    handleUpdateUserAttributeNextSteps(output);
    return "200";
  } catch (error) {
    return (error as Error).message;
  }
}

export function handleUpdateUserAttributeNextSteps(
  output: UpdateUserAttributeOutput
) {
  const { nextStep } = output;

  switch (nextStep.updateAttributeStep) {
    case "CONFIRM_ATTRIBUTE_WITH_CODE":
      const codeDeliveryDetails = nextStep.codeDeliveryDetails;
      console.log(
        `Confirmation code was sent to ${codeDeliveryDetails?.deliveryMedium}.`
      );
      // Collect the confirmation code from the user and pass to confirmUserAttribute.
      break;
    case "DONE":
      return 200;
      break;
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
    result["custom:academic_level"] = userType.academicLevel;
  if (userType.currentAgency)
    result["custom:current_agency"] = userType.currentAgency;

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
    result["custom:military_spouse"] = userType.militarySpouse.toString();
  }
  if (userType.veteran !== null && userType.veteran !== undefined) {
    result["custom:veteran"] = userType.veteran.toString();
  }

  if (userType.fedEmploymentStatus) {
    result["custom:fed_employment_status"] = userType.fedEmploymentStatus;
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
export const UserTypeConverter = {
  toCognito: toCognitoAdminFormat, // Use admin format as default
  toCognitoAdmin: toCognitoAdminFormat,
  toCognitoUser: toCognitoUserFormat,
  fromCognito: toUserTypeFromCognito,
  // Utility to handle null/undefined cleanup
  cleanForCognito: (userType: UserType): UserType => {
    const cleaned: UserType = {};
    Object.entries(userType).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        (cleaned as any)[key] = value;
      }
    });
    return cleaned;
  },
};
export interface UserType {
  birthdate?: string | null;
  email?: string | null;
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
  id?: string | null;
}
