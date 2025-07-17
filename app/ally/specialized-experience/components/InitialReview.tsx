import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Tooltip } from "react-tooltip";
import { GrCircleQuestion } from "react-icons/gr";
import { specializedExperienceExtractor } from "@/app/components/aiProcessing/specializedExperienceExtractor";
import styles from "../../ally.module.css";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";

import { SpecializedExperienceContext } from "@/app/providers/specializedExperienceContext";
import { useApplication } from "@/app/providers/applicationContext";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";
import { createAndSaveSpecializedExperiences } from "@/app/crud/specializedExperience";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function InitialReview() {
  const { job } = useApplication();
  const { user } = useAuthenticator();
  const { specializedExperiences, setSpecializedExperiences } = useContext(
    SpecializedExperienceContext
  );
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [extractorCompleted, setExtractorCompleted] = useState(false);
  const extractorRan = useRef(false);
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
  const { applicationId, completeStep } = useApplication();

  async function storeSpecializedExperiences() {
    setLoading(true);
    try {
      await createAndSaveSpecializedExperiences({
        specializedExperiences,
        applicationId,
        userId: user.userId,
      });
      await completeStep("specialized-experience");
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
    // Prevent running multiple times
    if (!job || extractorRan.current) return;
    extractorRan.current = true;
    setLoading(true);

    async function fetchSpecializedExperience() {
      try {
        const specializedExperienceRes = await specializedExperienceExtractor({
          job,
        });

        setSpecializedExperiences(specializedExperienceRes);
        setExtractorCompleted(true);

        // Only auto-complete if there are truly no specialized experiences
        if (
          !specializedExperienceRes ||
          specializedExperienceRes.length === 0
        ) {
          await completeStep("specialized-experience");
          navigateToNextIncompleteStep("specialized-experience");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching specialized experiences:", error);
        setLoading(false);
        setExtractorCompleted(true);
      }
    }

    fetchSpecializedExperience();
  }, [job]); // Simplified dependencies

  // Show loading while extractor is running
  if (loading || !extractorCompleted) {
    return <Loader text="Loading specialized experiences..." />;
  }

  // If no specialized experiences were found after extraction completed
  if (!specializedExperiences || specializedExperiences.length === 0) {
    return (
      <div className={styles.allyChatContainer}>
        <p>No specialized experience requirements found for this position.</p>
        <button
          onClick={async () => {
            await completeStep("specialized-experience");
            navigateToNextIncompleteStep("specialized-experience");
          }}
        >
          Continue to next step
        </button>
      </div>
    );
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
            <li key={experience.id}>
              {experience.title}
              <a
                data-tooltip-id={`${experience.id}-description`}
                data-tooltip-content={experience.description}
              >
                {" "}
                <GrCircleQuestion />
              </a>
              <Tooltip id={`${experience.id}-description`} />
            </li>
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
