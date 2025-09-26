"use client";
import { Loader } from "@/app/components/loader/Loader";
import { updateModelRecord } from "@/lib/crud/genericUpdate";
import { fetchModelRecord } from "@/lib/crud/genericFetch";
import PastJobForm from "@/app/profile/components/PastJobForm";
import { PastJobType, pastJobZodSchema } from "@/lib/utils/responseSchemas";
import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

// Create the form schema and type
const pastJobFormSchema = (pastJobZodSchema as z.ZodObject<any>).omit({
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
        endDate: volunteerData!.endDate,
        gsLevel: volunteerData!.gsLevel,
        hours: volunteerData!.hours,
        organization: volunteerData!.organization,
        organizationAddress: volunteerData!.organizationAddress,
        responsibilities: volunteerData!.responsibilities,
        startDate: volunteerData!.startDate,
        supervisorMayContact: volunteerData!.supervisorMayContact,
        supervisorName: volunteerData!.supervisorName,
        supervisorPhone: volunteerData!.supervisorPhone,
        title: volunteerData!.title,
        type: volunteerData!.type,
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
        const { data } = await fetchModelRecord("PastJob", id);
        setVolunteerData(data);
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
