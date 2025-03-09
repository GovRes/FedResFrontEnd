import {
  updateUserAttribute,
  type UpdateUserAttributeOutput,
} from "aws-amplify/auth";

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

export interface UserType {
  birthdate?: string;
  familyName?: string;
  givenName?: string;
  gender?: string;
  "custom:academicLevel"?: string;
  "custom:currentAgency"?: string;
  "custom:citizen"?: boolean;
  "custom:disabled"?: boolean;
  "custom:fedEmploymentStatus"?: string;
  "custom:militarySpouse"?: boolean;
  "custom:veteran"?: boolean;
}
