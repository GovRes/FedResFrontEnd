"use client";
import React, { useContext, useEffect, useState } from "react";
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/index.mjs";
import CareerCoach from "./CareerCoach";
import Resume from "./Resume";
import TempRegister from "./TempRegister";
import UsaJobs from "./UsaJobs";
import {TextSpinnerLoader} from "../loader/Loader";
import { AllyContext, AllyContextType } from "@/app/providers";
import { jobDescriptionReviewer } from "../aiProcessing/jobDescriptionReviewer";
import { qualificationsReviewerPrompt } from "@/app/prompts/qualificationsReviewer";
import { sendMessages } from "@/app/utils/api";
import { advancedQualificationsReviewerPrompt } from "@/app/prompts/advancedQualificationsReviewer";
import { qualificationsReviewer } from "../aiProcessing/qualificationsReviewer";

export default function AllyContainer() {
  const {
    jobDescription,
    keywords,
    loading,
    resume,
    step,
    setKeywords,
    setLoading,
    setQualifications,
    setRecommendation,
    setStep,
  } = useContext(AllyContext) as AllyContextType;

  useEffect(() => {
    if (jobDescription) jobDescriptionReviewer({ jobDescription, setKeywords, setLoading, setStep });
  }, [jobDescription]);
//need to make some kind of failsafe that will give it an opprtunity to get any of these that are missing.
  useEffect(() => {
    if (resume && keywords && jobDescription && resume !== '' && keywords.length && jobDescription !== '') {
      qualificationsReviewer({jobDescription, keywords, resume, sendMessages, setLoading, setQualifications, setRecommendation})
    }
  }, [
    jobDescription,
    keywords,
    resume,
  ]);
  useEffect(() => {
console.log(step)
  }, [step])
  if(loading) {
    return <TextSpinnerLoader text={"talking to the ai"} />
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
    case "career_coach":
      return (
        <CareerCoach />
      );
    default:
      return <div>Nothing for the group</div>;
  }
}
