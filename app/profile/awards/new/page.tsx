"use client";
import { useState } from "react";
import AwardForm from "../components/AwardForm";
import { AwardType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function NewAwardPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AwardType>({
    id: "",
    title: "",
    date: "",
    userId: user.userId,
  });
  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    if (formData) {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      let res = await createModelRecord("Award", formData);
      setLoading(false);
      router.push(`/profile/awards/${res.id}`);
    } catch (error) {
      console.error("Error updating past job:", error);
    }
  };

  if (loading) {
    return <Loader text="loading award data" />;
  }
  return (
    <div>
      <h1>New Award</h1>
      <AwardForm item={formData} onChange={onChange} onSubmit={onSubmit} />
    </div>
  );
}
