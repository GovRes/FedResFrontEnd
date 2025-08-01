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
      console.error(`Attempt ${attempt + 1} failed:`, error);

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
