import axios from "axios";

var host = "data.usajobs.gov";
var userAgent = process.env.USA_JOBS_EMAIL;
var authKey = process.env.USA_JOBS_API_KEY;

const instance = axios.create({
  baseURL: "https://data.usajobs.gov/api/",
  timeout: 30000, // Reduced from 100000ms to 30000ms (30 seconds)
  headers: {
    Host: host,
    "User-Agent": userAgent,
    "Authorization-Key": authKey,
  },
});

// Helper function to wait between retries
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to check if an error is retryable
const isRetryableError = (error: any): boolean => {
  if (axios.isAxiosError(error)) {
    // Retry on network errors, timeouts, and certain HTTP status codes
    return (
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNRESET" ||
      error.code === "ENOTFOUND" ||
      error.code === "ECONNREFUSED" ||
      !error.response || // Network error
      error.response.status >= 500 || // Server errors
      error.response.status === 429 // Rate limiting
    );
  }
  return false;
};

export async function usaJobsTextFetch({
  jobId,
  maxRetries = 3,
  baseDelay = 1000,
}: {
  jobId: string;
  maxRetries?: number;
  baseDelay?: number;
}) {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} for job ID: ${jobId}`);

      const response = await instance.get(
        `HistoricJoa/AnnouncementText/${jobId}`
      );
      return response.data;
    } catch (error) {
      lastError = error;

      // Enhanced error logging to handle AggregateError
      logDetailedError(error, attempt + 1, jobId);

      // If this is the last attempt or error is not retryable, throw the error
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.log(`Retrying in ${delayMs}ms...`);
      await delay(delayMs);
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}

function logDetailedError(error: any, attemptNumber: number, jobId: string) {
  console.error(`Attempt ${attemptNumber} failed for job ID ${jobId}:`);

  if (error instanceof AggregateError) {
    console.error(
      `AggregateError with ${error.errors.length} individual errors:`
    );
    console.error(`Main message: ${error.message}`);

    // Log each individual error
    error.errors.forEach((individualError, index) => {
      console.error(`  Error ${index + 1}:`, {
        name: individualError.name,
        message: individualError.message,
        stack: individualError.stack,
        code: individualError.code,
        status: individualError.status,
        // Include any other relevant properties
        ...individualError,
      });
    });
  } else {
    // Handle regular errors
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status,
      // Include the full error object for any additional properties
      fullError: error,
    });
  }
}

// Alternative: More structured logging approach
function logDetailedErrorStructured(
  error: any,
  attemptNumber: number,
  jobId: string
) {
  const baseLogData = {
    jobId,
    attemptNumber,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AggregateError) {
    console.error("AggregateError occurred:", {
      ...baseLogData,
      errorType: "AggregateError",
      mainMessage: error.message,
      individualErrorCount: error.errors.length,
    });

    error.errors.forEach((individualError, index) => {
      console.error(`Individual error ${index + 1}:`, {
        ...baseLogData,
        errorIndex: index,
        name: individualError.name,
        message: individualError.message,
        code: individualError.code,
        status: individualError.status,
        stack: individualError.stack,
      });
    });
  } else {
    console.error("Single error occurred:", {
      ...baseLogData,
      errorType: "SingleError",
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
    });
  }
}
