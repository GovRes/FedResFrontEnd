import { QualificationType } from "@/lib/utils/responseSchemas";

export default function QualificationItem({
  qualification,
}: {
  qualification: QualificationType;
}) {
  console.log("Rendering qualification:", qualification);
  return (
    <li key={qualification.id}>
      {qualification.id} - {qualification.title} ({qualification.pastJob.title}{" "}
      - {qualification.pastJob.organization}) User confirmed?{" "}
      {qualification.userConfirmed ? "Yes" : "No"}
    </li>
  );
}
