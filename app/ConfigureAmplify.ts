import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

let isConfigured = false;

export default function ConfigureAmplifyClientSide() {
  if (!isConfigured) {
    Amplify.configure(outputs, { ssr: true });
    isConfigured = true;
  }
  return null;
}