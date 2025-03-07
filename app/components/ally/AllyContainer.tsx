"use client";
import React, { useContext, useEffect, useState } from "react";
import EditTopicalQualifications from "./EditTopicalQualifications";
import QualificationsFinalReview from "./QualificationsFinalReview";
import Resume from "./Resume";
import UsaJobs from "./UsaJobs";
import WrongMetToUnmet from "./WrongMetToUnmet";
import WrongUnmetToMet from "./WrongUnmetToMet";
import { TextBlinkLoader } from "../loader/Loader";
import { jobDescriptionReviewer } from "../aiProcessing/jobDescriptionReviewer";
import { qualificationsReviewer } from "../aiProcessing/qualificationsReviewer";
import { AllyContext, StepType } from "@/app/providers";
import { topicsCategorizer } from "../aiProcessing/topicCategorizer";
import { qualificationsEvidenceWriter } from "../aiProcessing/qualificationsEvidenceWriter";
import { TopicType } from "@/app/utils/responseSchemas";

export default function AllyContainer() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const {
    job,
    keywords,
    loading,
    loadingText,
    qualifications,
    recommendation,
    reviewedMetQualifications,
    reviewedUnmetQualifications,
    resumes,
    step,
    topics,
    setKeywords,
    setLoading,
    setLoadingText,
    setQualifications,
    setResumes,
    setReviewedMetQualifications,
    setReviewedUnmetQualifications,
    setStep,
    setTopics,
  } = context;
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentTopic, setCurrentTopic] = useState<TopicType>({
    id: "",
    name: "",
    evidence: "",
    keywords: [],
  });
  async function selectStep(): Promise<StepType> {
    if (!job) {
      // select a job
      return "usa_jobs";
    } else if (!resumes && job) {
      //select a resume for applying to this particular job
      return "resume";
    } else if (
      resumes &&
      job &&
      !reviewedMetQualifications &&
      !reviewedUnmetQualifications
    ) {
      console.log(55);
      // let keywords = await jobDescriptionReviewer({
      //   job,
      //   setLoading,
      //   setLoadingText,
      // });
      // console.log(57);
      // let qualifications = await qualificationsReviewer({
      //   job,
      //   keywords,
      //   resumes,
      //   setLoading,
      //   setLoadingText,
      // });
      // setKeywords(keywords);
      // setQualifications(qualifications);
      // return "wrong_met_to_unmet";
      // } else if (
      //   resumes &&
      //   job &&
      //   keywords &&
      //   qualifications &&
      //   reviewedMetQualifications &&
      //   !reviewedUnmetQualifications
      // ) {
      //   console.log(63);
      //   return "wrong_unmet_to_met";
      // } else if (
      //   job &&
      //   keywords &&
      //   reviewedMetQualifications &&
      //   reviewedUnmetQualifications &&
      //   !topics
      // ) {
      //   console.log(66);
      //   let topicsCategorizerRes = await topicsCategorizer({
      //     job,
      //     keywords,
      //     setLoading,
      //     setLoadingText,
      //   });
      //   console.log(topicsCategorizerRes);
      //   console.log(typeof topicsCategorizerRes);
      //   setTopics(topicsCategorizerRes);
      //   console.log(topics, currentTopicIndex);
      //   console.log(69);
      // }
      // if (job && qualifications && topics && topics[currentTopicIndex]) {
      //   let topicRes = await qualificationsEvidenceWriter({
      //     currentTopic: topics[currentTopicIndex],
      //     job,
      //     qualifications,
      //     resumes,
      //     setLoading,
      //     setLoadingText,
      //   });
      //   if (topicRes) {
      //     console.log(74);
      //     setCurrentTopic(topicRes);
      //   }
      // console.log(77);
      // return "edit_met_qualifications";
      // } else if (topics && currentTopicIndex === topics.length) {
      //   return "qualifications_final_review";
      // }
      // else if ((resume && jobDescription && keywords && reviewedMetQualifications && reviewedUnmetQualifications)) {
      //   await qualificationsRecommender({ jobDescription, keywords, resume, setLoading, setLoadingText });
      //   console.log(qualificationsRecommender)
      //   return "pause"
      // }
      return "pause";
    } else {
      return "pause";
    }
  }
  useEffect(() => {
    const updateStep = async () => {
      const updatedStep = await selectStep();

      if (updatedStep != step) {
        setStep(updatedStep);
      }
    };
    updateStep();
  }, [
    job,
    resumes,
    reviewedMetQualifications,
    reviewedUnmetQualifications,
    topics,
    currentTopicIndex,
  ]);

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }

  switch (step) {
    case "resume":
      return <Resume setResumes={setResumes} />;
    case "usa_jobs":
      return <UsaJobs />;
    case "wrong_met_to_unmet":
      return (
        <div>
          {qualifications && (
            <WrongMetToUnmet
              qualifications={qualifications}
              recommendation={recommendation}
              setQualifications={setQualifications}
              setReviewedMetQualifications={setReviewedMetQualifications}
            />
          )}
        </div>
      );
    case "wrong_unmet_to_met":
      return (
        <div>
          {qualifications && (
            <WrongUnmetToMet
              qualifications={qualifications}
              setQualifications={setQualifications}
              setReviewedUnmetQualifications={setReviewedUnmetQualifications}
            />
          )}
        </div>
      );
    case "edit_met_qualifications":
      return (
        <div>
          <EditTopicalQualifications
            currentTopicIndex={currentTopicIndex}
            setCurrentTopicIndex={setCurrentTopicIndex}
            setCurrentTopic={setCurrentTopic}
            currentTopic={currentTopic}
          />
        </div>
      );
    case "qualifications_final_review":
      return (
        <QualificationsFinalReview
          setCurrentTopicIndex={setCurrentTopicIndex}
        />
      );
    default:
      return <div>Nothing for the group</div>;
  }
}
