import { updateModelRecord } from "../crud/genericUpdate";
import { createOrGetJob } from "../crud/job";
import { JobType } from "./responseSchemas";

export default async function processUSAJob(
  job: JobType,
  setLoadingText: (text: string) => void
) {
  console.log("Processing USA Job:", job);
  try {
    // Create or get the job
    setLoadingText("Saving job info");
    let { data } = await createOrGetJob({ ...job }).catch((error) => {
      console.error("Error creating or getting job:", error);
      return { jobCreated: false, questionnaireFound: false, data: null };
    });
    console.log("Job created or fetched:", data);
    const wasJustCreated: boolean =
      new Date().getTime() - new Date(data.createdAt).getTime() < 1000;
    if (wasJustCreated || !data.questionnaire) {
      setLoadingText("Getting job questionnaire URL");
      const response = await fetch("/api/find-questionnaire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `https://www.usajobs.gov/job/${data.usaJobsId}`,
        }),
      });
      const resData = await response.json();
      if (resData.content) {
        setLoadingText("Saving questionnaire info");
        await updateModelRecord("Job", data.id, {
          questionnaire: resData.content,
        });
        return { jobId: data.id, jobCreated: true, questionnaireFound: true };
      } else {
        return {
          jobId: data.id,
          jobCreated: true,
          questionnaireFound: false,
        };
      }
    } else if (data.questionnaire) {
      return { jobId: data.id, jobCreated: true, questionnaireFound: true };
    }
  } catch (error) {
    console.error("Error getting questionnaire URL:", error);
  }
}
