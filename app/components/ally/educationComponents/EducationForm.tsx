import { EducationType } from "@/app/utils/responseSchemas";
import BaseForm from "../../forms/BaseForm";
import { SubmitButton, TextWithLabel } from "../../forms/Inputs";

export default function EducationForm({
  education,
  onChange,
  onSubmit,
}: {
  education?: EducationType;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <BaseForm onSubmit={onSubmit}>
      <TextWithLabel
        label="Degree"
        name="degree"
        value={education?.degree || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="Major"
        name="major"
        value={education?.major || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="School or Institution"
        name="school"
        value={education?.school || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="Graduation Date"
        name="date"
        value={education?.date || ""}
        onChange={onChange}
      />
      <SubmitButton type="submit">Submit</SubmitButton>
    </BaseForm>
  );
}
