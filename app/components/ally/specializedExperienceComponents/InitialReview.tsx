import { AllyContext } from "@/app/providers";
import { useContext, useEffect, useRef } from "react";
import { specializedExperienceExtractor } from "../../aiProcessing/specializedExperienceExtractor";
import styles from "../ally.module.css";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";

export default function InitialReview({
  setReviewing,
}: {
  setReviewing: (reviewing: boolean) => void;
}) {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const {
    job,
    specializedExperiences,
    setLoading,
    setLoadingText,
    setSpecializedExperiences,
    setStep,
  } = context;
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchSpecializedExperience() {
      if (job) {
        setLoading(true);
        setLoadingText("Fetching specialized experiences...");
        const specializedExperienceRes = await specializedExperienceExtractor({
          job,
          setLoading,
          setLoadingText,
        });
        setSpecializedExperiences(specializedExperienceRes);
        setLoading(false);
      }
    }
    fetchSpecializedExperience();
    hasFetched.current = true;
  }, [job, setLoading, setLoadingText, setSpecializedExperiences]);
  function backToSearch() {
    setStep("usa_jobs");
    setLoadingText("Returning to search");
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
        <button onClick={() => setReviewing(true)}>Yes, I do.</button>
        <button onClick={backToSearch}>
          No, I don't. Take me back to the search.
        </button>
        <button onClick={() => setReviewing(true)}>
          I have some of this experience, and I would like to continue.
        </button>
      </div>
    </div>
  );
}
