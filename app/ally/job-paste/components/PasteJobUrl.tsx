import {
  GenericFieldWithLabel,
  SubmitButton,
} from "@/app/components/forms/Inputs";
import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { usaJobsTextFetch } from "@/app/utils/usaJobsTextFetch";
import processUSAJob from "@/app/utils/processUSAJob";
const stringFieldSchema = z.object({
  value: z.string(),
});
export default function PastJobUrl() {
  const [loading, setLoading] = useState(false);
  const onSubmit = async (data: { value: string }): Promise<void> => {
    setLoading(true);
    // Extract the job ID from the URL
    const url = new URL(data.value);
    const matchResult = url.pathname.match(/\/job\/(\d+)/);
    const jobId = matchResult ? matchResult[1] : null;
    if (jobId) {
      let results = await fetch(`/api/jobs/${jobId}`).then((res) => res.json());
      console.log("Results from USA Jobs Text Fetch:", results);
      processUSAJob(results);
    }

    setLoading(false);
  };
  const onError = (errors: any) => {
    setLoading(false);
    console.error("Form validation errors:", errors);
  };
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: {
      value: "",
    },
  });
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <div>
        Paste the URL of a job from USAJobs.gov that you would like to apply
        for.
      </div>
      <form
        onSubmit={(e) => {
          console.log("Form onSubmit triggered directly!");
          handleSubmit(onSubmit, onError)(e);
        }}
      >
        <GenericFieldWithLabel
          errors={errors}
          label="Paste the full job URL here"
          name="value"
          register={register}
          schema={stringFieldSchema}
        />
        <SubmitButton>Submit</SubmitButton>
      </form>
    </div>
  );
}
