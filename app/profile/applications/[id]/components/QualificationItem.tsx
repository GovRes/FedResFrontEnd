import { QualificationType } from "@/lib/utils/responseSchemas";

export default function QualificationItem({
  qualification,
}: {
  qualification: QualificationType;
}) {
  return (
    <li key={qualification.id}>
      {qualification.id} - {qualification.title} (
      {qualification.pastJobs.items[0].pastJob.title} -{" "}
      {qualification.pastJobs.items[0].pastJob.organization})
    </li>
  );
}
