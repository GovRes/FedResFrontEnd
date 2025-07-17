"use client";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

let isConfigured = false;

// Configure Amplify immediately when this module loads (synchronously)
if (typeof window !== "undefined" && !isConfigured) {
  try {
    Amplify.configure(outputs, { ssr: true });
    isConfigured = true;
    console.log("✅ Amplify configured successfully");
  } catch (error) {
    console.error("❌ Failed to configure Amplify:", error);
  }
}

export default function ConfigureAmplifyClientSide() {
  // This is now just for ensuring configuration happened
  if (typeof window !== "undefined" && !isConfigured) {
    try {
      Amplify.configure(outputs, { ssr: true });
      isConfigured = true;
      console.log("✅ Amplify configured in component");
    } catch (error) {
      console.error("❌ Failed to configure Amplify in component:", error);
    }
  }

  return null;
}
