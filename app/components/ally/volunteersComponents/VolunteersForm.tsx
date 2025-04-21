import { UserJobType } from "@/app/utils/responseSchemas";
import BaseForm from "../../forms/BaseForm";
import {
  SubmitButton,
  TextAreaWithLabel,
  TextWithLabel,
} from "../../forms/Inputs";
export default function VolunteersForm({
  userJob,
  onChange,
  onSubmit,
}: {
  userJob?: UserJobType;
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
        value={userJob?.title}
        onChange={onChange}
      />
      <TextWithLabel
        label="Organization"
        name="organization"
        value={userJob?.organization}
        onChange={onChange}
      />
      <TextWithLabel
        label="Start Date"
        name="startDate"
        value={userJob?.startDate}
        onChange={onChange}
      />
      <TextWithLabel
        label="End Date"
        name="endDate"
        value={userJob?.endDate}
        onChange={onChange}
      />
      <TextWithLabel
        label="Hours worked per week"
        name="hours"
        value={userJob?.hours}
        onChange={onChange}
      />
      <TextAreaWithLabel
        label="Responsibilities"
        name="responsibilities"
        value={userJob?.responsibilities}
        onChange={onChange}
      />
      <SubmitButton type="submit">Submit</SubmitButton>
    </BaseForm>
  );
}
