"use client";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import PastJobForm from "@/app/profile/past-jobs/components/PastJobForm";
import { PastJobType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";

export default function EditPastJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
      await updateModelRecord("PastJob", id, formData);
    } catch (error) {
      console.error("Error updating past job:", error);
    }
    setLoading(false);
    router.push(`/profile/past-jobs/${id}`);
  };
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const pastJobData = await fetchModelRecord("PastJob", id);
      setFormData({ ...formData, ...pastJobData });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <TextBlinkLoader text="loading past job data" />;
  }
  if (!loading && formData) {
    return (
      <div>
        <h1>Edit Job</h1>
        <PastJobForm
          item={formData}
          itemType="PastJob"
          onChange={onChange}
          onChangeToggle={onChangeToggle}
          onSubmit={onSubmit}
        />
      </div>
    );
  }
}
