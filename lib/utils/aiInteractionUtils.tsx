import { JobType } from "@/lib/utils/responseSchemas";

export function formatJobDescriptionForAI({ job }: { job: JobType }) {
  return `Job Title: ${job.title}. ${job.department}. Here is the qualifications summary: ${job.qualificationsSummary}.Here is the questionnaire: ${job.questionnaire}.`;
}
