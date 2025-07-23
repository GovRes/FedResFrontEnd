import { educationZodSchema } from "@/app/utils/responseSchemas";
import { GenericFieldWithLabel } from "@/app/components/forms/Inputs";

export default function EducationForm({
  errors,
  register,
}: {
  errors?: any;
  register: any;
}) {
  return (
    <>
      <GenericFieldWithLabel
        errors={errors}
        label="Degree"
        name="degree"
        register={register}
        schema={educationZodSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Major"
        name="major"
        register={register}
        schema={educationZodSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Minor"
        name="minor"
        register={register}
        schema={educationZodSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="School or Institution"
        name="school"
        register={register}
        schema={educationZodSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="School or Institution City"
        name="schoolCity"
        register={register}
        schema={educationZodSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="School or Institution State"
        name="schoolState"
        register={register}
        schema={educationZodSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Graduation Date"
        name="date"
        register={register}
        schema={educationZodSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="GPA"
        name="gpa"
        register={register}
        schema={educationZodSchema}
      />
    </>
  );
}
