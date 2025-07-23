import { educationZodSchema, EducationType } from "@/app/utils/responseSchemas";
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
        label="Certificate Title"
        name="degree"
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
        label="Date of Completion"
        name="date"
        register={register}
        schema={educationZodSchema}
      />
    </>
  );
}
