// Centralized validation and sanitization utilities for API operations
import { BATCH_CONFIG, QUERY_LIMITS } from "./constants";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface SanitizationResult<T> {
  sanitized: T;
  isValid: boolean;
  error?: string;
}

/**
 * Valid model names for CRUD operations
 */
export const VALID_MODEL_NAMES = [
  "Application",
  "Award",
  "Education",
  "Job",
  "Resume",
  "Topic",
  "PastJob",
  "Qualification",
  "AwardApplication",
  "EducationApplication",
  "QualificationApplication",
  "PastJobApplication",
  "PastJobQualification",
] as const;

export type ValidModelName = (typeof VALID_MODEL_NAMES)[number];

/**
 * Models that have a userId field
 */
export const MODELS_WITH_USER_ID = [
  "Application",
  "Award",
  "Education",
  "Resume",
  "PastJob",
  "Qualification",
] as const;

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize a string by trimming whitespace and removing null bytes
 * Optionally escapes HTML special characters to prevent XSS
 */
export function sanitizeString(
  str: string,
  options: { escapeHtml?: boolean; maxLength?: number } = {}
): string {
  if (typeof str !== "string") {
    return "";
  }

  // Remove null bytes and trim
  let sanitized = str.replace(/\0/g, "").trim();

  // Optionally escape HTML
  if (options.escapeHtml) {
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  // Optionally truncate
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

/**
 * Sanitize an array of strings
 */
export function sanitizeStringArray(
  arr: string[],
  options: { escapeHtml?: boolean; maxLength?: number } = {}
): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr
    .map((item) => sanitizeString(item, options))
    .filter((item) => item.length > 0);
}

/**
 * Recursively sanitize an object's string values
 */
export function sanitizeObject(
  obj: any,
  options: {
    escapeHtml?: boolean;
    maxLength?: number;
    preserveFields?: string[];
  } = {}
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, options));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sanitization for preserved fields (like IDs that might have specific formats)
      if (options.preserveFields?.includes(key)) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value, options);
      }
    }
    return sanitized;
  }

  // Return primitives (numbers, booleans) unchanged
  return obj;
}

/**
 * Sanitize an ID field (typically UUIDs or similar)
 * Removes whitespace and ensures only alphanumeric and hyphens
 */
export function sanitizeId(id: string): string {
  if (typeof id !== "string") {
    return "";
  }
  return id.trim().replace(/[^a-zA-Z0-9\-_]/g, "");
}

// ============================================================================
// VALIDATION WITH SANITIZATION
// ============================================================================

/**
 * Validate and sanitize model name
 */
export function validateAndSanitizeModelName(
  modelName: string
): SanitizationResult<string> {
  const sanitized = sanitizeString(modelName);

  if (!VALID_MODEL_NAMES.includes(sanitized as ValidModelName)) {
    return {
      sanitized,
      isValid: false,
      error: `Invalid model name: ${sanitized}. Must be one of: ${VALID_MODEL_NAMES.join(", ")}`,
    };
  }

  return { sanitized, isValid: true };
}

/**
 * Validate and sanitize ID
 */
export function validateAndSanitizeId(
  id: string,
  fieldName = "id"
): SanitizationResult<string> {
  const sanitized = sanitizeId(id);

  if (!sanitized || sanitized.length === 0) {
    return {
      sanitized,
      isValid: false,
      error: `Invalid ${fieldName}: ${fieldName} must be a non-empty string`,
    };
  }

  return { sanitized, isValid: true };
}

/**
 * Validate and sanitize a non-empty string
 */
export function validateAndSanitizeNonEmptyString(
  str: string,
  fieldName: string,
  options: { escapeHtml?: boolean; maxLength?: number } = {}
): SanitizationResult<string> {
  const sanitized = sanitizeString(str, options);

  if (!sanitized || sanitized.length === 0) {
    return {
      sanitized,
      isValid: false,
      error: `Invalid ${fieldName}: ${fieldName} must be a non-empty string`,
    };
  }

  return { sanitized, isValid: true };
}

/**
 * Validate and sanitize an array
 */
export function validateAndSanitizeArray<T>(
  arr: T[],
  fieldName = "array",
  sanitizer?: (item: T) => T
): SanitizationResult<T[]> {
  if (!Array.isArray(arr)) {
    return {
      sanitized: [],
      isValid: false,
      error: `Invalid ${fieldName}: ${fieldName} must be an array`,
    };
  }

  if (arr.length === 0) {
    return {
      sanitized: [],
      isValid: false,
      error: `Invalid ${fieldName}: ${fieldName} must be a non-empty array`,
    };
  }

  const sanitized = sanitizer ? arr.map(sanitizer) : arr;

  return { sanitized, isValid: true };
}

/**
 * Validate and sanitize an object with string fields
 */
export function validateAndSanitizeObject(
  obj: any,
  fieldName = "input",
  options: {
    escapeHtml?: boolean;
    maxLength?: number;
    preserveFields?: string[];
  } = {}
): SanitizationResult<any> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return {
      sanitized: null,
      isValid: false,
      error: `Invalid ${fieldName}: ${fieldName} must be a non-null object`,
    };
  }

  const sanitized = sanitizeObject(obj, options);

  return { sanitized, isValid: true };
}

/**
 * Validate and sanitize ID array
 */
export function validateAndSanitizeIdArray(
  ids: string[],
  fieldName = "ids"
): SanitizationResult<string[]> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {
      sanitized: [],
      isValid: false,
      error: `Invalid ${fieldName}: ${fieldName} must be a non-empty array`,
    };
  }

  const sanitized = ids.map(sanitizeId).filter((id) => id.length > 0);

  if (sanitized.length === 0) {
    return {
      sanitized,
      isValid: false,
      error: `Invalid ${fieldName}: no valid IDs found after sanitization`,
    };
  }

  if (sanitized.length !== ids.length) {
    return {
      sanitized,
      isValid: false,
      error: `Invalid ${fieldName}: ${ids.length - sanitized.length} IDs were invalid`,
    };
  }

  return { sanitized, isValid: true };
}

// ============================================================================
// LEGACY VALIDATION FUNCTIONS (kept for backward compatibility)
// ============================================================================

/**
 * Validate model name
 */
export function validateModelName(modelName: string): ValidationResult {
  const result = validateAndSanitizeModelName(modelName);
  return { isValid: result.isValid, error: result.error };
}

/**
 * Validate that a string ID is non-empty
 */
export function validateId(id: string, fieldName = "id"): ValidationResult {
  const result = validateAndSanitizeId(id, fieldName);
  return { isValid: result.isValid, error: result.error };
}

/**
 * Validate userId
 */
export function validateUserId(userId: string): ValidationResult {
  return validateId(userId, "userId");
}

/**
 * Validate that an array is non-empty
 */
export function validateNonEmptyArray(
  arr: unknown,
  fieldName = "array"
): ValidationResult {
  if (!Array.isArray(arr) || arr.length === 0) {
    return {
      isValid: false,
      error: `Invalid ${fieldName}: ${fieldName} must be a non-empty array`,
    };
  }
  return { isValid: true };
}

/**
 * Validate pagination limit
 */
export function validateLimit(
  limit: number,
  min: number = QUERY_LIMITS.MIN_QUERY_LIMIT,
  max: number = QUERY_LIMITS.MAX_QUERY_LIMIT
): ValidationResult {
  if (limit !== undefined && (limit < min || limit > max)) {
    return {
      isValid: false,
      error: `Invalid limit: limit must be between ${min} and ${max}`,
    };
  }
  return { isValid: true };
}

/**
 * Validate batch size
 */
export function validateBatchSize(
  batchSize: number,
  min: number = BATCH_CONFIG.MIN_BATCH_SIZE,
  max: number = BATCH_CONFIG.MAX_BATCH_SIZE
): ValidationResult {
  if (batchSize <= 0 || batchSize > max) {
    return {
      isValid: false,
      error: `Batch size must be between ${min} and ${max}`,
    };
  }
  return { isValid: true };
}

/**
 * Validate that an object is non-null
 */
export function validateObject(
  obj: any,
  fieldName = "input"
): ValidationResult {
  if (!obj || typeof obj !== "object") {
    return {
      isValid: false,
      error: `Invalid ${fieldName}: ${fieldName} must be a non-null object`,
    };
  }
  return { isValid: true };
}

/**
 * Validate that a string field is non-empty
 */
export function validateNonEmptyString(
  str: string,
  fieldName: string
): ValidationResult {
  if (!str || typeof str !== "string" || str.trim() === "") {
    return {
      isValid: false,
      error: `Invalid ${fieldName}: ${fieldName} must be a non-empty string`,
    };
  }
  return { isValid: true };
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields(
  obj: Record<string, any>,
  requiredFields: string[]
): ValidationResult {
  const missingFields = requiredFields.filter((field) => {
    const value = obj[field];
    return !value || (Array.isArray(value) && value.length === 0);
  });

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(", ")}`,
    };
  }
  return { isValid: true };
}

/**
 * Validate that a model has userId field
 */
export function validateModelHasUserId(modelName: string): ValidationResult {
  if (!MODELS_WITH_USER_ID.includes(modelName as any)) {
    return {
      isValid: false,
      error: `Model ${modelName} does not have a userId field`,
    };
  }
  return { isValid: true };
}

/**
 * Validate multiple IDs in an array
 */
export function validateIdArray(
  ids: string[],
  fieldName = "ids"
): ValidationResult {
  const arrayValidation = validateNonEmptyArray(ids, fieldName);
  if (!arrayValidation.isValid) {
    return arrayValidation;
  }

  const invalidIds = ids.filter(
    (id) => !id || typeof id !== "string" || id.trim() === ""
  );

  if (invalidIds.length > 0) {
    return {
      isValid: false,
      error: `Invalid IDs found: ${invalidIds.length} empty or invalid IDs`,
    };
  }

  return { isValid: true };
}

/**
 * Create an error response from validation result
 */
export function createValidationErrorResponse(
  validationResult: ValidationResult,
  statusCode = 400
) {
  return {
    success: false,
    error: validationResult.error,
    statusCode,
  };
}

/**
 * Validate and return error response if invalid, null if valid
 */
export function validateOrError(
  validationResult: ValidationResult,
  statusCode = 400
) {
  if (!validationResult.isValid) {
    return createValidationErrorResponse(validationResult, statusCode);
  }
  return null;
}

/**
 * Helper to convert SanitizationResult to error response or sanitized value
 * Uses a discriminated union with 'success' for proper TypeScript type narrowing
 */
export function sanitizeOrError<T>(
  result: SanitizationResult<T>,
  statusCode = 400
): { success: true; sanitized: T } | { success: false; error: any } {
  if (!result.isValid) {
    return {
      success: false,
      error: createValidationErrorResponse(
        { isValid: false, error: result.error },
        statusCode
      ),
    };
  }
  return { success: true, sanitized: result.sanitized };
}
