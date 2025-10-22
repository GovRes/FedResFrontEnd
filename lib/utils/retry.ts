/**
 * Retry utility with exponential backoff for handling transient failures
 */

import { RETRY_CONFIG } from "./constants";

export interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any, delay: number) => void;
}

export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: RETRY_CONFIG.DEFAULT_MAX_ATTEMPTS,
  baseDelay: RETRY_CONFIG.DEFAULT_BASE_DELAY,
  maxDelay: RETRY_CONFIG.DEFAULT_MAX_DELAY,
  shouldRetry: isRetriableError,
  onRetry: logRetryAttempt,
};

/**
 * Determines if an error should trigger a retry
 * @param error - The error to evaluate
 * @returns true if the error is retriable, false otherwise
 */
export function isRetriableError(error: any): boolean {
  // Don't retry validation errors (4xx except 408, 429)
  if (error?.statusCode) {
    const statusCode = error.statusCode;

    // Never retry client errors except timeouts and rate limits
    if (statusCode >= 400 && statusCode < 500) {
      // Retry on request timeout and rate limit
      return statusCode === 408 || statusCode === 429;
    }

    // Retry on server errors (5xx)
    if (statusCode >= 500) {
      return true;
    }
  }

  // Retry on network errors
  if (error?.message) {
    const message = error.message.toLowerCase();
    const networkErrorPatterns = [
      "network",
      "timeout",
      "econnreset",
      "econnrefused",
      "etimedout",
      "socket hang up",
      "fetch failed",
    ];

    return networkErrorPatterns.some((pattern) => message.includes(pattern));
  }

  // Retry on GraphQL errors that indicate transient issues
  if (error?.errors) {
    const errorMessages = error.errors
      .map((e: any) => e.message?.toLowerCase() || "")
      .join(" ");

    return (
      errorMessages.includes("throttl") ||
      errorMessages.includes("rate limit") ||
      errorMessages.includes("timeout") ||
      errorMessages.includes("temporarily unavailable")
    );
  }

  // Don't retry unknown errors
  return false;
}

/**
 * Default retry logging function
 */
function logRetryAttempt(attempt: number, error: any, delay: number): void {
  console.warn(
    `Retry attempt ${attempt} after ${delay}ms delay. Error:`,
    error?.message || error?.error || "Unknown error"
  );
}

/**
 * Calculate delay with exponential backoff and jitter
 * @param attempt - Current attempt number (1-based)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Delay in milliseconds with jitter applied
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: baseDelay * 2^(attempt-1)
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (configurable % randomization) to prevent thundering herd
  const jitterPercent = RETRY_CONFIG.JITTER_PERCENT;
  const jitter = cappedDelay * jitterPercent;
  const jitteredDelay = cappedDelay + (Math.random() * jitter * 2 - jitter);

  return Math.floor(jitteredDelay);
}

/**
 * Execute an async operation with retry logic and exponential backoff
 *
 * @param operation - The async operation to execute
 * @param config - Retry configuration options
 * @returns Promise that resolves with the operation result
 * @throws The last error if all retry attempts fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => {
 *     return await client.graphql({ query, variables });
 *   },
 *   {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retrying after ${delay}ms (attempt ${attempt})`);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, shouldRetry, onRetry } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if this is the last attempt
      if (attempt === maxAttempts) {
        console.error(`Operation failed after ${maxAttempts} attempts:`, error);
        break;
      }

      // Check if error should trigger retry
      if (!shouldRetry(error)) {
        console.warn("Error is not retriable, failing immediately:", error);
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = calculateDelay(attempt, baseDelay, maxDelay);

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, error, delay);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wrapper for batch operations with retry logic
 * Retries individual failed items rather than the entire batch
 *
 * @param items - Array of items to process
 * @param operation - Operation to perform on each item
 * @param config - Retry configuration
 * @returns Object with successful and failed results
 */
export async function withBatchRetry<TInput, TOutput>(
  items: TInput[],
  operation: (item: TInput) => Promise<TOutput>,
  config: RetryConfig = {}
): Promise<{
  successful: TOutput[];
  failed: Array<{ item: TInput; error: any }>;
}> {
  const successful: TOutput[] = [];
  const failed: Array<{ item: TInput; error: any }> = [];

  for (const item of items) {
    try {
      const result = await withRetry(() => operation(item), config);
      successful.push(result);
    } catch (error) {
      failed.push({ item, error });
    }
  }

  return { successful, failed };
}

/**
 * Circuit breaker pattern for retry logic
 * Prevents cascading failures by temporarily stopping retries after repeated failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private threshold: number = RETRY_CONFIG.CIRCUIT_BREAKER_THRESHOLD,
    private timeout: number = RETRY_CONFIG.CIRCUIT_BREAKER_TIMEOUT,
    private resetTimeout: number = RETRY_CONFIG.CIRCUIT_BREAKER_RESET_TIMEOUT
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure < this.resetTimeout) {
        throw new Error("Circuit breaker is OPEN - too many recent failures");
      }

      // Try half-open state
      this.state = "half-open";
    }

    try {
      const result = await operation();

      // Success - reset circuit breaker
      if (this.state === "half-open") {
        this.state = "closed";
      }
      this.failureCount = 0;

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.threshold) {
        this.state = "open";
        console.error(
          `Circuit breaker OPENED after ${this.failureCount} failures`
        );
      }

      throw error;
    }
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = "closed";
  }

  getState(): string {
    return this.state;
  }
}
