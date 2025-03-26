import { SpecializedExperienceType } from "@/app/utils/responseSchemas";

export default function SpecializedExperienceItem({
  experience,
}: {
  experience: SpecializedExperienceType;
}) {
  return (
    <div key={experience.id}>
      <strong>{experience.title}</strong> - {experience.description}{" "}
    </div>
  );
}
