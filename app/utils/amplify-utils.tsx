import { cookies } from "next/headers";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getCurrentUser } from "aws-amplify/auth/server";
import { Amplify } from "aws-amplify"; // Add this
import { type Schema } from "@/amplify/data/resource";
import outputs from "@/amplify_outputs.json";

// Configure Amplify for server-side usage
Amplify.configure(outputs, { ssr: true });

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

export const cookieBasedClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});
