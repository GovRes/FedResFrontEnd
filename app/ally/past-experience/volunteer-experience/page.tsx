"use client";
import React, { useState, useEffect, useContext } from "react";
import InitialReview from "@/app/components/ally/sharedComponents/InitialReview";
import { PastJobType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { listUserModelRecords } from "@/app/crud/genericListForUser";
import { useAuthenticator } from "@aws-amplify/ui-react";
export default function VolunteerExperiencePage() {
  const [localVolunteers, setLocalVolunteers] = useState<PastJobType[]>([]);

  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getVolunteers() {
      if (!user) return;
      setLoading(true);
      let res = await listUserModelRecords("Volunteer", user.userId);
      if (res.items.length > 0) {
        setLocalVolunteers(res.items);
      }
      setLoading(false);
    }
    getVolunteers();
  }, [JSON.stringify(user)]);

  if (loading) {
    return <TextBlinkLoader text="fetching your saved volunteer experience" />;
  }

  return (
    <InitialReview
      currentStepId="volunteer"
      itemType="Volunteer"
      localItems={localVolunteers}
      setLocalItems={setLocalVolunteers}
      nextPath={"/ally/past-experience/past-job-details"}
    />
  );
}
