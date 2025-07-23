import { educationZodSchema } from "@/app/utils/responseSchemas";
import BaseForm from "@/app/components/forms/BaseForm";
import {
  SubmitButton,
  GenericFieldWithLabel,
} from "@/app/components/forms/Inputs";
import { useWatch } from "react-hook-form";
import EducationForm from "./EducationForm";
import CertificationForm from "./CertificationForm";

export default function EducationFormSwitch({
  methods,
  onSubmit,
}: {
  methods: any; // React Hook Form methods
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const formType = useWatch({
    control: methods.control,
    name: "type",
  });

  return (
    <BaseForm onSubmit={onSubmit}>
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Degree"
        name="degree"
        register={methods.register}
        schema={educationZodSchema}
      />
      {formType &&
        (formType === "education" ? (
          <>
            <EducationForm
              errors={methods.formState.errors}
              register={methods.register}
            />
            <SubmitButton disabled={!methods.formState.isValid}>
              Submit
            </SubmitButton>
          </>
        ) : (
          <>
            <CertificationForm
              errors={methods.formState.errors}
              register={methods.register}
            />
            <SubmitButton disabled={!methods.formState.isValid}>
              Submit
            </SubmitButton>
          </>
        ))}
    </BaseForm>
  );
}
