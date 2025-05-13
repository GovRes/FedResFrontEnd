"use client";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import EducationForm from "../../components/EducationForm";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { EducationType } from "@/app/utils/responseSchemas";
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
  const [formData, setFormData] = useState<EducationType>({
    date: "",
    degree: "",
    gpa: "",
    id: "",
    major: "",
    school: "",
    schoolCity: "",
    schoolState: "",
    title: "",
    userConfirmed: false,
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
      await updateModelRecord("Education", id, formData);
    } catch (error) {
      console.error("Error updating past job:", error);
    }
    setLoading(false);
    router.push(`/profile/educations/${id}`);
  };
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const educationData = await fetchModelRecord("Education", id);
      setFormData({ ...formData, ...educationData });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <TextBlinkLoader text="loading education data" />;
  }
  if (!loading && formData) {
    return (
      <div>
        <h1>Edit Job</h1>
        <EducationForm
          item={formData}
          onChange={onChange}
          onSubmit={onSubmit}
        />
      </div>
    );
  }
}
