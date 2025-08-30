import { PastJobType } from "@/lib/utils/responseSchemas";
import { pascalToDashed } from "@/lib/utils/stringBuilders";
import Link from "next/link";

export default function PastJobItem({
  pastJob,
  pastJobType,
}: {
  pastJob: PastJobType;
  pastJobType: "PastJob" | "Volunteer";
}) {
  return (
    <li key={pastJob.id}>
      <Link href={`/profile/${pascalToDashed(pastJobType)}s/${pastJob.id}`}>
        {pastJob.title}
      </Link>{" "}
      at {pastJob.organization} ({pastJob.startDate} -
      {pastJob.endDate || "Present"})
    </li>
  );
}
