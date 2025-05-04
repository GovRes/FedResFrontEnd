import { useState } from "react";
import Editing from "./pastJobsComponents/Editing";
import { useAlly } from "@/app/providers";
import { PastJobType } from "@/app/utils/responseSchemas";

export default function pastJobDetails() {
  const { pastJobs } = useAlly();
  const [localpastJobs, setLocalpastJobs] = useState<PastJobType[]>(pastJobs);
  return (
    // <Editing
    //   // localpastJobs={localpastJobs}
    //   nextStep="awards"
    //   // setLocalpastJobs={setLocalpastJobs}
    // />
    <div>return</div>
  );
}
