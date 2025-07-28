import { updateModelRecord } from "../crud/genericUpdate";
import { createOrGetJob } from "../crud/job";
import { JobType } from "./responseSchemas";

export default async function processUSAJob(job: JobType) {
  console.log("Processing USA Job:", job);
  try {
    // Create or get the job
    let jobRes = await createOrGetJob({ ...job });
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
        await updateModelRecord("Job", jobRes.id, {
          questionnaire: resData.content,
        });
      }
    }
  } catch (error) {
    console.error("Error getting questionnaire URL:", error);
  }
}
