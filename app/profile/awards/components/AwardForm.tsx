"use client";
import { awardZodSchema } from "@/app/utils/responseSchemas";
import BaseForm from "@/app/components/forms/BaseForm";
import {
  GenericFieldWithLabel,
  SubmitButton,
} from "@/app/components/forms/Inputs";

export default function AwardForm({
  loading = false,
  methods,
  onSubmit,
}: {
  loading: boolean;
  methods: any; // React Hook Form methods
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <BaseForm onSubmit={onSubmit}>
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Title"
        name="title"
        register={methods.register}
        schema={awardZodSchema}
      />
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Date(s)"
        name="date"
        register={methods.register}
        schema={awardZodSchema}
      />
      <SubmitButton disabled={!methods.formState.isValid || loading}>
        {loading ? "Saving..." : "Save Award"}
      </SubmitButton>
    </BaseForm>
  );
}
