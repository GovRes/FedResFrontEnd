import { useState } from "react";
import Editing from "./userJobsComponents/Editing";
import { useAlly } from "@/app/providers";
import { UserJobType } from "@/app/utils/responseSchemas";

export default function UserJobDetails() {
  const { userJobs } = useAlly();
  const [localUserJobs, setLocalUserJobs] = useState<UserJobType[]>(userJobs);
  return (
    <Editing
      localUserJobs={localUserJobs}
      nextStep="awards"
      setLocalUserJobs={setLocalUserJobs}
    />
  );
}
