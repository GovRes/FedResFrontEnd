"use client";

import { use, useEffect, useState } from "react";
import ExperienceDetailPage from "../../components/ExperienceDetailPage";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <ExperienceDetailPage currentStepId="past-job-details" id={id} />;
}
