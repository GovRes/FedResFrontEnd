import { useState } from "react";
import Editing from "./volunteersComponents/Editing";
import { useAlly } from "@/app/providers";
import { PastJobType } from "@/app/utils/responseSchemas";

export default function PastJobDetails() {
  const { volunteers } = useAlly();
  const [localVolunteers, setLocalVolunteers] =
    useState<PastJobType[]>(volunteers);
  return (
    <Editing
      localVolunteers={localVolunteers}
      nextStep="return-resume"
      setLocalVolunteers={setLocalVolunteers}
    />
  );
}
