import React, { useContext, useEffect, useRef } from "react";
import styles from "./ally.module.css";
import { specializedExperienceExtractor } from "../aiProcessing/specializedExperienceExtractor";
import { AllyContext } from "@/app/providers";
import SpecializedExperienceItem from "./specializedExperienceComponents/SpecializedExperienceItem";

const SpecializedExperience = React.memo(() => {
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

  if (!specializedExperiences) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`${styles.allyChatContainer}`}>
      <div>
        In order to qualify for this job, you must have the following
        specialized experience. If you do not have this experience, we strongly
        recommend that you do not apply.
      </div>
      <div>
        {specializedExperiences.map((experience) => (
          <SpecializedExperienceItem
            key={experience.id}
            experience={experience}
          />
        ))}
      </div>
    </div>
  );
});

export default SpecializedExperience;
