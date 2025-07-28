import { usaJobsTextFetch } from "@/app/utils/usaJobsTextFetch";
interface USAJobsPosition {
  usajobsControlNumber: number;
  positionOpenDate: string;
  positionCloseDate: string;
  hiringAgencyCode: string;
  hiringDepartmentCode: string;
  announcementNumber: string;
  summary: string;
  duties: string;
  hiringPathExplanation: string;
  majorDutiesList: string;
  requirementsConditionsOfEmployment: string;
  requirementsQualifications: string;
  requirementsEducation: string;
  requiredStandardDocuments: string;
  requiredDocuments: string;
  howToApply: string;
  howToApplyNextSteps: string;
  requirements: null | string;
  evaluations: string;
  benefitsURL: string;
  benefits: null | string;
  otherInformation: string;
  appointmentTypeOverride: null | string;
  positionScheduleOverride: null | string;
  exclusiveClarificationText: null | string;
  videoURL: string;
  JobCategories: Array<any>; // Could be more specific if you know the structure
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    console.log("Fetching job details for ID:", id);
    const results = await usaJobsTextFetch({ jobId: id });

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export function formatJobDescriptionFromTextFetch({
  job,
}: {
  job: USAJobsPosition;
}) {
  const regex = /<strong>(.*?)<\/strong>/;
  const match = job.duties.match(regex);
  console.log(54, match);
  return {
    department: job.hiringDepartmentCode,
    duties: job.duties,
    evaluationCriteria: job.evaluations,
    qualificationsSummary: job.requirementsQualifications,
    requiredDocuments: job.requiredDocuments,
    title: match ? match[1] : job.duties.substring(0, 60),
    usaJobsId: job.usajobsControlNumber.toString(),
  };
}
