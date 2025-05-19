import React, { useState } from "react";
import InitialReview from "./specializedExperienceComponents/InitialReview";
import InDepthReview from "../../ally/specialized-experience-details/components/InDepthReview";

const SpecializedExperience = () => {
  const [reviewing, setReviewing] = useState(false);
  if (!reviewing) {
    return <InitialReview />;
  } else {
    return <InDepthReview />;
  }
};

export default SpecializedExperience;
