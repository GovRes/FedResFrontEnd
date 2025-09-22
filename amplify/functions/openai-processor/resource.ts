import { defineFunction } from "@aws-amplify/backend";

export const openaiProcessor = defineFunction({
  entry: "./handler.ts",
  timeoutSeconds: 300, // 5 minutes
  memoryMB: 1024,
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  },
});
