"use client";

import { use } from "react";
import {
  volunteersAssistantName,
  volunteersAssistantInstructions,
} from "@/lib/prompts/volunteersWriterPrompt";

import ExperienceDetailPage from "../../components/ExperienceDetailPage";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ExperienceDetailPage
      assistantName={volunteersAssistantName}
      assistantInstructions={volunteersAssistantInstructions}
      id={id}
      currentStepId="volunteer-details"
    />
  );
}
