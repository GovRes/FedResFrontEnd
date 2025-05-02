import { AwardType } from "@/app/utils/responseSchemas";
import { useEffect, useRef, useState } from "react";
import InitialReview from "./sharedComponents/InitialReview";
import Details from "./sharedComponents/Details";
import AwardForm from "./awardsComponents/AwardForm";
import AddItems from "./sharedComponents/AddItems";

import { v4 as uuidv4 } from "uuid";
import { useAlly } from "@/app/providers";
import { awardsExtractor } from "../aiProcessing/awardsExtractor";
import { TextBlinkLoader } from "../loader/Loader";

export default function Awards({}) {
  const [awardsStep, setAwardsStep] = useState("initial");
  const [localAwards, setLocalAwards] = useState<AwardType[]>([]);

  const {
    loading,
    loadingText,
    resumes,
    setAwards,
    setLoading,
    setLoadingText,
    setStep,
  } = useAlly();

  function completeAndMoveOn() {
    setAwards(localAwards);
    setStep("education");
  }
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
  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  if (awardsStep === "initial") {
    return (
      <InitialReview
        itemType="award"
        localItems={localAwards}
        setLocalItems={setLocalAwards}
        setItemsStep={setAwardsStep}
      />
    );
  } else if (awardsStep === "details") {
    return (
      <Details
        Form={AwardForm}
        itemType="award"
        localItems={localAwards}
        setLocalItems={setLocalAwards}
        setNext={() => setAwardsStep("additional")}
      />
    );
  } else {
    return (
      <AddItems<AwardType>
        baseItem={{ id: uuidv4(), title: "", date: "" }}
        Form={AwardForm}
        header="Awards"
        itemType="award"
        localItems={localAwards}
        setGlobalItems={setAwards}
        setLocalItems={setLocalAwards}
        setNext={completeAndMoveOn}
      />
    );
  }
}
