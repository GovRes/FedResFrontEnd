import { SpecializedExperienceType } from "@/app/utils/responseSchemas";

export default function EducationExperienceItem({
  experience,
}: {
  experience: SpecializedExperienceType;
}) {
  return (
    <div>
      <div>
        {experience.title.toUpperCase()}. {experience.paragraph}
      </div>
    </div>
  );
}
