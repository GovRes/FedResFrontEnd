import { AllyContext } from "@/app/providers";
import { FormEvent, useContext, useEffect, useRef, useState } from "react";
import { userJobsExtractor } from "../../aiProcessing/userJobsExtractor";
import styles from "../ally.module.css";
import { UserJobType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "../../loader/Loader";
import { Checkboxes, SubmitButton } from "../../forms/Inputs";
import BaseForm from "../../forms/BaseForm";
import { getCheckboxValues } from "@/app/utils/formUtils";

export default function InitialReview({
  localUserJobs,
  setLocalUserJobs,
  setUserJobsStep,
}: {
  localUserJobs: UserJobType[];
  setLocalUserJobs: Function;
  setUserJobsStep: Function;
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
  const userJobName = (job: UserJobType) => {
    return `${job.title} at ${job.organization}`;
  };
  const [userJobOptions, setUserJobOptions] = useState(
    localUserJobs.map((job) => ({
      id: job.id,
      name: userJobName(job),
    }))
  );
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchUserJobs() {
      if (resumes) {
        const userJobsRes = await userJobsExtractor({
          resumes,
          setLoading,
          setLoadingText,
        });
        setLocalUserJobs(userJobsRes);
      }
    }
    fetchUserJobs();
    hasFetched.current = true;
  }, [resumes, setLoading, setLoadingText, setLocalUserJobs]);

  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }

  useEffect(() => {
    setUserJobOptions(
      localUserJobs.map((job) => ({ id: job.id, name: userJobName(job) }))
    );
  }, [localUserJobs]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.scrollTo(0, 0);
    const values = getCheckboxValues(event);
    values
      .map((value) => {
        let item = localUserJobs.find((obj) => obj.id === value);
        if (item) {
          let index = localUserJobs.indexOf(item);
          let updatedUserJobs = localUserJobs.filter((_, i) => i !== index);
          setLocalUserJobs(updatedUserJobs);
        }
        return item;
      })
      .filter((obj): obj is UserJobType => obj !== undefined);
    setUserJobsStep("details");
  };

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  if (localUserJobs.length > 0) {
    return (
      <>
        <div className={styles.allyChatContainer}>
          Here are the jobs we extracted from your resume. Please select any
          that you do not think will be relevant{" "}
          {job && <>in your application for {job.title}</>}
        </div>
        <div className={`${styles.userChatContainer} ${styles.fade}`}>
          <BaseForm onSubmit={onSubmit}>
            <Checkboxes
              additionalClassName="negative"
              options={userJobOptions}
            />
            <SubmitButton type="submit">Submit</SubmitButton>
          </BaseForm>
        </div>
      </>
    );
  } else {
    return <div> no jobs found</div>;
  }
}
