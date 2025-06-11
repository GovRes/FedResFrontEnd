import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { specializedExperienceExtractor } from "@/app/components/aiProcessing/specializedExperienceExtractor";
import styles from "../../ally.module.css";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";

import { SpecializedExperienceContext } from "@/app/providers/specializedExperienceContext";
import { useApplication } from "@/app/providers/applicationContext";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";
import { completeSteps } from "@/app/utils/stepUpdater";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { createAndSaveSpecializedExperiences } from "@/app/crud/specializedExperience";
import { useAuthenticator } from "@aws-amplify/ui-react";
export default function InitialReview({}: // setReviewing,
{
  // setReviewing: (reviewing: boolean) => void;
}) {
  const { job } = useApplication();
  const { user } = useAuthenticator();
  const { specializedExperiences, setSpecializedExperiences } = useContext(
    SpecializedExperienceContext
  );
  const router = useRouter();
  // const applicationId = "1dfd50fb-e594-412d-a62b-be45e8117dc3"; //for testing
  const [loading, setLoading] = useState(true);
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
  const { steps, applicationId, setSteps } = useApplication();
  async function completeStep() {
    const updatedSteps = await completeSteps({
      steps,
      stepId: "specialized-experience",
      applicationId,
    });
    await setSteps(updatedSteps);
  }
  async function storeSpecializedExperiences() {
    setLoading(true);
    try {
      await createAndSaveSpecializedExperiences({
        specializedExperiences,
        applicationId,
        userId: user.userId,
      });
      await completeStep();
      navigateToNextIncompleteStep("specialized-experience");
    } catch (error) {
      console.error("Error storing specialized experiences:", error);
    } finally {
      setLoading(false);
    }
  }

  function backToSearch() {
    setSpecializedExperiences([]);
    router.push("/ally/job-search");
  }
  useEffect(() => {
    setLoading(true);
    async function fetchSpecializedExperience({ job }: { job: any }) {
      const specializedExperienceRes = await specializedExperienceExtractor({
        job,
      });
      setSpecializedExperiences(specializedExperienceRes);
      setLoading(false);
    }
    fetchSpecializedExperience({ job });
  }, []);

  if (loading) {
    return <TextBlinkLoader text="Loading specialized experiences..." />;
  }
  return (
    <div className={styles.allyChatContainer}>
      This job requires the following specialized experience. We do not
      recommend that you apply if you do not have all experience that can apply
      to all of these areas.
      <div>
        Specialized Experience:
        {specializedExperiences?.map(
          (experience: SpecializedExperienceType) => (
            <li key={experience.id}>{experience.title}</li>
          )
        )}
      </div>
      <div>Do you have experience in all of these areas?</div>
      <div>
        <button onClick={() => storeSpecializedExperiences()}>
          Yes, I do.
        </button>
        <button onClick={backToSearch}>
          No, I don't. Take me back to the search.
        </button>
        <button onClick={() => storeSpecializedExperiences()}>
          I have some of this experience, and I would like to continue.
        </button>
      </div>
    </div>
  );
}
