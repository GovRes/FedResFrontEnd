import { EducationType } from "@/app/utils/responseSchemas";
import BaseForm from "@/app/components/forms/BaseForm";
import { SubmitButton, TextWithLabel } from "@/app/components/forms/Inputs";

export default function EducationForm({
  item,
  onChange,
}: {
  item?: EducationType;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}) {
  return (
    <>
      <TextWithLabel
        label="Certificate Title"
        name="degree"
        value={item?.degree || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="School or Institution"
        name="school"
        value={item?.school || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="School or Institution City"
        name="schoolCity"
        value={item?.schoolCity || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="School or Institution State"
        name="schoolState"
        value={item?.schoolState || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="Date Received"
        name="date"
        value={item?.date || ""}
        onChange={onChange}
      />
    </>
  );
}
