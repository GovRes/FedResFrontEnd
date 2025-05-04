"use client";
import React from "react";
import AllyStepItem from "../../components/ally/AllyStepItem";
import { StepsType } from "@/app/utils/responseSchemas";
import { useApplication } from "@/app/providers/applicationContext";

export default function AllyContainer() {
  const { steps } = useApplication();
  console.log(9, steps);
  const mappedSteps = steps.map((step: StepsType) => (
    <AllyStepItem step={step} key={step.id} />
  ));

  return <div>{mappedSteps}</div>;
}
