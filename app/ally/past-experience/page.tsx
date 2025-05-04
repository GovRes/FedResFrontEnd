"use client";
import { useApplication } from "@/app/providers/applicationContext";
import { completeSteps } from "@/app/utils/stepUpdater";
import { useRouter } from "next/navigation";
export default function PastExperiencePage() {
  const router = useRouter();

  const { steps, applicationId, setSteps } = useApplication();
  async function moveOnJobs() {
    const updatedSteps = await completeSteps({
      steps,
      stepId: "past-experience",
      applicationId,
    });
    setSteps(updatedSteps);
    router.push("/ally/past-experience/past-jobs");
  }
  function moveOnResumes() {
    router.push("/ally/past-experience/resumes");
  }
  return (
    <div>
      <h3>Past Experience</h3>
      <p>Select how you want to share your relevant prior work experience.</p>
      <button onClick={moveOnResumes}>Upload or select resume</button>
      <button onClick={moveOnJobs}>
        Select from already entered jobs, awards, educational experiences, and
        volunteer experiences.
      </button>
    </div>
  );
}
