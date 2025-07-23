import BaseForm from "@/app/components/forms/BaseForm";
import {
  GenericFieldWithLabel,
  SubmitButton,
  ToggleWithLabel,
} from "@/app/components/forms/Inputs";
import { pastJobZodSchema } from "@/app/utils/responseSchemas";

export default function PastJobForm({
  itemType,
  loading = false,
  methods,
  onSubmit,
}: {
  itemType: "PastJob" | "Volunteer";
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
        schema={pastJobZodSchema}
      />
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Organization"
        name="organization"
        register={methods.register}
        schema={pastJobZodSchema}
      />
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Organization Address"
        name="organizationAddress"
        register={methods.register}
        schema={pastJobZodSchema}
      />
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Start Date"
        name="startDate"
        register={methods.register}
        schema={pastJobZodSchema}
      />
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="End Date"
        name="endDate"
        register={methods.register}
        schema={pastJobZodSchema}
      />
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Hours worked per week"
        name="hours"
        register={methods.register}
        schema={pastJobZodSchema}
      />
      {itemType === "PastJob" && (
        <GenericFieldWithLabel
          errors={methods.formState.errors}
          label="GS Level"
          name="gsLevel"
          register={methods.register}
          schema={pastJobZodSchema}
        />
      )}
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Responsibilities"
        name="responsibilities"
        type="textarea"
        register={methods.register}
        schema={pastJobZodSchema}
      />
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Supervisor Name"
        name="supervisorName"
        register={methods.register}
        schema={pastJobZodSchema}
      />
      <GenericFieldWithLabel
        errors={methods.formState.errors}
        label="Supervisor Phone"
        name="supervisorPhone"
        register={methods.register}
        schema={pastJobZodSchema}
      />
      <ToggleWithLabel
        errors={methods.formState.errors}
        label="May Contact Supervisor"
        name="supervisorMayContact"
        register={methods.register}
        schema={pastJobZodSchema}
      />
      <input type="hidden" name="type" value={itemType} />
      <SubmitButton disabled={!methods.formState.isValid || loading}>
        {loading ? "Saving..." : "Save Job"}
      </SubmitButton>
    </BaseForm>
  );
}
