import { PastJobType } from "@/app/utils/responseSchemas";
import BaseForm from "../../../components/forms/BaseForm";
import {
  SubmitButton,
  TextAreaWithLabel,
  TextWithLabel,
  ToggleWithLabel,
} from "../../../components/forms/Inputs";
interface PastJobFormProps {
  item?: PastJobType;
  itemType: "PastJob" | "Volunteer";
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onChangeToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function PastJobForm({
  item,
  itemType,
  onChange,
  onChangeToggle,
  onSubmit,
}: PastJobFormProps) {
  return (
    <BaseForm onSubmit={onSubmit}>
      <TextWithLabel
        label="Title"
        name="title"
        value={item?.title}
        onChange={onChange}
      />
      <TextWithLabel
        label="Organization"
        name="organization"
        value={item?.organization}
        onChange={onChange}
      />
      <TextWithLabel
        label="Organization Address"
        name="organizationAddress"
        value={item?.organizationAddress}
        onChange={onChange}
      />
      <TextWithLabel
        label="Start Date"
        name="startDate"
        value={item?.startDate}
        onChange={onChange}
      />
      <TextWithLabel
        label="End Date"
        name="endDate"
        value={item?.endDate}
        onChange={onChange}
      />
      <TextWithLabel
        label="Hours worked per week"
        name="hours"
        value={item?.hours}
        onChange={onChange}
      />
      {itemType === "PastJob" && (
        <TextWithLabel
          label="GS Level"
          name="gsLevel"
          value={item?.gsLevel}
          onChange={onChange}
        />
      )}
      <TextAreaWithLabel
        label="Responsibilities"
        name="responsibilities"
        value={item?.responsibilities}
        onChange={onChange}
      />
      <TextWithLabel
        label="Supervisor Name"
        name="supervisorName"
        value={item?.supervisorName}
        onChange={onChange}
      />
      <TextWithLabel
        label="Supervisor Phone"
        name="supervisorPhone"
        value={item?.supervisorPhone}
        onChange={onChange}
      />
      <ToggleWithLabel
        label="May Contact Supervisor"
        name="supervisorMayContact"
        checked={item?.supervisorMayContact || false}
        onChange={onChangeToggle}
      />
      <input type="hidden" name="type" value={itemType} />
      <SubmitButton type="submit">Submit</SubmitButton>
    </BaseForm>
  );
}
