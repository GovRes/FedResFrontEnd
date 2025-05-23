"use client";
import { AwardType } from "@/app/utils/responseSchemas";
import BaseForm from "@/app/components/forms/BaseForm";
import { SubmitButton, TextWithLabel } from "@/app/components/forms/Inputs";
import { useState } from "react";

export default function AwardForm({
  item,
  onChange,
  onSubmit,
}: {
  item?: AwardType;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <BaseForm onSubmit={onSubmit}>
      <TextWithLabel
        label="Title"
        name="title"
        value={item?.title || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="Date(s)"
        name="date"
        value={item?.date || ""}
        onChange={onChange}
      />
      <SubmitButton type="submit">Submit</SubmitButton>
    </BaseForm>
  );
}
