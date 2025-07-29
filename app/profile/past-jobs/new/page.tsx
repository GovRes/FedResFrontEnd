"use client";
import { useState } from "react";
import PastJobForm from "../../components/components/PastJobForm";
import { PastJobType, pastJobZodSchema } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { z } from "zod";

// Create the form schema and type
const pastJobFormSchema = pastJobZodSchema.omit({
  userId: true,
  id: true,
  qualifications: true,
});
type PastJobFormData = z.infer<typeof pastJobFormSchema>;

export default function NewPastJobPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData: PastJobFormData): Promise<void> => {
    setLoading(true);
    try {
      // Combine form data with user ID
      const completePastJobData: Omit<PastJobType, "id" | "qualifications"> = {
        ...formData,
        userId: user.userId,
      };

      const res = await createModelRecord("PastJob", completePastJobData);
      router.push(`/profile/past-jobs/${res.id}`);
    } catch (error) {
      console.error("Error creating past job:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Creating job experience..." />;
  }

  return (
    <div>
      <h1>New Job Experience</h1>
      <PastJobForm itemType="PastJob" onSubmit={onSubmit} />
    </div>
  );
}
