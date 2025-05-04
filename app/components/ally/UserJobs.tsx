import React, { useState, useEffect, useRef, useContext } from "react";
import InitialReview from "./sharedComponents/InitialReview";
import Details from "./sharedComponents/Details";
// import PastJobsForm from "./PastJobsComponents/PastJobsForm";
import { PastJobType } from "@/app/utils/responseSchemas";
import { useAlly } from "@/app/providers";
import { pastJobsExtractor } from "../aiProcessing/pastJobsExtractor";
import { TextBlinkLoader } from "../loader/Loader";
import AddItems from "./sharedComponents/AddItems";
const PastJobs = () => {
  // const [PastJobsStep, setPastJobsStep] = useState("initial");
  const [PastJobsStep, setPastJobsStep] = useState("initial");
  const [localPastJobs, setLocalPastJobs] = useState<PastJobType[]>([]);

  const {
    loading,
    loadingText,
    resumes,
    setLoading,
    setLoadingText,
    setStep,
    setPastJobs,
  } = useAlly();

  function setNext() {
    setPastJobs(localPastJobs);
    // setStep("user_job_details");
  }
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchPastJobs() {
      if (resumes) {
        const PastJobsRes = await pastJobsExtractor({
          resumes,
        });
        setLocalPastJobs(PastJobsRes);
      }
    }
    fetchPastJobs();
    hasFetched.current = true;
  }, [resumes, setLoading, setLoadingText, setLocalPastJobs]);

  // if (loading) {
  return <TextBlinkLoader text={loadingText} />;
};
// }
//   if (PastJobsStep === "initial") {
//     return (
//       <InitialReview
//         itemType="PastJob"
//         localItems={localPastJobs}
//         setLocalItems={setLocalPastJobs}
//         setItemsStep={setPastJobsStep}
//       />
//     );
//   } else if (PastJobsStep === "details") {
//     return (
//       <Details
//         Form={PastJobsForm}
//         itemType="past job"
//         localItems={localPastJobs}
//         setLocalItems={setLocalPastJobs}
//         setNext={setNext}
//       />
//     );
//   } else if (PastJobsStep === "additional") {
//     return (
//       <AddItems<PastJobType>
//         baseItem={
//           {
//             id: crypto.randomUUID(),
//             title: "",
//             organization: "",
//             startDate: "",
//             endDate: "",
//             gsLevel: "",
//             responsibilities: "",
//             PastJobQualifications: [],
//           } as PastJobType
//         }
//         Form={PastJobsForm}
//         header="Add a past job"
//         itemType="past job"
//         localItems={localPastJobs}
//         setGlobalItems={setPastJobs}
//         setLocalItems={setLocalPastJobs}
//         setNext={setNext}
//       />
//     );
//   }
// };

export default PastJobs;
