"use client";
import { Loader } from "@/app/components/loader/Loader";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import PastJobForm from "@/app/profile/components/components/PastJobForm";
import { PastJobType, pastJobZodSchema } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

// Create the form schema and type
const pastJobFormSchema = pastJobZodSchema.omit({
  userId: true,
  id: true,
  qualifications: true,
});
type PastJobFormData = z.infer<typeof pastJobFormSchema>;

export default function EditVolunteerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [volunteerData, setVolunteerData] = useState<PastJobType | null>(null);

  const onSubmit = async (formData: PastJobFormData): Promise<void> => {
    setLoading(true);
    try {
      // Combine form data with existing volunteer data (id, userId, qualifications)
      const completeVolunteerData: PastJobType = {
        ...formData,
        id: volunteerData!.id,
        userId: volunteerData!.userId,
        qualifications: volunteerData!.qualifications || [],
      };

      await updateModelRecord("Volunteer", id, completeVolunteerData);
      router.push(`/profile/volunteers/${id}`);
    } catch (error) {
      console.error("Error updating volunteer experience:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const fetchedVolunteerData = await fetchModelRecord("PastJob", id);
        setVolunteerData(fetchedVolunteerData);
      } catch (error) {
        console.error("Error fetching volunteer experience:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <Loader text="Loading volunteer experience data..." />;
  }

  if (!volunteerData) {
    return <div>Volunteer experience not found</div>;
  }

  return (
    <div>
      <h1>Edit Volunteer Experience</h1>
      <PastJobForm
        item={volunteerData}
        itemType="Volunteer"
        onSubmit={onSubmit}
      />
    </div>
  );
}
