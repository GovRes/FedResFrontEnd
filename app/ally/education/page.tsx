"use client";
import { EducationType } from "@/lib/utils/responseSchemas";
import { useEffect, useState } from "react";
import InitialReview from "@/app/ally/components/InitialReview";
import { Loader } from "@/app/components/loader/Loader";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { listUserModelRecords } from "@/lib/crud/genericListForUser";

export default function EducationPage({}) {
  const [localEducations, setLocalEducations] = useState<EducationType[]>([]);
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getEducation() {
      if (!user) return;
      setLoading(true);
      let { data } = await listUserModelRecords("Education", user.userId);
      if (data && data.items.length > 0) {
        setLocalEducations(data.items);
      }
      setLoading(false);
    }
    getEducation();
  }, [user?.userId]);
  if (loading) {
    return <Loader text="Loading education" />;
  }

  return (
    <InitialReview
      currentStepId="education"
      itemType="Education"
      localItems={localEducations}
      setLocalItems={setLocalEducations}
    />
  );
}
