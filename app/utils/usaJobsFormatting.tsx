import { JobType, USAJobsPositionTextFetch } from "@/app/utils/responseSchemas";
import { usaJobObjectExtractor } from "@/app/components/aiProcessing/usaJobObjectExtractor";
export async function formatJobDescriptionFromTextFetch({
  job,
}: {
  job: USAJobsPositionTextFetch;
}) {
  //send AI request to discern these components from the job
  const res = await usaJobObjectExtractor({
    jobObject: job,
  });
  console.log(12, res);
  const regex = /<strong>(.*?)<\/strong>/;
  const match = job.duties?.match(regex);
  console.log(54, match);
  console.log(job.duties);
  return {
    department: job.hiringDepartmentCode,
    duties: job.duties,
    evaluationCriteria: job.evaluations,
    qualificationsSummary: job.requirementsQualifications,
    requiredDocuments: job.requiredDocuments,
    title: match ? match[1] : "No title found",
    usaJobsId: job.usajobsControlNumber.toString(),
  };
}
