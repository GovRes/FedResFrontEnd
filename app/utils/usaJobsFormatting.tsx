import { USAJobsPositionTextFetch } from "@/app/utils/responseSchemas";
export function formatJobDescriptionFromTextFetch({
  job,
}: {
  job: USAJobsPositionTextFetch;
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
