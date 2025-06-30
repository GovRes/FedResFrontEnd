import { defineAuth } from "@aws-amplify/backend";
import { postConfirmation } from "./post-confirmation/resource";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["users", "admins", "superAdmins"],
  userAttributes: {
    birthdate: {
      mutable: true,
      required: false,
    },
    familyName: {
      mutable: true,
      required: false,
    },
    givenName: {
      mutable: true,
      required: false,
    },
    gender: {
      mutable: true,
      required: false,
    },
    "custom:academicLevel": {
      mutable: true,
      dataType: "String",
    },
    "custom:currentAgency": {
      mutable: true,
      dataType: "String",
    },
    "custom:citizen": {
      mutable: true,
      dataType: "Boolean",
    },
    "custom:disabled": {
      mutable: true,
      dataType: "Boolean",
    },
    "custom:fedEmploymentStatus": {
      mutable: true,
      dataType: "String",
    },
    "custom:militarySpouse": {
      mutable: true,
      dataType: "Boolean",
    },
    "custom:veteran": {
      mutable: true,
      dataType: "Boolean",
    },
  },
});
