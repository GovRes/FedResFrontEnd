"use client";
import React, { useContext } from "react";
import Awards from "./Awards";
import Education from "./Education";
import Resume from "./Resume";
import ReturnResume from "./ReturnResume";
import SpecializedExperience from "./SpecializedExperience";
import UsaJobs from "./UsaJobs";
import UserJobs from "./UserJobs";
import { AllyContext } from "@/app/providers";
import Volunteer from "./Volunteer";
import ExtractKeywords from "./ExtractKeywords";
import SortTopics from "./SortTopics";
import UserJobDetails from "./UserJobDetails";
import VolunteerDetails from "./VolunteerDetails";
import AllyStepItem from "./AllyStepItem";
import { StepsType } from "@/app/utils/responseSchemas";
import Link from "next/link";

export default function AllyContainer() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { steps } = context;

  const mappedSteps = steps.map((step: StepsType) => (
    <AllyStepItem step={step} key={step.id} />
  ));

  return <div>{mappedSteps}</div>;

  // switch (step) {
  //   case "usa_jobs":
  //     return <UsaJobs />;
  //   case "specialized_experience":
  //     return <SpecializedExperience />;
  //   case "extract_keywords":
  //     return <ExtractKeywords />;
  //   case "sort_topics":
  //     return <SortTopics />;
  //   case "resume":
  //     return <Resume />;
  //   case "user_jobs":
  //     return <UserJobs />;
  //   case "user_job_details":
  //     return <UserJobDetails />;
  //   case "awards":
  //     return <Awards />;
  //   case "education":
  //     return <Education />;
  //   case "volunteer":
  //     return <Volunteer />;
  //   case "volunteer_details":
  //     return <VolunteerDetails />;
  //   case "return_resume":
  //     return <ReturnResume />;
  //   default:
  //     return <div>Nothing for the group</div>;
  // }
}
