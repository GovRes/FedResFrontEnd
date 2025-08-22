"use client";
import { useState } from "react";
import PastJobForm from "../../components/PastJobForm";
import { PastJobType, pastJobZodSchema } from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/lib/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { z } from "zod";

// Create the form schema and type
const pastJobFormSchema = (pastJobZodSchema as z.ZodObject<any>).omit({
  userId: true,
  id: true,
  qualifications: true,
});
type PastJobFormData = z.infer<typeof pastJobFormSchema>;

export default function NewVolunteerPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData: PastJobFormData): Promise<void> => {
    setLoading(true);
    try {
      // Combine form data with user ID
      const completePastJobData = {
        ...formData,
        userId: user.userId,
      };

      const { data } = await createModelRecord("PastJob", completePastJobData);
      router.push(`/profile/volunteers/${data.id}`);
    } catch (error) {
      console.error("Error creating volunteer experience:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Creating volunteer experience..." />;
  }

  return (
    <div>
      <h1>New Volunteer Experience</h1>
      <PastJobForm itemType="Volunteer" onSubmit={onSubmit} />
    </div>
  );
}
