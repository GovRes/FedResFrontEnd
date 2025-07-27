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
        label="Degree"
        name="degree"
        value={item?.degree || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="Major"
        name="major"
        value={item?.major || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="Minor"
        name="minor"
        value={item?.minor || ""}
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
        label="Graduation Date"
        name="date"
        value={item?.date || ""}
        onChange={onChange}
      />
      <TextWithLabel
        label="GPA"
        name="gpa"
        value={item?.gpa || ""}
        onChange={onChange}
      />
    </>
  );
}
