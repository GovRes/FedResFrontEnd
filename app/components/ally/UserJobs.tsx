import React, { useState, useEffect, useRef, useContext } from "react";
import InitialReview from "./sharedComponents/InitialReview";
import Details from "./sharedComponents/Details";
import UserJobsForm from "./userJobsComponents/UserJobsForm";
import { UserJobType } from "@/app/utils/responseSchemas";
import { useAlly } from "@/app/providers";
import { userJobsExtractor } from "../aiProcessing/userJobsExtractor";
import { TextBlinkLoader } from "../loader/Loader";
import AddItems from "./sharedComponents/AddItems";
const UserJobs = () => {
  // const [userJobsStep, setUserJobsStep] = useState("initial");
  const [userJobsStep, setUserJobsStep] = useState("initial");
  const [localUserJobs, setLocalUserJobs] = useState<UserJobType[]>([]);

  const {
    loading,
    loadingText,
    resumes,
    setLoading,
    setLoadingText,
    setStep,
    setUserJobs,
  } = useAlly();

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
  } else if (userJobsStep === "details") {
    return (
      <Details
        Form={UserJobsForm}
        itemType="past job"
        localItems={localUserJobs}
        setLocalItems={setLocalUserJobs}
        setNext={setNext}
      />
    );
  } else if (userJobsStep === "additional") {
    return (
      <AddItems<UserJobType>
        baseItem={
          {
            id: crypto.randomUUID(),
            title: "",
            organization: "",
            startDate: "",
            endDate: "",
            gsLevel: "",
            responsibilities: "",
            userJobQualifications: [],
          } as UserJobType
        }
        Form={UserJobsForm}
        header="Add a past job"
        itemType="past job"
        localItems={localUserJobs}
        setGlobalItems={setUserJobs}
        setLocalItems={setLocalUserJobs}
        setNext={setNext}
      />
    );
  }
};

export default UserJobs;
