import { PastJobType, pastJobZodSchema } from "@/lib/utils/responseSchemas";
import BaseForm from "../../../components/forms/BaseForm";
import {
  SubmitButton,
  GenericFieldWithLabel,
  ToggleWithLabel,
} from "../../../components/forms/Inputs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create a form-specific schema without userId and qualifications (handled by parent)
const pastJobFormSchema = pastJobZodSchema.omit({
  userId: true,
  id: true,
  qualifications: true,
});
type PastJobFormData = z.infer<typeof pastJobFormSchema>;

interface PastJobFormProps {
  item?: PastJobType;
  itemType: "PastJob" | "Volunteer";
  onSubmit: (data: PastJobFormData) => void;
}

export default function PastJobForm({
  item,
  itemType,
  onSubmit,
}: PastJobFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<PastJobFormData>({
    resolver: zodResolver(pastJobFormSchema),
    defaultValues: {
      title: item?.title || "",
      organization: item?.organization || "",
      organizationAddress: item?.organizationAddress || "",
      startDate: item?.startDate || "",
      endDate: item?.endDate || "",
      hours: item?.hours || "",
      gsLevel: item?.gsLevel || "",
      responsibilities: item?.responsibilities || "",
      supervisorName: item?.supervisorName || "",
      supervisorPhone: item?.supervisorPhone || "",
      supervisorMayContact: item?.supervisorMayContact || false,
      type: itemType,
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
        schema={pastJobFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Organization"
        name="organization"
        register={register}
        schema={pastJobFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Organization Address"
        name="organizationAddress"
        register={register}
        schema={pastJobFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Start Date"
        name="startDate"
        register={register}
        schema={pastJobFormSchema}
        type="date"
      />
      <GenericFieldWithLabel
        errors={errors}
        label="End Date"
        name="endDate"
        register={register}
        schema={pastJobFormSchema}
        type="date"
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Hours worked per week"
        name="hours"
        register={register}
        schema={pastJobFormSchema}
        type="number"
      />
      {itemType === "PastJob" && (
        <GenericFieldWithLabel
          errors={errors}
          label="GS Level"
          name="gsLevel"
          register={register}
          schema={pastJobFormSchema}
        />
      )}
      <GenericFieldWithLabel
        errors={errors}
        label="Responsibilities"
        name="responsibilities"
        register={register}
        schema={pastJobFormSchema}
        type="textarea"
        rows={4}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Supervisor Name"
        name="supervisorName"
        register={register}
        schema={pastJobFormSchema}
      />
      <GenericFieldWithLabel
        errors={errors}
        label="Supervisor Phone"
        name="supervisorPhone"
        register={register}
        schema={pastJobFormSchema}
        type="tel"
      />
      <ToggleWithLabel
        errors={errors}
        label="May Contact Supervisor"
        name="supervisorMayContact"
        register={register}
        schema={pastJobFormSchema}
      />
      <input type="hidden" {...register("type")} />
      <SubmitButton>Submit</SubmitButton>
    </BaseForm>
  );
}
