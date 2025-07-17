// lib/amplify-config.ts
"use client";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

// Configure immediately when this module is imported
if (typeof window !== "undefined") {
  Amplify.configure(outputs, { ssr: true });
  console.log("Amplify configured from lib/amplify-config.ts");
}
