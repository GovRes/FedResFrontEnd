import axios from "axios";
import { Result } from "@/app/ally/job-search/results/components/UsaJobsResults";
import { JobSearchObject } from "./responseSchemas";
var host = "data.usajobs.gov";
var userAgent = process.env.USA_JOBS_EMAIL;
var authKey = process.env.USA_JOBS_API_KEY;
const instance = axios.create({
  baseURL: "https://data.usajobs.gov/api/",
  timeout: 100000,
  headers: {
    Host: host,
    "User-Agent": userAgent,
    "Authorization-Key": authKey,
  },
});

function constructHiringPath({ user }: { user: any }) {
  //may want to add profile attributes and hiring paths for national guard, native Americans, students, peace corps, family of overseas, recent grads, fed competitive, fed excepted, etc.
  let hiringPath = "public";
  if (user["custom:disabled"] === "true") {
    hiringPath += ";disability";
  }
  if (user["custom:veteran"] === "true") {
    hiringPath += ";vet";
  }
  if (user["custom:militarySpouse"] === "true") {
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
}: JobSearchObject) {
  const hiringPath = constructHiringPath({ user });
  console.log(
    keyword,
    locationName,
    organization,
    positionScheduleType,
    positionTitle,
    radius,
    remote,
    travelPercentage
  );
  try {
    const response = await instance.get("search", {
      params: {
        HiringPath: hiringPath,
        Keyword: keyword,
        LocationName: locationName,
        Organization: organization,
        PositionScheduleType: positionScheduleType,
        PositionTitle: positionTitle,
        Radius: radius,
        Remote: remote,
        TravelPercentage: travelPercentage,
        SortField: "salarymin",
        SortDirection: "Desc",
      },
    });
    return response.data.SearchResult.SearchResultItems;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function formatJobDescription({ job }: { job: Result }) {
  return {
    agencyDescription:
      job.MatchedObjectDescriptor.UserArea.Details.AgencyMarketingStatement,
    department: job.MatchedObjectDescriptor.DepartmentName,
    duties: job.MatchedObjectDescriptor.UserArea.Details.MajorDuties.join("; "),
    evaluationCriteria:
      job.MatchedObjectDescriptor.UserArea.Details.Evaluations,
    qualificationsSummary: job.MatchedObjectDescriptor.QualificationSummary,
    requiredDocuments:
      job.MatchedObjectDescriptor.UserArea.Details.RequiredDocuments,
    title: job.MatchedObjectDescriptor.PositionTitle,
    usaJobsId: job.MatchedObjectId,
  };
}
