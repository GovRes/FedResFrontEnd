"use client";
import { AwardType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import InitialReview from "@/app/components/ally/sharedComponents/InitialReview";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { listUserModelRecords } from "@/app/crud/genericListForUser";
import { useRouter } from "next/navigation";

export default function AwardsPage({}) {
  const [localAwards, setLocalAwards] = useState<AwardType[]>([]);
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    async function getAwards() {
      if (!user) return;
      setLoading(true);
      let res = await listUserModelRecords("Award", user.userId);
      if (res.items.length > 0) {
        setLocalAwards(res.items);
      }
      setLoading(false);
    }
    getAwards();
  }, [JSON.stringify(user)]);
  if (loading) {
    return <TextBlinkLoader text="Loading awards" />;
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
