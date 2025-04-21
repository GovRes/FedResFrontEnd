import { useContext, useState } from "react";
import Editing from "./userJobsComponents/Editing";
import { AllyContext } from "@/app/providers";
import { UserJobType } from "@/app/utils/responseSchemas";

export default function UserJobDetails() {
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
    userJobs,
    setLoading,
    setLoadingText,
    setStep,
    setUserJobs,
  } = context;
  const [localUserJobs, setLocalUserJobs] = useState<UserJobType[]>(userJobs);
  return (
    <Editing
      localUserJobs={localUserJobs}
      nextStep="awards"
      setLocalUserJobs={setLocalUserJobs}
    />
  );
}
