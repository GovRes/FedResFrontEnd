"use client";
import { useState } from "react";
import { educationZodSchema, EducationType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";
import EducationFormSwitch from "../components/EducationFormSwitch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSmartForm } from "@/lib/hooks/useFormDataCleaner";

export default function NewEducationPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  const { defaultValues, cleanData } = useSmartForm(educationZodSchema, {
    userId: user.userId,
  });
  const methods = useForm({
    resolver: zodResolver(educationZodSchema),
    defaultValues,
  });

  const onSubmit = async (data: EducationType): Promise<void> => {
    setLoading(true);
    const cleaned = cleanData(data);
    try {
      let res = await createModelRecord("Education", cleaned);
      setLoading(false);
      router.push(`/profile/educations/${res.id}`);
    } catch (error) {
      console.error("Error updating education:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="loading education data" />;
  }

  return (
    <div>
      <h1>New Educational Experience</h1>
      <EducationFormSwitch
        methods={methods}
        onSubmit={methods.handleSubmit(onSubmit)}
      />
    </div>
  );
}
