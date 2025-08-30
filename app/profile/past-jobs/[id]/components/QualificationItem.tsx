import {
  ApplicationType,
  QualificationType,
} from "@/lib/utils/responseSchemas";
import Link from "next/link";

export default function QualificationItem({
  qualification,
}: {
  qualification: QualificationType;
}) {
  return (
    <div className="border p-4 rounded mb-4 bg-white shadow">
      <h3 className="text-lg font-semibold mb-2">{qualification.title}</h3>
      <p className="mb-2">{qualification.description}</p>
      {qualification.paragraph && (
        <>
          <h4>Paragraph describing qualifications:</h4>
          <p className="text-sm text-gray-500">{qualification.paragraph}</p>
        </>
      )}
      <h4>Used in applications for:</h4>
      <ul className="list-disc list-inside">
        {qualification.applications.map((app: ApplicationType) => (
          <li key={app.id}>
            <Link href={`/profile/applications/${app.id}`}>
              {app.job.title} at {app.job.department}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
