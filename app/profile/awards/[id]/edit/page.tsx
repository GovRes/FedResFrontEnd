"use client";
import { useState } from "react";
import AwardForm from "../../components/AwardForm";
import { AwardType, awardZodSchema } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { z } from "zod";

// Create the form schema and type
const awardFormSchema = awardZodSchema.omit({ userId: true, id: true });
type AwardFormData = z.infer<typeof awardFormSchema>;

export default function NewAwardPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData: AwardFormData): Promise<void> => {
    setLoading(true);
    try {
      // Combine form data with user ID
      const completeAwardData: Omit<AwardType, "id"> = {
        ...formData,
        userId: user.userId,
      };

      const res = await createModelRecord("Award", completeAwardData);
      router.push(`/profile/awards/${res.id}`);
    } catch (error) {
      console.error("Error creating award:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Creating award..." />;
  }

  return (
    <div>
      <h1>New Award</h1>
      <AwardForm onSubmit={onSubmit} />
    </div>
  );
}
