import { EducationType, educationZodSchema } from "@/app/utils/responseSchemas";
import BaseForm from "@/app/components/forms/BaseForm";
import {
  SubmitButton,
  GenericFieldWithLabel,
} from "@/app/components/forms/Inputs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create a form-specific schema without userId and id (handled by parent)
const educationFormSchema = educationZodSchema.omit({ userId: true, id: true });
type EducationFormData = z.infer<typeof educationFormSchema>;

export default function EducationForm({
  item,
  onSubmit,
}: {
  item?: EducationType;
  onSubmit: (data: EducationFormData) => void;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationFormSchema),
    defaultValues: {
      degree: item?.degree || "",
      major: item?.major || "",
      minor: item?.minor || "",
      school: item?.school || "",
      schoolCity: item?.schoolCity || "",
      schoolState: item?.schoolState || "",
      date: item?.date || "",
      gpa: item?.gpa || "",
      type: item?.type || "education", // Default to "education"
    },
  });

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  return (
    <BaseForm onSubmit={handleSubmit(onSubmit, onError)}>
      <GenericFieldWithLabel
        errors={errors}
        label="Degree"
        name="degree"
        register={register}
        schema={educationFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Major"
        name="major"
        register={register}
        schema={educationFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Minor"
        name="minor"
        register={register}
        schema={educationFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="School or Institution"
        name="school"
        register={register}
        schema={educationFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="School or Institution City"
        name="schoolCity"
        register={register}
        schema={educationFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="School or Institution State"
        name="schoolState"
        register={register}
        schema={educationFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Graduation Date"
        name="date"
        register={register}
        schema={educationFormSchema}
        type="date"
      />
      <GenericFieldWithLabel
        errors={errors}
        label="GPA"
        name="gpa"
        register={register}
        schema={educationFormSchema}
        type="number"
        placeholder="e.g., 3.5"
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Type"
        name="type"
        register={register}
        schema={educationFormSchema}
        options={{
          education: "Education",
          certification: "Certification",
        }}
      />
      <SubmitButton>Submit</SubmitButton>
    </BaseForm>
  );
}
