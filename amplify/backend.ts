import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { openaiProcessor } from "./functions/openai-processor/resource";

export const backend = defineBackend({
  auth,
  data,
  openaiProcessor,
});
