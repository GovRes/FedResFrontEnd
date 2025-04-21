import { useContext, useState } from "react";
import Editing from "./volunteersComponents/Editing";
import { AllyContext } from "@/app/providers";
import { UserJobType } from "@/app/utils/responseSchemas";

export default function UserJobDetails() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { volunteers } = context;
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
