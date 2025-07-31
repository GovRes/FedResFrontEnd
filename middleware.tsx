// middleware.tsx
import { NextRequest, NextResponse } from "next/server";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import outputs from "./amplify_outputs.json";

// Configure Amplify specifically for middleware/Edge Runtime
const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const authenticated = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec, {});
        return session.tokens !== undefined;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  });

  if (authenticated) {
    return response;
  }

  return NextResponse.redirect(new URL("/?login=true", request.url));
}

export const config = {
  matcher: ["/profile", "/ally"],
};
