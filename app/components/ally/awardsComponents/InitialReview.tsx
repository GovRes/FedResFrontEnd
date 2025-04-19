import { AllyContext } from "@/app/providers";
import { FormEvent, useContext, useEffect, useRef, useState } from "react";
import { awardsExtractor } from "../../aiProcessing/awardsExtractor";
import styles from "../ally.module.css";
import { AwardType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "../../loader/Loader";
import { Checkboxes, SubmitButton } from "../../forms/Inputs";
import BaseForm from "../../forms/BaseForm";
import { getCheckboxValues } from "@/app/utils/formUtils";

export default function InitialReview({
  localAwards,
  setLocalAwards,
  setAwardsStep,
}: {
  localAwards: AwardType[];
  setLocalAwards: Function;
  setAwardsStep: Function;
}) {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const {
    job,
    loading,
    loadingText,
    resumes,
    setLoading,
    setLoadingText,
    setStep,
  } = context;
  const [awardOptions, setAwardOptions] = useState(
    localAwards.map((award) => ({
      id: award.id,
      name: award.title,
    }))
  );
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchAwards() {
      if (resumes) {
        const awardsRes = await awardsExtractor({
          resumes,
          setLoading,
          setLoadingText,
        });
        if (awardsRes.length === 0) {
          setAwardsStep("additional");
        }
        setLocalAwards(awardsRes);
      }
    }
    fetchAwards();
    hasFetched.current = true;
  }, [resumes, setLoading, setLoadingText, setLocalAwards]);

  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }

  useEffect(() => {
    setAwardOptions(
      localAwards.map((award) => ({ id: award.id, name: award.title }))
    );
  }, [localAwards]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.scrollTo(0, 0);
    const values = getCheckboxValues(event);
    // Filter out jobs whose IDs are in the values array
    const updatedAwards = localAwards.filter(
      (award) => !values.includes(award.id)
    );
    setLocalAwards(updatedAwards);
    if (updatedAwards.length === 0) {
      setAwardsStep("additional");
    } else {
      setAwardsStep("details");
    }
  };

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  if (localAwards.length > 0) {
    return (
      <>
        <div className={styles.allyChatContainer}>
          Here are the awards we extracted from your resume. Please select any
          that you DO NOT think will be relevant{" "}
          {job && <>in your application for {job.title}</>}
        </div>
        <div className={`${styles.userChatContainer} ${styles.fade}`}>
          <BaseForm onSubmit={onSubmit}>
            <Checkboxes additionalClassName="negative" options={awardOptions} />
            <SubmitButton type="submit">Submit</SubmitButton>
          </BaseForm>
        </div>
      </>
    );
  } else {
    return <div> no jobs found</div>;
  }
}
