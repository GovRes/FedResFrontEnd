"use client";
import React, { useContext, useEffect, useState } from "react";
import Resume from "./Resume";
import TempRegister from "./TempRegister";
import UsaJobs from "./UsaJobs";
import { TextSpinnerLoader, TextBlinkLoader } from "../loader/Loader";
import { AllyContext, AllyContextType, StepType } from "@/app/providers";
import { jobDescriptionReviewer } from "../aiProcessing/jobDescriptionReviewer";
import { qualificationsRecommender, qualificationsReviewer } from "../aiProcessing/qualificationsReviewer";
import WrongMetToUnmet from "./WrongMetToUnmet";
import WrongUnmetToMet from "./WrongUnmetToMet";
import { ConsoleLogger } from "aws-amplify/utils";
import EditTopicalQualifications from "./EditTopicalQualifications";
import { topicsCategorizer } from "../aiProcessing/topicCategorizer";
import { qualificationsEvidenceWriter } from "../aiProcessing/qualificationsEvidenceWriter";
import { useWhatChanged } from "@simbathesailor/use-what-changed";
import { TopicType } from "@/app/utils/responseSchemas";

export default function AllyContainer() {
  const {
    jobDescription,
    keywords,
    loading,
    loadingText,
    qualifications,
    recommendation,
    reviewedMetQualifications,
    reviewedUnmetQualifications,
    resume,
    step,
    setKeywords,
    setLoading,
    setLoadingText,
    setQualifications,
    setReviewedMetQualifications,
    setReviewedUnmetQualifications,
    setStep,
    setTopics
  } = useContext(AllyContext) as AllyContextType;
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentTopic, setCurrentTopic] = useState<TopicType>({ id: "", name: "", evidence: "", keywords: [] });
  async function selectStep(): Promise<StepType> {

    if (!resume) {
      // store resume
      return "resume"
    } else if (resume && !jobDescription) {
      // store usa jobs description and extract keywords from it.
      return "usa_jobs"
    } else if (resume && jobDescription && !reviewedMetQualifications && !reviewedUnmetQualifications) {
      let keywords = await jobDescriptionReviewer({ jobDescription, setLoading, setLoadingText });
      let qualifications = await qualificationsReviewer({ jobDescription, keywords, resume, setLoading, setLoadingText });
      setKeywords(keywords)
      console.log(51)
      console.log(53, qualifications)
      setQualifications(qualifications)
      return "wrong_met_to_unmet"
    } else if (resume && jobDescription && keywords && qualifications && reviewedMetQualifications && !reviewedUnmetQualifications) {
      console.log(57)
      return "wrong_unmet_to_met"
    } else if (resume && jobDescription && keywords && reviewedMetQualifications && reviewedUnmetQualifications) {
      let topics = await topicsCategorizer({ jobDescription, keywords, setLoading, setLoadingText, })
      setTopics(topics)
      let topicRes = await qualificationsEvidenceWriter({ currentTopic: topics[currentTopicIndex], jobDescription, resume, setLoading, setLoadingText })
      setCurrentTopic(topicRes);
      return "edit_met_qualifications"
    } else if ((resume && jobDescription && keywords && reviewedMetQualifications && reviewedUnmetQualifications)) {
      await qualificationsRecommender({ jobDescription, keywords, resume, setLoading, setLoadingText });
      console.log(qualificationsRecommender)
      return "pause"
    }
    return "pause"
  }
  useEffect(() => {
    const updateStep = async () => {
      
      const updatedStep = await selectStep();
    
      if (updatedStep != step) {
        setStep(updatedStep)
      }
    };
    updateStep();
  }, [resume, jobDescription, reviewedMetQualifications, reviewedUnmetQualifications]);

  if (loading) {
    return <TextBlinkLoader text={loadingText} />
  }

  switch (step) {
    case "temp_registration":
      return (
        <TempRegister />
      );
    case "resume":
      return <Resume />;
    case "usa_jobs":
      return (
        <UsaJobs />
      );
    case "wrong_met_to_unmet":
      return (
        <div>
          {qualifications &&
            <WrongMetToUnmet
              qualifications={qualifications}
              recommendation={recommendation}
              setQualifications={setQualifications}
              setReviewedMetQualifications={setReviewedMetQualifications}
            />
          }
        </div>
      )
    case "wrong_unmet_to_met":
      return (
        <div>{qualifications &&
          <WrongUnmetToMet
            qualifications={qualifications}
            setQualifications={setQualifications}
            setReviewedUnmetQualifications={setReviewedUnmetQualifications}
          />
        }
        </div>
      );
    case "edit_met_qualifications":
      return (
        <div>
          <EditTopicalQualifications currentTopicIndex={currentTopicIndex} setCurrentTopicIndex={setCurrentTopicIndex} currentTopic={currentTopic}/>
        </div>
      );
    default:
      return <div>Nothing for the group</div>;
  }
}
