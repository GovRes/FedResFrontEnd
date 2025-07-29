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
}: JobSearchObject) {
  const hiringPath = constructHiringPath({ user });
  try {
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
