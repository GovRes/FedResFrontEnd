import { AllyContext, useAlly } from "@/app/providers";
import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { specializedExperienceExtractor } from "../../aiProcessing/specializedExperienceExtractor";
import styles from "../ally.module.css";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "../../loader/Loader";
import { SpecializedExperienceContext } from "@/app/providers/specializedExperienceContext";
export default function InitialReview({}: // setReviewing,
{
  // setReviewing: (reviewing: boolean) => void;
}) {
  const { loading, job, setLoading, setLoadingText } = useAlly();
  const { specializedExperiences, setSpecializedExperiences } = useContext(
    SpecializedExperienceContext
  );
  const router = useRouter();
  // const userResumeId = "1dfd50fb-e594-412d-a62b-be45e8117dc3"; //for testing
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSpecializedExperience({ job }: { job: any }) {
      const specializedExperienceRes = await specializedExperienceExtractor({
        job,
        setLoading,
        setLoadingText,
      });
      setSpecializedExperiences(specializedExperienceRes);
    }
    fetchSpecializedExperience({ job });
  }, []);

  // tk need to figure out what to do if there is ever NOT specialized experience
  //   useEffect(() => {
  //     if (!isLoading && specializedExperiences?.length === 0) {
  //       setStep("resume");
  //     }
  //   }, [isLoading, specializedExperiences, setStep]);

  //tk redo this section like jobs section, with preserving local state and sending to provider only when ready
  function backToSearch() {
    setSpecializedExperiences([]);
    router.push("/ally/job-search");
  }
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  if (isLoading) {
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
        <button
          onClick={() =>
            router.push("/ally/specialized-experience/experience_writer")
          }
        >
          Yes, I do.
        </button>
        <button onClick={backToSearch}>
          No, I don't. Take me back to the search.
        </button>
        <button
          onClick={() =>
            router.push("/ally/specialized-experience/experience_writer")
          }
        >
          I have some of this experience, and I would like to continue.
        </button>
      </div>
    </div>
  );
}
