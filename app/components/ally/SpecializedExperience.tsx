import React, { useState } from "react";
import InitialReview from "./specializedExperienceComponents/InitialReview";
import InDepthReview from "./specializedExperienceComponents/InDepthReview";

const SpecializedExperience = () => {
  const [reviewing, setReviewing] = useState(false);
  if (!reviewing) {
    return <InitialReview />;
  } else {
    return <InDepthReview />;
  }
};

export default SpecializedExperience;
