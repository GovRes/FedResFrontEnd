import { AwardType } from "@/app/utils/responseSchemas";
import BaseForm from "../../forms/BaseForm";
import { SubmitButton, TextWithLabel } from "../../forms/Inputs";

export default function AwardForm({
  award,
  onChange,
  onSubmit,
}: {
  award?: AwardType;
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
        value={award?.title || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="Date(s)"
        name="date"
        value={award?.date || ""}
        onChange={onChange}
      />
      <SubmitButton type="submit">Submit</SubmitButton>
    </BaseForm>
  );
}
