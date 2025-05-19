import {
  AwardType,
  EducationType,
  ResumeType,
  SpecializedExperienceType,
  QualificationType,
  PastJobType,
} from "./responseSchemas";

export function generateHeadingText(
  item:
    | AwardType
    | EducationType
    | ResumeType
    | SpecializedExperienceType
    | PastJobType
    | QualificationType
) {
  let headingText = "";
  if ("degree" in item && "school" in item) {
    headingText = `${(item as any).degree} from ${(item as any).school}`;
  } else if ("organization" in item && "title" in item) {
    headingText = `${item.title} at ${item["organization"]}`;
  } else if ("title" in item) {
    headingText = `${item.title}`;
  } else if ("name" in item && typeof (item as any).name === "string") {
    headingText = (item as any).name;
  }
  return headingText;
}

export function toPascalCase(str: string) {
  // Split the string by spaces
  const words = str.split(" ");

  // Capitalize the first letter of each word and join them
  const pascalCase = words
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");

  return pascalCase;
}

export function pascalToDashed(str: string) {
  // Convert PascalCase to dashed-case
  const dashed = str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  return dashed;
}

export function pascalToSpaced(str: string) {
  // Convert PascalCase to spaced
  const spaced = str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced;
}
