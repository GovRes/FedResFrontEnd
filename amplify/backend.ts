import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

const backend = defineBackend({
  auth,
  data,
});

backend.addOutput({
  custom: {
    environment: {
      BROWSERLESS_TOKEN: process.env.BROWSERLESS_TOKEN,
    },
  },
});
