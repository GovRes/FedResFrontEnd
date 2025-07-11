import { defineAuth } from "@aws-amplify/backend";
// import { defineFunction } from "@aws-amplify/backend";

// const postConfirmationFunction = defineFunction({
//   entry: "./post-confirmation-handler.ts",
// });

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
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
