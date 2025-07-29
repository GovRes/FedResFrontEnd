"use client";
import { AwardType, awardZodSchema } from "@/app/utils/responseSchemas";
import BaseForm from "@/app/components/forms/BaseForm";
import {
  SubmitButton,
  GenericFieldWithLabel,
} from "@/app/components/forms/Inputs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create a form-specific schema without userId (since it's handled by the parent)
const awardFormSchema = awardZodSchema.omit({ userId: true, id: true });
type AwardFormData = z.infer<typeof awardFormSchema>;

export default function AwardForm({
  item,
  onSubmit,
}: {
  item?: AwardType;
  onSubmit: (data: AwardFormData) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<AwardFormData>({
    resolver: zodResolver(awardFormSchema),
    defaultValues: {
      title: item?.title || "",
      date: item?.date || "",
    },
  });

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  return (
    <BaseForm onSubmit={handleSubmit(onSubmit, onError)}>
      <GenericFieldWithLabel
        errors={errors}
        label="Title"
        name="title"
        register={register}
        schema={awardFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Date(s)"
        name="date"
        register={register}
        schema={awardFormSchema}
      />
      <SubmitButton>Submit</SubmitButton>
    </BaseForm>
  );
}
