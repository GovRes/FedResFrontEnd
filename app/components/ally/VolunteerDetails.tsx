import { useState } from "react";
import Editing from "./volunteersComponents/Editing";
import { useAlly } from "@/app/providers";
import { UserJobType } from "@/app/utils/responseSchemas";

export default function UserJobDetails() {
  const { volunteers } = useAlly();
  const [localVolunteers, setLocalVolunteers] =
    useState<UserJobType[]>(volunteers);
  return (
    <Editing
      localVolunteers={localVolunteers}
      nextStep="return_resume"
      setLocalVolunteers={setLocalVolunteers}
    />
  );
}
