import axios, { AxiosError } from "axios";
import { Result } from "@/app/ally/job-search/results/components/UsaJobsResults";
import { JobSearchObject } from "./responseSchemas";

var host = "data.usajobs.gov";
var userAgent = process.env.USA_JOBS_EMAIL;
var authKey = process.env.USA_JOBS_API_KEY;

// Configuration for retry logic
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  timeoutMultiplier: 1.5, // Increase timeout by 50% on each retry
};

// Create axios instance with initial timeout
const createInstance = (timeout: number = 30000) => {
  return axios.create({
    baseURL: "https://data.usajobs.gov/api/",
    timeout,
    headers: {
      Host: host,
      "User-Agent": userAgent,
      "Authorization-Key": authKey,
    },
  });
};

// Sleep utility for delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Calculate exponential backoff delay
const calculateDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

// Check if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) {
    // Network errors, timeouts, etc.
    return true;
  }

  const status = error.response.status;
  // Retry on server errors and rate limiting
  return status >= 500 || status === 429 || status === 408;
};

function constructHiringPath({ user }: { user: any }) {
  console.log(user);
  //may want to add profile attributes and hiring paths for national guard, native Americans, students, peace corps, family of overseas, recent grads, fed competitive, fed excepted, etc.
  let hiringPath = "public";
  if (user.disabled === "true") {
    hiringPath += ";disability";
  }
  if (user.veteran === "true") {
    hiringPath += ";vet";
  }
  if (user.militarySpouse === "true") {
    hiringPath += ";mspouse";
  }
  return hiringPath;
}

export async function usaJobsSearch({
  keyword,
  locationName,
  organization,
  positionScheduleType,
  positionTitle,
  radius,
  remote,
  travelPercentage,
  user,
  maxRetries = RETRY_CONFIG.maxRetries,
  initialTimeout = 30000,
}: JobSearchObject & {
  maxRetries?: number;
  initialTimeout?: number;
}) {
  const hiringPath = constructHiringPath({ user });
  let lastError: Error | null = null;
  let currentTimeout = initialTimeout;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create new instance with current timeout
      const instance = createInstance(currentTimeout);

      console.log(
        `USA Jobs search attempt ${attempt + 1}/${maxRetries + 1} with timeout ${currentTimeout}ms`
      );

      const response = await instance.get("search", {
        params: {
          ...(hiringPath && { HiringPath: hiringPath }),
          ...(keyword && { Keyword: keyword }),
          ...(locationName && { LocationName: locationName }),
          ...(organization && { Organization: organization }),
          ...(positionScheduleType && {
            PositionScheduleType: positionScheduleType,
          }),
          ...(positionTitle && { PositionTitle: positionTitle }),
          ...(radius && { Radius: radius }),
          ...(remote && { Remote: remote }),
          ...(travelPercentage && { TravelPercentage: travelPercentage }),
          SortField: "salarymin",
          SortDirection: "Desc",
        },
      });

      console.log(`USA Jobs search successful on attempt ${attempt + 1}`);
      return response.data.SearchResult.SearchResultItems;
    } catch (error) {
      lastError = error as Error;
      const axiosError = error as AxiosError;

      console.error(`USA Jobs search attempt ${attempt + 1} failed:`, {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        timeout: currentTimeout,
      });

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error("All USA Jobs search attempts failed");
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(axiosError)) {
        console.error("Non-retryable error encountered, stopping retries");
        throw error;
      }

      // Calculate delay and increase timeout for next attempt
      const delay = calculateDelay(attempt);
      currentTimeout = Math.floor(
        currentTimeout * RETRY_CONFIG.timeoutMultiplier
      );

      console.log(
        `Retrying in ${delay}ms with increased timeout ${currentTimeout}ms`
      );
      await sleep(delay);
    }
  }

  // Create a more descriptive error message
  if (lastError) {
    const errorMessage =
      lastError instanceof AxiosError
        ? `USA Jobs API request failed after ${maxRetries + 1} attempts. ${
            lastError.code === "ECONNABORTED"
              ? "Request timed out."
              : `Error: ${lastError.message}`
          }`
        : `USA Jobs API request failed after ${maxRetries + 1} attempts: ${lastError.message}`;

    throw new Error(errorMessage);
  }

  // This should never happen, but just in case
  throw new Error(
    `USA Jobs API request failed after ${maxRetries + 1} attempts with unknown error`
  );
}

export function formatJobDescription({ job }: { job: Result }) {
  try {
    return {
      agencyDescription:
        job.MatchedObjectDescriptor?.UserArea?.Details
          ?.AgencyMarketingStatement || "N/A",
      department: job.MatchedObjectDescriptor?.DepartmentName || "N/A",
      duties:
        job.MatchedObjectDescriptor?.UserArea?.Details?.MajorDuties?.join(
          "; "
        ) || "N/A",
      evaluationCriteria:
        job.MatchedObjectDescriptor?.UserArea?.Details?.Evaluations || "N/A",
      qualificationsSummary:
        job.MatchedObjectDescriptor?.QualificationSummary || "N/A",
      requiredDocuments:
        job.MatchedObjectDescriptor?.UserArea?.Details?.RequiredDocuments ||
        "N/A",
      title: job.MatchedObjectDescriptor?.PositionTitle || "N/A",
      usaJobsId: job.MatchedObjectId || "N/A",
    };
  } catch (error) {
    console.error("Error formatting job description:", error);
    return {
      agencyDescription: "Error loading data",
      department: "Error loading data",
      duties: "Error loading data",
      evaluationCriteria: "Error loading data",
      qualificationsSummary: "Error loading data",
      requiredDocuments: "Error loading data",
      title: "Error loading data",
      usaJobsId: job.MatchedObjectId || "N/A",
    };
  }
}
