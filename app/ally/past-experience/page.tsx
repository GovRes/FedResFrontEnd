"use client";
import { useUserResume } from "@/app/providers/userResumeContext";
import { completeSteps } from "@/app/utils/stepUpdater";
import { useRouter } from "next/navigation";
export default function PastExperiencePage() {
  const router = useRouter();

  const { steps, userResumeId, setSteps } = useUserResume();
  async function moveOnJobs() {
    const updatedSteps = await completeSteps({
      steps,
      stepId: "past-experience",
      userResumeId,
    });
    setSteps(updatedSteps);
    router.push("/ally/past-experience/user-jobs");
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
