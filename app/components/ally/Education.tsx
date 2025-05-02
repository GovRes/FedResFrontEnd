import { EducationType } from "@/app/utils/responseSchemas";
import { useEffect, useRef, useState } from "react";
import InitialReview from "./sharedComponents/InitialReview";
import Details from "./sharedComponents/Details";
import EducationForm from "./educationComponents/EducationForm";
import AddItems from "./sharedComponents/AddItems";

import { v4 as uuidv4 } from "uuid";
import { useAlly } from "@/app/providers";
import { educationExtractor } from "../aiProcessing/educationExtractor";
import { TextBlinkLoader } from "../loader/Loader";

export default function Educations({}) {
  const [educationsStep, setEducationsStep] = useState("initial");
  const [localEducations, setLocalEducations] = useState<EducationType[]>([]);

  const {
    loading,
    loadingText,
    resumes,
    setEducations,
    setLoading,
    setLoadingText,
    setStep,
  } = useAlly();

  function completeAndMoveOn() {
    console.log("complete");
    setEducations(localEducations);
    setStep("volunteer");
  }

  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;

    const fetchEducations = async () => {
      if (resumes) {
        const educationsRes = await educationExtractor({
          resumes,
          setLoading,
          setLoadingText,
        });
        console.log(educationsRes);
        if (educationsRes?.length === 0) {
          setEducationsStep("additional");
        }
        setLocalEducations(educationsRes);
      }
      hasFetched.current = true;
    };

    fetchEducations();
  }, [resumes, setLoading, setLoadingText, setLocalEducations]);
  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  if (educationsStep === "initial") {
    return (
      <InitialReview
        itemType="educational experience"
        localItems={localEducations}
        setLocalItems={setLocalEducations}
        setItemsStep={setEducationsStep}
      />
    );
  } else if (educationsStep === "details") {
    return (
      <Details
        Form={EducationForm}
        itemType="educational experience"
        localItems={localEducations}
        setLocalItems={setLocalEducations}
        setNext={() => setEducationsStep("additional")}
      />
    );
  } else {
    return (
      <AddItems<EducationType>
        baseItem={{
          id: uuidv4(),
          degree: "",
          major: "",
          school: "",
          title: "",
          date: "",
        }}
        Form={EducationForm}
        header="Educations"
        itemType="education"
        localItems={localEducations}
        setGlobalItems={setEducations}
        setLocalItems={setLocalEducations}
        setNext={completeAndMoveOn}
      />
    );
  }
}
