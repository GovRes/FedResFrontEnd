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

export default function EditPastJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pastJobData, setPastJobData] = useState<PastJobType | null>(null);

  const onSubmit = async (formData: PastJobFormData): Promise<void> => {
    setLoading(true);
    try {
      // Combine form data with existing past job data (id, userId, qualifications)
      const completePastJobData: PastJobType = {
        ...formData,
        id: pastJobData!.id,
        userId: pastJobData!.userId,
        qualifications: pastJobData!.qualifications || [],
      };

      await updateModelRecord("PastJob", id, completePastJobData);
      router.push(`/profile/past-jobs/${id}`);
    } catch (error) {
      console.error("Error updating past job:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const fetchedPastJobData = await fetchModelRecord("PastJob", id);
        setPastJobData(fetchedPastJobData);
      } catch (error) {
        console.error("Error fetching past job:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <Loader text="Loading past job data..." />;
  }

  if (!pastJobData) {
    return <div>Past job not found</div>;
  }

  return (
    <div>
      <h1>Edit Job Experience</h1>
      <PastJobForm item={pastJobData} itemType="PastJob" onSubmit={onSubmit} />
    </div>
  );
}
