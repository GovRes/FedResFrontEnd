import { SpecializedExperienceType } from "@/app/utils/responseSchemas";

export default function SpecializedExperienceItem({
  specializedExperience,
}: {
  specializedExperience: SpecializedExperienceType;
}) {
  return (
    <div>
      <div>
        {specializedExperience.title.toUpperCase()}.{" "}
        {specializedExperience.paragraph}
      </div>
    </div>
  );
}
