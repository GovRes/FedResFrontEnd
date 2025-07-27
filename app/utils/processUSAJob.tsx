import { createOrGetJob } from "../crud/job";
import { JobType } from "./responseSchemas";
import { formatJobDescription } from "./usaJobsSearch";
import { Result } from "@/app/ally/job-search/results/components/UsaJobsResults";

export default async function processUSAJob(job: Response) {
  console.log("Processing USA Job:", job);
  let formattedJobDescription = formatJobDescription({ job: job as Result });
  try {
    // Create or get the job
    let jobRes = await createOrGetJob({ ...formattedJobDescription });
    const wasJustCreated: boolean =
      new Date().getTime() - new Date(jobRes.createdAt).getTime() < 1000;
    if (wasJustCreated || !jobRes.questionnaire) {
      const response = await fetch("/api/find-questionnaire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `https://www.usajobs.gov/job/${jobRes.usaJobsId}`,
        }),
      });
      const resData = await response.json();
      if (resData.content) {
        // save to job
      }
    }
  } catch (error) {
    console.error("Error getting questionnaire URL:", error);
  }
}
