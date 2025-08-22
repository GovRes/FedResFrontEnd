"use client";
import { AwardType } from "@/lib/utils/responseSchemas";
import { useEffect, useState } from "react";
import InitialReview from "@/app/ally/components/InitialReview";
import { Loader } from "@/app/components/loader/Loader";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { listUserModelRecords } from "@/lib/crud/genericListForUser";

export default function AwardsPage({}) {
  const [localAwards, setLocalAwards] = useState<AwardType[]>([]);
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    async function getAwards() {
      if (!user) return;
      setLoading(true);
      let { data } = await listUserModelRecords("Award", user.userId);
      if (data && data.items.length > 0) {
        setLocalAwards(data.items);
      }
      setLoading(false);
    }
    getAwards();
  }, [user?.userId]);
  if (loading) {
    return <Loader text="Loading awards" />;
  }

  return (
    <InitialReview
      currentStepId="awards"
      itemType="Award"
      localItems={localAwards}
      setLocalItems={setLocalAwards}
    />
  );
}
