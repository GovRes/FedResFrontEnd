import { EducationType } from "@/lib/utils/responseSchemas";
import Link from "next/link";

export default function EducationItem({
  education,
}: {
  education: EducationType;
}) {
  return (
    <li key={education.id}>
      <Link href={`/profile/educations/${education.id}`}>
        {education.degree}
      </Link>{" "}
      in {education.major} from {education.school} ({education.date})
    </li>
  );
}
