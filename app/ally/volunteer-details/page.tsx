"use client";
import { useEffect, useState } from "react";
import ExperiencePage from "../components/ExperiencePage";
import { useApplication } from "@/app/providers/applicationContext";
import { topicPastJobMatcher } from "@/app/components/aiProcessing/topicPastJobMatcher";
import { PastJobType } from "@/app/utils/responseSchemas";
import { updatePastJobWithQualifications } from "@/app/crud/pastJob";
import { getApplicationAssociations } from "@/app/crud/application";

export default function VolunteerDetailsPage() {
  return <ExperiencePage currentStepId="volunteer-details" type="Volunteer" />;
}
