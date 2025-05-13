"use client";
import { useState } from "react";
import PastJobForm from "../components/PastJobForm";
import { PastJobType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useRouter } from "next/navigation";
import { createModelRecord } from "@/app/crud/genericCreate";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function NewAwardPage() {
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
    pastJobQualifications: [],
    responsibilities: "",
    startDate: "",
    supervisorMayContact: false,
    supervisorName: "",
    supervisorPhone: "",
    title: "",
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
      router.push(`/profile/past-jobs/${res.id}`);
    } catch (error) {
      console.error("Error updating past job:", error);
    }
  };

  if (loading) {
    return <TextBlinkLoader text="loading job data" />;
  }
  return (
    <div>
      <h1>New Job Experience</h1>
      <PastJobForm
        itemType="PastJob"
        onChange={onChange}
        onChangeToggle={onChangeToggle}
        onSubmit={onSubmit}
      />
    </div>
  );
}
