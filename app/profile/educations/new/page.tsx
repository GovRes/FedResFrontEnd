"use client";
import { useState } from "react";
import EducationForm from "../components/EducationForm";
import { EducationType, educationZodSchema } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { z } from "zod";

// Create the form schema and type
const educationFormSchema = educationZodSchema.omit({ userId: true, id: true });
type EducationFormData = z.infer<typeof educationFormSchema>;

export default function NewEducationPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData: EducationFormData): Promise<void> => {
    setLoading(true);
    try {
      // Combine form data with user ID
      const completeEducationData: Omit<EducationType, "id"> = {
        ...formData,
        userId: user.userId,
      };

      const res = await createModelRecord("Education", completeEducationData);
      router.push(`/profile/educations/${res.id}`);
    } catch (error) {
      console.error("Error creating education:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Creating education record..." />;
  }

  return (
    <div>
      <h1>New Educational Experience</h1>
      <EducationForm onSubmit={onSubmit} />
    </div>
  );
}
