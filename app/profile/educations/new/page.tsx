"use client";
import { useState } from "react";
import EducationForm from "../components/EducationForm";
import { EducationType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function NewAwardPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EducationType>({
    date: "",
    degree: "",
    gpa: "",
    id: "",
    major: "",
    minor: "",
    school: "",
    schoolCity: "",
    schoolState: "",
    title: "",
    userConfirmed: false,
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
      let res = await createModelRecord("Education", formData);
      setLoading(false);
      router.push(`/profile/educations/${res.id}`);
    } catch (error) {
      console.error("Error updating education:", error);
    }
  };

  if (loading) {
    return <Loader text="loading volunteer data" />;
  }
  return (
    <div>
      <h1>New Educational Experience</h1>
      <EducationForm item={formData} onChange={onChange} onSubmit={onSubmit} />
    </div>
  );
}
