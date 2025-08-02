"use client";
import { AwardType } from "@/lib/utils/responseSchemas";
import { useEffect, useState } from "react";
import InitialReview from "@/app/ally/components/InitialReview";
import { Loader } from "@/app/components/loader/Loader";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { listUserModelRecords } from "@/lib/crud/genericListForUser";
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
