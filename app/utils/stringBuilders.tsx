import {
  AwardType,
  EducationType,
  SpecializedExperienceType,
  UserJobQualificationType,
  UserJobType,
} from "./responseSchemas";

export function generateHeadingText(
  item:
    | AwardType
    | EducationType
    | UserJobType
    | UserJobQualificationType
    | SpecializedExperienceType
) {
  let headingText = "";
  if ("degree" in item && "school" in item) {
    headingText = `${(item as any).degree} from ${(item as any).school}`;
  } else if ("organization" in item && "title" in item) {
    console.log("item:", item);
    headingText = `${item.title} at ${item["organization"]}`;
    console.log(headingText);
  } else if ("title" in item) {
    headingText = `${item.title}`;
  } else if ("name" in item && typeof (item as any).name === "string") {
    headingText = (item as any).name;
  }
  return headingText;
}
