import { updateModelRecord } from "../crud/genericUpdate";
import { createOrGetJob } from "../crud/job";
import { JobType } from "./responseSchemas";

export default async function processUSAJob(job: JobType) {
  console.log("Processing USA Job:", job);
  try {
    // Create or get the job
    let jobRes = await createOrGetJob({ ...job }).catch((error) => {
      console.error("Error creating or getting job:", error);
      return { jobCreated: false, questionnaireFound: false };
    });
    console.log("Job created or fetched:", jobRes);
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
        return { jobId: jobRes.id, jobCreated: true, questionnaireFound: true };
      } else {
        return {
          jobId: jobRes.id,
          jobCreated: true,
          questionnaireFound: false,
        };
      }
    } else if (jobRes.questionnaire) {
      return { jobId: jobRes.id, jobCreated: true, questionnaireFound: true };
    }
  } catch (error) {
    console.error("Error getting questionnaire URL:", error);
  }
}
