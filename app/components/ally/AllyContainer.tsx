"use client";
import React from "react";
import AllyStepItem from "./AllyStepItem";
import { StepsType } from "@/app/utils/responseSchemas";
import { useUserResume } from "@/app/providers/userResumeContext";

export default function AllyContainer() {
  const { steps } = useUserResume();

  const mappedSteps = steps.map((step: StepsType) => (
    <AllyStepItem step={step} key={step.id} />
  ));

  return <div>{mappedSteps}</div>;
}
