import { JobType } from "@/app/utils/responseSchemas";

export function formatJobDescriptionForAI({ job }: { job: JobType }) {
  return `Job Title: ${job.title}. ${job.department}. Here is the job description: ${job.duties}. Here is the agency description: ${job.agencyDescription}. Here is the evaluation criteria: ${job.evaluationCriteria}`;
}
