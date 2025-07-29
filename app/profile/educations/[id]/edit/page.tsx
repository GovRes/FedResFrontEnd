"use client";
import { Loader } from "@/app/components/loader/Loader";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import EducationForm from "../../components/EducationForm";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { EducationType, educationZodSchema } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

// Create the form schema and type
const educationFormSchema = educationZodSchema.omit({ userId: true, id: true });
type EducationFormData = z.infer<typeof educationFormSchema>;

export default function EditEducationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [educationData, setEducationData] = useState<EducationType | null>(
    null
  );

  const onSubmit = async (formData: EducationFormData): Promise<void> => {
    setLoading(true);
    try {
      // Combine form data with existing education data (id, userId)
      const completeEducationData: EducationType = {
        ...formData,
        id: educationData!.id,
        userId: educationData!.userId,
      };

      await updateModelRecord("Education", id, completeEducationData);
      router.push(`/profile/educations/${id}`);
    } catch (error) {
      console.error("Error updating education:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const fetchedEducationData = await fetchModelRecord("Education", id);
        setEducationData(fetchedEducationData);
      } catch (error) {
        console.error("Error fetching education:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <Loader text="Loading education data..." />;
  }

  if (!educationData) {
    return <div>Education record not found</div>;
  }

  return (
    <div>
      <h1>Edit Educational Experience</h1>
      <EducationForm item={educationData} onSubmit={onSubmit} />
    </div>
  );
}
