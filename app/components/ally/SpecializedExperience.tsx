import React, { useContext, useEffect, useRef, useState } from "react";
import { AllyContext } from "@/app/providers";
import InitialReview from "./specializedExperienceComponents/InitialReview";
import InDepthReview from "./specializedExperienceComponents/InDepthReview";
import { SpecializedExperienceArraySchema } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "../loader/Loader";

const SpecializedExperience = () => {
  const [reviewing, setReviewing] = useState(false);
  if (!reviewing) {
    return <InitialReview setReviewing={setReviewing} />;
  } else {
    return <InDepthReview />;
  }
};

export default SpecializedExperience;
