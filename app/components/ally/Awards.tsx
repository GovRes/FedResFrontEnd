import { AwardType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import InitialReview from "./awardsComponents/InitialReview";
import Details from "./awardsComponents/Details";
import Additional from "./awardsComponents/Additional";

export default function Awards({}) {
  const [awardsStep, setAwardsStep] = useState("initial");
  const [localAwards, setLocalAwards] = useState<AwardType[]>([]);

  if (awardsStep === "initial") {
    return (
      <InitialReview
        localAwards={localAwards}
        setLocalAwards={setLocalAwards}
        setAwardsStep={setAwardsStep}
      />
    );
  } else if (awardsStep === "details") {
    return (
      <Details
        localAwards={localAwards}
        setLocalAwards={setLocalAwards}
        setAwardsStep={setAwardsStep}
      />
    );
  } else {
    return (
      <Additional localAwards={localAwards} setLocalAwards={setLocalAwards} />
    );
  }
}
