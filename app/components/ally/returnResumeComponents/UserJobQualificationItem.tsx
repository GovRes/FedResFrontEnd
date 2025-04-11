import { UserJobQualificationType } from "@/app/utils/responseSchemas";

export default function UserJobQualificationItem({
  userJobQualification,
}: {
  userJobQualification: UserJobQualificationType;
}) {
  return (
    <div>
      <div>
        {userJobQualification.title.toUpperCase()}.{" "}
        {userJobQualification.paragraph}
      </div>
    </div>
  );
}
