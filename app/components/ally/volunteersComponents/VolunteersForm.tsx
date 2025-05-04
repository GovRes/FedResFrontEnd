import { PastJobType } from "@/app/utils/responseSchemas";
import BaseForm from "../../forms/BaseForm";
import {
  SubmitButton,
  TextAreaWithLabel,
  TextWithLabel,
} from "../../forms/Inputs";
export default function VolunteersForm({
  item,
  onChange,
  onSubmit,
}: {
  item?: PastJobType;
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
      <TextAreaWithLabel
        label="Responsibilities"
        name="responsibilities"
        value={item?.responsibilities}
        onChange={onChange}
      />
      <SubmitButton type="submit">Submit</SubmitButton>
    </BaseForm>
  );
}
