import React, { useState, useEffect, useRef, useContext } from "react";
import InitialReview from "./sharedComponents/InitialReview";
import Editing from "./userJobsComponents/Editing";
import Details from "./sharedComponents/Details";
import VolunteersForm from "./volunteersComponents/VolunteersForm";
import { VolunteerType } from "@/app/utils/responseSchemas";
import { AllyContext } from "@/app/providers";
import { volunteersExtractor } from "../aiProcessing/volunteersExtractor";
import { TextBlinkLoader } from "../loader/Loader";
const Volunteers = () => {
  const [volunteersStep, setVolunteersStep] = useState("initial");
  const [localVolunteers, setLocalVolunteers] = useState<VolunteerType[]>([]);
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { loading, loadingText, resumes, setLoading, setLoadingText } = context;
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchVolunteers() {
      if (resumes) {
        const volunteersRes = await volunteersExtractor({
          resumes,
          setLoading,
          setLoadingText,
        });
        setLocalVolunteers(volunteersRes);
      }
    }
    fetchVolunteers();
    hasFetched.current = true;
  }, [resumes, setLoading, setLoadingText, setLocalVolunteers]);

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  if (volunteersStep === "initial") {
    return (
      <InitialReview
        itemType="past job"
        localItems={localVolunteers}
        setLocalItems={setLocalVolunteers}
        setItemsStep={setVolunteersStep}
      />
    );
  } else if (volunteersStep === "details") {
    return (
      <Details
        Form={VolunteersForm}
        itemType="past job"
        localItems={localVolunteers}
        setLocalItems={setLocalVolunteers}
        setItemsStep={setVolunteersStep}
      />
    );
  } else {
    return (
      // since volunteer experiences and work experiences have nearly all the same parameters other than GS level, we're just going to reuse the UserJobsType
      <Editing
        localUserJobs={localVolunteers}
        nextStep="return_resume"
        setLocalUserJobs={setLocalVolunteers}
      />
    );
  }
};

export default Volunteers;
