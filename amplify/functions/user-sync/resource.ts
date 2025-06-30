import { defineFunction } from "@aws-amplify/backend";

export const userSync = defineFunction({
  name: "user-sync",
  entry: "./handler.ts",
  resourceGroupName: "data",
});
