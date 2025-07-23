"use client";
import { useState } from "react";
import PastJobForm from "../../components/components/PastJobForm";
import { pastJobZodSchema, PastJobType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useSmartForm } from "@/lib/hooks/useFormDataCleaner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoading } from "@/app/providers/loadingContext";

export default function NewPastJobPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const { setIsLoading } = useLoading();
  const [loading, setLoading] = useState(false);
  const { defaultValues, cleanData } = useSmartForm(pastJobZodSchema, {
    userId: user.userId,
  });
  const methods = useForm({
    resolver: zodResolver(pastJobZodSchema),
    defaultValues,
  });
  const onSubmit = async (data: PastJobType): Promise<void> => {
    setLoading(true);
    const cleaned = cleanData(data);
    try {
      let res = await createModelRecord("PastJob", cleaned);
      setLoading(false);
      setIsLoading(true);
      router.push(`/profile/past-jobs/${res.id}`);
    } catch (error) {
      console.error("Error updating award:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="loading job data" />;
  }
  return (
    <div>
      <h1>New Job Experience</h1>
      <PastJobForm
        itemType="PastJob"
        loading={loading}
        methods={methods}
        onSubmit={methods.handleSubmit(onSubmit)}
      />
    </div>
  );
}
