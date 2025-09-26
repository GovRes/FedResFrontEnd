import { AwardType } from "@/lib/utils/responseSchemas";
import Link from "next/link";

export default function AwardItem({ award }: { award: AwardType }) {
  return (
    <li key={award.id}>
      <Link href={`/profile/awards/${award.id}`}>{award.title}</Link> -{" "}
      {award.date}
    </li>
  );
}
