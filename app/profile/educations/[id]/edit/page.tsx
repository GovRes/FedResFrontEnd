"use client";
import { Loader } from "@/app/components/loader/Loader";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { educationZodSchema, EducationType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useSmartForm } from "@/lib/hooks/useFormDataCleaner";
import EducationForm from "../../components/EducationForm";
import CertificationForm from "../../components/CertificationForm";
import { transformApiDataForForm } from "@/app/utils/formUtils";

export default function EditPastEducationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const { defaultValues, cleanData } = useSmartForm(educationZodSchema);
  const methods = useForm({
    resolver: zodResolver(educationZodSchema),
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onBlur",
    criteriaMode: "all",
  });
  const formType = useWatch({
    control: methods.control,
    name: "type",
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await fetchModelRecord("Education", id);
        const transformedData = transformApiDataForForm(
          data,
          educationZodSchema
        );
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

  const onSubmit = async (data: EducationType): Promise<void> => {
    setLoading(true);
    const cleaned = cleanData(data);
    try {
      await updateModelRecord("Education", id, cleaned);
      router.push(`/profile/educations/${id}`);
    } catch (error) {
      console.error("Error updating education:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return <Loader text="loading education data" />;
  }

  return (
    <div>
      <h1>Edit Education</h1>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {formType === "education" ? (
          <EducationForm
            errors={methods.formState.errors}
            register={methods.register}
          />
        ) : (
          <CertificationForm
            errors={methods.formState.errors}
            register={methods.register}
          />
        )}
        <button
          type="submit"
          disabled={!methods.formState.isValid || loading}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: methods.formState.isValid ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: methods.formState.isValid ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Saving..." : "Update Education"}
        </button>
      </form>
    </div>
  );
}
