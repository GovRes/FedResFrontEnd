import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * When used alongside the sandbox CLI command, any updates to this file will be reflected in the cloud
 * You can use the sandbox for development and testing purposes, but for production use cases you should create a permanent environment
 */
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