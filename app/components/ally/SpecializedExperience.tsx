import React, { useContext, useEffect, useRef, useState } from "react";
import { AllyContext } from "@/app/providers";
import InitialReview from "./specializedExperienceComponents/InitialReview";
import InDepthReview from "./specializedExperienceComponents/InDepthReview";

const SpecializedExperience = () => {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }

  const [reviewing, setReviewing] = useState(false);
  if (!reviewing) {
    return <InitialReview setReviewing={setReviewing} />;
  } else {
    return <InDepthReview />;
  }
};

export default SpecializedExperience;
