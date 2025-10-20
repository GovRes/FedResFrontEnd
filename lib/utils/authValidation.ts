import { fetchAuthSession } from "aws-amplify/auth";

interface AuthResponse {
  success: boolean;
  error?: string;
  statusCode?: number;
  userId?: string;
}

/**
 * Centralized authentication validation utility
 * Use this consistently across all CRUD operations
 */
export async function validateAuth(): Promise<AuthResponse> {
  try {
    const session = await fetchAuthSession();

    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }

    // Extract user ID from the session if available
    let userId: string | undefined;
    try {
      if (session.tokens.idToken?.payload?.sub) {
        userId = session.tokens.idToken.payload.sub as string;
      }
    } catch (error) {
      console.warn("Could not extract user ID from session:", error);
    }

    return {
      success: true,
      userId,
    };
  } catch (error) {
    console.error("Authentication validation failed:", error);
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
  }
}

/**
 * Higher-order function to add authentication to any CRUD operation
 * Wraps functions to automatically handle auth validation
 */
export function withAuth<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const authCheck = await validateAuth();
    if (!authCheck.success) {
      return {
        success: false,
        error: authCheck.error,
        statusCode: authCheck.statusCode,
      } as R;
    }

    return fn(...args);
  };
}

/**
 * Validates auth and returns user ID
 * Useful for operations that need the current user's ID
 */
export async function validateAuthAndGetUserId(): Promise<
  AuthResponse & { userId: string }
> {
  const authResult = await validateAuth();

  if (!authResult.success) {
    return authResult as AuthResponse & { userId: string };
  }

  if (!authResult.userId) {
    return {
      success: false,
      error: "Unable to determine user ID from session",
      statusCode: 401,
      userId: "",
    };
  }

  return {
    success: true,
    userId: authResult.userId,
  };
}
