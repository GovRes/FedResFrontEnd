import { useContext, useEffect, useMemo, useState } from "react";
import MakeChangesToMetQualifications from "./careerCoachSteps/FinalEditsToMetQualifications";
import EditMetQualifications from "./careerCoachSteps/EditMetQualifications";
import WrongMetToUnmet from "./careerCoachSteps/WrongMetToUnmet";
import WrongUnmetToMet from "./careerCoachSteps/WrongUnmetToMet";
import { AllyContext, AllyContextType, StepType } from "@/app/providers";
import { QualificationType } from "@/app/utils/responseSchemas";
import { qualificationsRecommender } from "../aiProcessing/qualificationsReviewer";
import { sendMessages } from "@/app/utils/api";

//this maps to the order I think it should happen in.
export type CareerCoachStepType =  "wrong_met_to_unmet" | "wrong_unmet_to_met" | "edit_met_qualifications" | "make_changes_to_met_qualifications" | "pause"
export default function CareerCoach() {
  interface QualifcationFeedback {
    qualification: QualificationType | null;
    feedback: string;
  }
  const {jobDescription, keywords, qualifications, recommendation, resume, setLoading, setRecommendation} = useContext(AllyContext) as AllyContextType;
  const [metQualifications, setMetQualifications] = useState(
    qualifications?.metQualifications ?? []
  );
  const [unmetQualifications, setUnmetQualifications] = useState(
    qualifications?.unmetQualifications ?? []
  );

  const metQualificationsStartLength = useMemo( () => metQualifications.length, [metQualifications]);
  const unmetQualificationsStartLength = useMemo( () => unmetQualifications.length, [unmetQualifications]);

  const [reviewedMetQualifications, setReviewedMetQualifications] = useState(false)
  const [reviewedUnmetQualifications, setReviewedUnmetQualifications] = useState(false)
  
  const [careerCoachStep, setCareerCoachStep] = useState<CareerCoachStepType>(setStartingStep());
  let allyStatements = [
    "I've reviewed your resume and job description. Here are some of the qualifications you meet.",
  ];

  useEffect(() => {
    if (metQualificationsStartLength !== metQualifications.length || unmetQualificationsStartLength !== unmetQualifications.length && resume && keywords && jobDescription && resume !== '' && keywords.length && jobDescription !== '') {
      qualificationsRecommender({jobDescription: jobDescription!, keywords: keywords ?? [], resume: resume!, sendMessages, setLoading, setRecommendation})
    }
  }, [reviewedMetQualifications, reviewedUnmetQualifications]);

  function setStartingStep() {
    if (metQualifications.length) {
      return "wrong_met_to_unmet"
    } else if (unmetQualifications.length){
      return "wrong_unmet_to_met"
    } else {
      return "pause"
    }
  }

  useEffect(() => {
    console.log(54, careerCoachStep)
    console.log(qualifications)

  }, [careerCoachStep])

  switch (careerCoachStep) {
    case "wrong_met_to_unmet":
      return (
        <div>
          <WrongMetToUnmet
            recommendation={recommendation}
            metQualifications={metQualifications}
            unmetQualifications={unmetQualifications}
            setCareerCoachStep={setCareerCoachStep}
            setMetQualifications={setMetQualifications}
            setReviewedMetQualifications={setReviewedMetQualifications}
            setUnmetQualifications={setUnmetQualifications}
          />
        </div>
      );
    case "wrong_unmet_to_met":
      return (
        <div>
          <WrongUnmetToMet
            metQualifications={metQualifications}
            unmetQualifications={unmetQualifications}
            setCareerCoachStep={setCareerCoachStep}
            setMetQualifications={setMetQualifications}
            setReviewedUnmetQualifications={setReviewedUnmetQualifications}
            setUnmetQualifications={setUnmetQualifications}
          />
        </div>
      );
    case "edit_met_qualifications":
      return (
        <div>
          <EditMetQualifications
            metQualifications={metQualifications}
            recommendation={recommendation}
            setCareerCoachStep={setCareerCoachStep}
          />
        </div>
      );
    case "make_changes_to_met_qualifications":
      return (
        <div>
          <MakeChangesToMetQualifications
            metQualifications={metQualifications}
            setCareerCoachStep={setCareerCoachStep}
          />
        </div>
      );
    default:
      return <div>Nothing to see here</div>;
  }
}
