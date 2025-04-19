"use client";
import React, { useContext } from "react";
import Resume from "./Resume";
import UsaJobs from "./UsaJobs";
import { AllyContext } from "@/app/providers";
import Awards from "./Awards";
import SpecializedExperience from "./SpecializedExperience";
import UserJobs from "./UserJobs";
import ReturnResume from "./ReturnResume";

export default function AllyContainer() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { step } = context;

  switch (step) {
    case "usa_jobs":
      return <UsaJobs />;
    case "specialized_experience":
      return <SpecializedExperience />;
    case "resume":
      return <Resume />;
    case "user_jobs":
      return <UserJobs />;
    case "awards":
      return <Awards />;
    case "return_resume":
      return <ReturnResume />;
    default:
      return <div>Nothing for the group</div>;
  }
}
