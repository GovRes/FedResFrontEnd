"use client";

import { use } from "react";
import ExperienceDetailPage from "../../components/ExperienceDetailPage";
import {
  pastJobsAssistantName,
  pastJobsAssistantInstructions,
} from "@/lib/prompts/pastJobsWriterPrompt";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ExperienceDetailPage
      assistantName={pastJobsAssistantName}
      assistantInstructions={pastJobsAssistantInstructions}
      currentStepId="past-job-details"
      id={id}
    />
  );
}
