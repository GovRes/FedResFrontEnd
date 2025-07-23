"use client";
import { Loader } from "@/app/components/loader/Loader";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import PastJobForm from "@/app/profile/components/components/PastJobForm";
import { PastJobType, pastJobZodSchema } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useSmartForm } from "@/lib/hooks/useFormDataCleaner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transformApiDataForForm } from "@/app/utils/formUtils";
import { useLoading } from "@/app/providers/loadingContext";

export default function EditPastJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { setIsLoading } = useLoading();
  const [loading, setLoading] = useState(true);
  const { defaultValues, cleanData } = useSmartForm(pastJobZodSchema);
  const methods = useForm({
    resolver: zodResolver(pastJobZodSchema),
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onBlur",
    criteriaMode: "all",
  });
  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await fetchModelRecord("PastJob", id);
        const transformedData = transformApiDataForForm(data, pastJobZodSchema);
        methods.reset(transformedData);
      } catch (error) {
        console.error("Error fetching pastJob data:", error);
      }
      setLoading(false);
    }

    if (id) {
      fetchData();
    }
  }, [id, methods.reset]);
  const onSubmit = async (data: PastJobType): Promise<void> => {
    setLoading(true);
    const cleaned = cleanData(data);
    try {
      await updateModelRecord("PastJob", id, cleaned);
      setIsLoading(true);
      router.push(`/profile/past-jobs/${id}`);
    } catch (error) {
      console.error("Error updating past job:", error);
    }
    setLoading(false);
  };
  if (loading) {
    return <Loader text="loading past job data" />;
  }

  return (
    <div>
      <h1>Edit Job</h1>
      <PastJobForm
        itemType="PastJob"
        loading={loading}
        methods={methods}
        onSubmit={methods.handleSubmit(onSubmit, onError)}
      />
    </div>
  );
}
