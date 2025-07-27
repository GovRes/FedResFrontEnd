"use client";
import { useState } from "react";
import AwardForm from "../components/AwardForm";
import { AwardType, awardZodSchema } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useSmartForm } from "@/lib/hooks/useFormDataCleaner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function NewAwardPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  const { defaultValues, cleanData } = useSmartForm(awardZodSchema, {
    userId: user.userId,
  });
  const methods = useForm({
    resolver: zodResolver(awardZodSchema),
    defaultValues,
  });
  const onSubmit = async (data: AwardType): Promise<void> => {
    setLoading(true);
    const cleaned = cleanData(data);
    try {
      let res = await createModelRecord("Award", cleaned);
      setLoading(false);
      router.push(`/profile/awards/${res.id}`);
    } catch (error) {
      console.error("Error updating award:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="loading award data" />;
  }
  return (
    <div>
      <h1>New Award</h1>
      <AwardForm
        loading={loading}
        methods={methods}
        onSubmit={methods.handleSubmit(onSubmit)}
      />
    </div>
  );
}
