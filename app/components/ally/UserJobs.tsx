import React, { useState, useEffect, useRef, useContext } from "react";
import InitialReview from "./sharedComponents/InitialReview";
import Editing from "./userJobsComponents/Editing";
import Details from "./sharedComponents/Details";
import UserJobsForm from "./volunteersComponents/VolunteersForm";
import { UserJobType } from "@/app/utils/responseSchemas";
import { AllyContext } from "@/app/providers";
import { userJobsExtractor } from "../aiProcessing/userJobsExtractor";
import { TextBlinkLoader } from "../loader/Loader";
const UserJobs = () => {
  // const [userJobsStep, setUserJobsStep] = useState("initial");
  const [userJobsStep, setUserJobsStep] = useState("initial");
  const [localUserJobs, setLocalUserJobs] = useState<UserJobType[]>([]);
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const {
    loading,
    loadingText,
    resumes,
    setLoading,
    setLoadingText,
    setStep,
    setUserJobs,
  } = context;

  function setNext() {
    setUserJobs(localUserJobs);
    setStep("user_job_details");
  }
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

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  if (userJobsStep === "initial") {
    return (
      <InitialReview
        itemType="past job"
        localItems={localUserJobs}
        setLocalItems={setLocalUserJobs}
        setItemsStep={setUserJobsStep}
      />
    );
  } else {
    return (
      <Details
        Form={UserJobsForm}
        itemType="past job"
        localItems={localUserJobs}
        setLocalItems={setLocalUserJobs}
        setNext={setNext}
      />
    );
  }
};

export default UserJobs;
