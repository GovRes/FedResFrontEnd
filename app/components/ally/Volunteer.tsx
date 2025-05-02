import React, { useState, useEffect, useRef, useContext } from "react";
import InitialReview from "./sharedComponents/InitialReview";
import Details from "./sharedComponents/Details";
import VolunteersForm from "./volunteersComponents/VolunteersForm";
import { UserJobType } from "@/app/utils/responseSchemas";
import { useAlly } from "@/app/providers";
import { volunteersExtractor } from "../aiProcessing/volunteersExtractor";
import { TextBlinkLoader } from "../loader/Loader";
import AddItems from "./sharedComponents/AddItems";
const Volunteer = () => {
  const [volunteersStep, setVolunteersStep] = useState("initial");
  const [localVolunteers, setLocalVolunteers] = useState<UserJobType[]>([]);

  const {
    loading,
    loadingText,
    resumes,
    setLoading,
    setLoadingText,
    setStep,
    setVolunteers,
  } = useAlly();

  function setNext() {
    setVolunteers(localVolunteers);
    setStep("volunteer_details");
  }
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchUserJobs() {
      if (resumes) {
        const volunteersRes = await volunteersExtractor({
          resumes,
          setLoading,
          setLoadingText,
        });
        setLocalVolunteers(volunteersRes);
      }
    }
    fetchUserJobs();
    hasFetched.current = true;
  }, [resumes, setLoading, setLoadingText, setLocalVolunteers]);

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  if (volunteersStep === "initial") {
    return (
      <InitialReview
        itemType="volunteer experience"
        localItems={localVolunteers}
        setLocalItems={setLocalVolunteers}
        setItemsStep={setVolunteersStep}
      />
    );
  } else if (volunteersStep === "details") {
    return (
      <Details
        Form={VolunteersForm}
        itemType="volunteer experience"
        localItems={localVolunteers}
        setLocalItems={setLocalVolunteers}
        setNext={() => setVolunteersStep("additional")}
      />
    );
  } else if (volunteersStep === "additional") {
    return (
      <AddItems<UserJobType>
        baseItem={
          {
            id: crypto.randomUUID(),
            title: "",
            organization: "",
            startDate: "",
            endDate: "",
            responsibilities: "",
            userJobQualifications: [],
          } as UserJobType
        }
        Form={VolunteersForm}
        header="Add volunteer experience"
        itemType="volunteer experience"
        localItems={localVolunteers}
        setGlobalItems={setVolunteers}
        setLocalItems={setLocalVolunteers}
        setNext={setNext}
      />
    );
  }
};

export default Volunteer;
