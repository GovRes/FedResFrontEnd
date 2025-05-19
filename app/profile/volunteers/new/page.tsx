"use client";
import { useState } from "react";
import PastJobForm from "../../components/components/PastJobForm";
import { PastJobType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function NewVolunteerPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PastJobType>({
    endDate: "",
    gsLevel: "",
    hours: "",
    id: "",
    organization: "",
    organizationAddress: "",
    qualifications: [],
    responsibilities: "",
    startDate: "",
    supervisorMayContact: false,
    supervisorName: "",
    supervisorPhone: "",
    title: "",
    type: "Volunteer",
    userId: "",
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
  const onChangeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      supervisorMayContact: e.target.checked,
    });
  };

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      let res = await createModelRecord("PastJob", formData);
      setLoading(false);
      router.push(`/profile/volunteers/${res.id}`);
    } catch (error) {
      console.error("Error updating past job:", error);
    }
  };

  if (loading) {
    return <TextBlinkLoader text="loading volunteer data" />;
  }
  return (
    <div>
      <h1>New Volunteer Experience</h1>
      <PastJobForm
        item={formData}
        itemType="Volunteer"
        onChange={onChange}
        onChangeToggle={onChangeToggle}
        onSubmit={onSubmit}
      />
    </div>
  );
}
