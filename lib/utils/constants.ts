// ============================================================================
// HTTP Status Codes
// ============================================================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  MULTI_STATUS: 207,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================================================
// Retry Configuration
// ============================================================================
export const RETRY_CONFIG = {
  // Default number of retry attempts (including initial attempt)
  DEFAULT_MAX_ATTEMPTS: 3,

  // Base delay in milliseconds (first retry)
  DEFAULT_BASE_DELAY: 1000, // 1 second

  // Maximum delay in milliseconds (caps exponential backoff)
  DEFAULT_MAX_DELAY: 10000, // 10 seconds

  // Jitter percentage for randomization (prevents thundering herd)
  JITTER_PERCENT: 0.25, // ±25%

  // Aggressive retry for read operations
  AGGRESSIVE_MAX_ATTEMPTS: 5,
  AGGRESSIVE_BASE_DELAY: 500,
  AGGRESSIVE_MAX_DELAY: 8000,

  // Conservative retry for write operations
  CONSERVATIVE_MAX_ATTEMPTS: 2,
  CONSERVATIVE_BASE_DELAY: 2000,
  CONSERVATIVE_MAX_DELAY: 15000,

  // Circuit breaker configuration
  CIRCUIT_BREAKER_THRESHOLD: 5, // Number of failures before opening circuit
  CIRCUIT_BREAKER_TIMEOUT: 60000, // 1 minute - how long circuit stays open
  CIRCUIT_BREAKER_RESET_TIMEOUT: 30000, // 30 seconds - time to try half-open

  // Batch retry configuration
  BATCH_CONSECUTIVE_FAILURE_THRESHOLD: 5, // Stop batch after N consecutive failures
} as const;

// ============================================================================
// Batch Processing
// ============================================================================
export const BATCH_CONFIG = {
  // Default batch size for sequential operations
  DEFAULT_BATCH_SIZE: 50,

  // Batch size for parallel operations (more conservative)
  PARALLEL_BATCH_SIZE: 3,

  // Minimum batch size
  MIN_BATCH_SIZE: 1,

  // Maximum batch size
  MAX_BATCH_SIZE: 50,

  // Progress logging interval (log every N operations)
  PROGRESS_LOG_INTERVAL: 25,
} as const;

// ============================================================================
// Query Limits
// ============================================================================
export const QUERY_LIMITS = {
  // Default limit for list queries
  DEFAULT_LIST_LIMIT: 100,

  // Maximum items to fetch in a single query
  MAX_QUERY_LIMIT: 1000,

  // Minimum query limit
  MIN_QUERY_LIMIT: 1,
} as const;

// ============================================================================
// Similarity & Matching
// ============================================================================
export const MATCHING_CONFIG = {
  // Minimum keyword overlap percentage for topic similarity (80%)
  TOPIC_SIMILARITY_THRESHOLD: 0.8,

  // Minimum text similarity for fuzzy matching
  TEXT_SIMILARITY_THRESHOLD: 0.75,
} as const;

// ============================================================================
// Validation
// ============================================================================
export const VALIDATION_LIMITS = {
  // Maximum length for string fields
  MAX_STRING_LENGTH: 5000,

  // Maximum length for title fields
  MAX_TITLE_LENGTH: 500,

  // Minimum length for non-empty strings
  MIN_STRING_LENGTH: 1,
} as const;

// ============================================================================
// Type Guards
// ============================================================================
export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
export type BatchSize = number;
export type QueryLimit = number;

// ============================================================================
// Helper Functions - Batch & Query
// ============================================================================

/**
 * Validates if a batch size is within acceptable range
 */
export function isValidBatchSize(size: number): boolean {
  return (
    size >= BATCH_CONFIG.MIN_BATCH_SIZE && size <= BATCH_CONFIG.MAX_BATCH_SIZE
  );
}

/**
 * Validates if a query limit is within acceptable range
 */
export function isValidQueryLimit(limit: number): boolean {
  return (
    limit >= QUERY_LIMITS.MIN_QUERY_LIMIT &&
    limit <= QUERY_LIMITS.MAX_QUERY_LIMIT
  );
}

/**
 * Clamps a batch size to valid range
 */
export function clampBatchSize(size: number): number {
  return Math.max(
    BATCH_CONFIG.MIN_BATCH_SIZE,
    Math.min(size, BATCH_CONFIG.MAX_BATCH_SIZE)
  );
}

/**
 * Clamps a query limit to valid range
 */
export function clampQueryLimit(limit: number): number {
  return Math.max(
    QUERY_LIMITS.MIN_QUERY_LIMIT,
    Math.min(limit, QUERY_LIMITS.MAX_QUERY_LIMIT)
  );
}

// ============================================================================
// Helper Functions - Retry & Error Handling
// ============================================================================

/**
 * Checks if an HTTP status code indicates a retriable error
 */
export function isRetriableHttpStatus(statusCode: number): boolean {
  return (
    statusCode === HTTP_STATUS.REQUEST_TIMEOUT ||
    statusCode === HTTP_STATUS.TOO_MANY_REQUESTS ||
    statusCode >= 500 // All 5xx errors
  );
}

/**
 * Checks if an HTTP status code indicates a client error (4xx)
 */
export function isClientError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Checks if an HTTP status code indicates a server error (5xx)
 */
export function isServerError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600;
}

/**
 * Gets retry configuration based on operation type
 */
export function getRetryConfigForOperation(
  operationType?: "read" | "write" | "critical"
): {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
} {
  switch (operationType) {
    case "read":
      return {
        maxAttempts: RETRY_CONFIG.AGGRESSIVE_MAX_ATTEMPTS,
        baseDelay: RETRY_CONFIG.AGGRESSIVE_BASE_DELAY,
        maxDelay: RETRY_CONFIG.AGGRESSIVE_MAX_DELAY,
      };
    case "write":
      return {
        maxAttempts: RETRY_CONFIG.CONSERVATIVE_MAX_ATTEMPTS,
        baseDelay: RETRY_CONFIG.CONSERVATIVE_BASE_DELAY,
        maxDelay: RETRY_CONFIG.CONSERVATIVE_MAX_DELAY,
      };
    case "critical":
      return {
        maxAttempts: RETRY_CONFIG.AGGRESSIVE_MAX_ATTEMPTS,
        baseDelay: RETRY_CONFIG.AGGRESSIVE_BASE_DELAY,
        maxDelay: RETRY_CONFIG.CONSERVATIVE_MAX_DELAY,
      };
    default:
      return {
        maxAttempts: RETRY_CONFIG.DEFAULT_MAX_ATTEMPTS,
        baseDelay: RETRY_CONFIG.DEFAULT_BASE_DELAY,
        maxDelay: RETRY_CONFIG.DEFAULT_MAX_DELAY,
      };
  }
}

/**
 * Validates retry configuration parameters
 */
export function isValidRetryConfig(config: {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}): { valid: boolean; error?: string } {
  if (config.maxAttempts !== undefined) {
    if (config.maxAttempts < 1 || config.maxAttempts > 10) {
      return {
        valid: false,
        error: "maxAttempts must be between 1 and 10",
      };
    }
  }

  if (config.baseDelay !== undefined) {
    if (config.baseDelay < 100 || config.baseDelay > 10000) {
      return {
        valid: false,
        error: "baseDelay must be between 100ms and 10000ms",
      };
    }
  }

  if (config.maxDelay !== undefined) {
    if (config.maxDelay < 1000 || config.maxDelay > 60000) {
      return {
        valid: false,
        error: "maxDelay must be between 1000ms and 60000ms",
      };
    }
  }

  if (
    config.baseDelay !== undefined &&
    config.maxDelay !== undefined &&
    config.baseDelay > config.maxDelay
  ) {
    return {
      valid: false,
      error: "baseDelay cannot be greater than maxDelay",
    };
  }

  return { valid: true };
}
