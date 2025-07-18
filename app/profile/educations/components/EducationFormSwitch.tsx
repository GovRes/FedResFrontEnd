import { EducationType } from "@/app/utils/responseSchemas";
import BaseForm from "@/app/components/forms/BaseForm";
import { SelectWithLabel, SubmitButton } from "@/app/components/forms/Inputs";
import { useState } from "react";
import EducationForm from "./EducationForm";
import CertificationForm from "./CertificationForm";

export default function EducationFormSwitch({
  item,
  onChange,
  onSubmit,
}: {
  item?: EducationType;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [formType, setFormType] = useState<string | null>(item?.type || null);
  function updateFormType(e: React.ChangeEvent<HTMLSelectElement>) {
    setFormType(e.target.value);
  }
  return (
    <BaseForm onSubmit={onSubmit}>
      <SelectWithLabel
        allowNull={true}
        label="Type of education"
        name="type"
        options={{ education: "Education", certification: "Certification" }}
        onChange={updateFormType}
        value={item?.type || ""}
      />
      {formType &&
        (formType === "education" ? (
          <EducationForm item={item} onChange={onChange} />
        ) : (
          <CertificationForm item={item} onChange={onChange} />
        ))}

      <SubmitButton type="submit">Submit</SubmitButton>
    </BaseForm>
  );
}
