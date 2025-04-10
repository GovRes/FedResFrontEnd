"use client";
import React, { useContext } from "react";
import Resume from "./Resume";
import UsaJobs from "./UsaJobs";
import { TextBlinkLoader } from "../loader/Loader";
import { AllyContext } from "@/app/providers";
import SpecializedExperience from "./SpecializedExperience";
import UserJobs from "./UserJobs";

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
    default:
      return <div>Nothing for the group</div>;
  }
}
