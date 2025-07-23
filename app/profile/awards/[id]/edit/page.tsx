"use client";
import { Loader } from "@/app/components/loader/Loader";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import AwardForm from "@/app/profile/awards/components/AwardForm";
import { awardZodSchema, AwardType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useSmartForm } from "@/lib/hooks/useFormDataCleaner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transformApiDataForForm } from "@/app/utils/formUtils";

export default function EditAwardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { defaultValues, cleanData } = useSmartForm(awardZodSchema);
  const methods = useForm({
    resolver: zodResolver(awardZodSchema),
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onBlur",
    criteriaMode: "all",
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await fetchModelRecord("Award", id);
        const transformedData = transformApiDataForForm(data, awardZodSchema);
        methods.reset(transformedData);
      } catch (error) {
        console.error("Error fetching education data:", error);
      }
      setLoading(false);
    }

    if (id) {
      fetchData();
    }
  }, [id, methods.reset]);
  const onSubmit = async (data: AwardType): Promise<void> => {
    setLoading(true);
    const cleaned = cleanData(data);
    try {
      await updateModelRecord("Award", id, cleaned);
      router.push(`/profile/awards/${id}`);
    } catch (error) {
      console.error("Error updating award:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return <Loader text="loading award data" />;
  }
  return (
    <div>
      <h1>Edit Award</h1>
      <AwardForm
        loading={loading}
        methods={methods}
        onSubmit={methods.handleSubmit(onSubmit)}
      />
    </div>
  );
}
