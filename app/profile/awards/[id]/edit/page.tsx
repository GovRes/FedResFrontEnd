"use client";
import { Loader } from "@/app/components/loader/Loader";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import AwardForm from "@/app/profile/awards/components/AwardForm";
import { AwardType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";

export default function EditAwardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<AwardType>({
    id: "",
    title: "",
    date: "",
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

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateModelRecord("Award", id, formData);
    } catch (error) {
      console.error("Error updating award:", error);
    }
    setLoading(false);
    router.push(`/profile/awards/${id}`);
  };
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const awardData = await fetchModelRecord("Award", id);
      setFormData(awardData);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <Loader text="loading award data" />;
  }
  if (!loading && formData) {
    return (
      <div>
        <h1>Edit Award</h1>
        <AwardForm item={formData} onChange={onChange} onSubmit={onSubmit} />
      </div>
    );
  }
}
