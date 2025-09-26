import {
  PastJobApplicationsApiResponse,
  PastJobType,
} from "@/lib/utils/responseSchemas";

export function convertPastJobsResponse(
  apiResponse: PastJobApplicationsApiResponse
): PastJobType[] {
  const pastJobs = apiResponse.data.listPastJobApplications.items.map(
    (item) => ({
      ...item.pastJob,
      type: "PastJob" as const,
    })
  );

  return pastJobs;
}
