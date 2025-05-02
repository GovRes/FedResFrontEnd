"use client";
import { EducationType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import InitialReview from "@/app/components/ally/sharedComponents/InitialReview";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserEducations } from "@/app/crud/education";

export default function EducationPage({}) {
  const [localEducations, setLocalEducations] = useState<EducationType[]>([]);
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getEducation() {
      if (!user) return;
      setLoading(true);
      let res = await fetchUserEducations();
      if (res.length > 0) {
        setLocalEducations(res);
      }
      setLoading(false);
    }
    getEducation();
  }, [JSON.stringify(user)]);
  if (loading) {
    return <TextBlinkLoader text="Loading education" />;
  }

  return (
    <InitialReview
      currentStepId="education"
      itemType="Education"
      localItems={localEducations}
      setLocalItems={setLocalEducations}
      nextPath={"/ally/past-experience/volunteer-experience"}
    />
  );
}
