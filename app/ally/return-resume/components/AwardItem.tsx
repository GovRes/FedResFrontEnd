import { AwardType } from "@/app/utils/responseSchemas";

export default function AwardItem({ award }: { award: AwardType }) {
  return (
    <div>
      <div>
        {award.title} - {award.date}
      </div>
    </div>
  );
}
