import React, { useState, useEffect, useRef } from "react";
import InitialReview from "./userJobsComponents/InitialReview";
import Editing from "./userJobsComponents/Editing";
import Details from "./userJobsComponents/Details";
import { UserJobType } from "@/app/utils/responseSchemas";
const UserJobs = () => {
  const [userJobsStep, setUserJobsStep] = useState("initial");
  const [localUserJobs, setLocalUserJobs] = useState<UserJobType[]>([]);
  if (userJobsStep === "initial") {
    return (
      <InitialReview
        localUserJobs={localUserJobs}
        setLocalUserJobs={setLocalUserJobs}
        setUserJobsStep={setUserJobsStep}
      />
    );
  } else if (userJobsStep === "details") {
    return (
      <Details
        localUserJobs={localUserJobs}
        setLocalUserJobs={setLocalUserJobs}
        setUserJobsStep={setUserJobsStep}
      />
    );
  } else {
    return (
      <Editing
        localUserJobs={localUserJobs}
        setLocalUserJobs={setLocalUserJobs}
        setUserJobsStep={setUserJobsStep}
      />
    );
  }
};

export default UserJobs;
