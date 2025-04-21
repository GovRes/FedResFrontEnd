import { title } from "process";
import { z } from "zod";

export const Keywords = z.object({
  keywords: z.array(z.string()),
});

export const Qualification = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const Recommendation = z.object({
  numberOfQualifiedKeyPhrases: z.number(),
  recommendation: z.enum(["Recommend", "Do not recommend"]),
  justification: z.string(),
});
export const Qualifications = z.object({
  recommendation: Recommendation.optional(),
  metQualifications: z.array(Qualification),
  unmetQualifications: z.array(Qualification),
});

export type QualificationType = z.infer<typeof Qualification>;
export type QualificationsType = z.infer<typeof Qualifications>;
export const Education = z.object({
  id: z.string(),
  degree: z.string(),
  major: z.string(),
  school: z.string(),
  date: z.string(),
  title: z.string(),
  userConfirmed: z.boolean().optional(),
});
export const EducationArraySchema = z.object({
  education: z.array(Education),
});
export type EducationType = z.infer<typeof Education>;
export const Award = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
});
export const AwardsArraySchema = z.object({
  awards: z.array(Award),
});
export type AwardType = z.infer<typeof Award>;

export const SpecializedExperience = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  userConfirmed: z.boolean().optional(),
  paragraph: z.string().optional(),
  initialMessage: z.string(),
  typeOfExperience: z.enum([
    "degree",
    "certification",
    "license",
    "experience",
    "other",
  ]),
});

export const SpecializedExperienceArraySchema = z.object({
  specializedExperiences: z.array(SpecializedExperience),
});
export const Topic = z.object({
  id: z.string(),
  title: z.string(),
  keywords: z.array(z.string()),
  description: z.string().optional(),
  //maybe are not needed
  evidence: z.string().optional(),
  question: z.string().optional(),
});

export type SpecializedExperienceType = z.infer<typeof SpecializedExperience>;

export const TopicsArraySchema = z.object({
  topics: z.array(Topic),
});

export type TopicType = z.infer<typeof Topic>;

export type ResumeType = {
  path: string;
  lastModified: Date;
  eTag: string;
};

export const UserJobQualification = z.object({
  id: z.string(),
  topic: Topic,
  description: z.string(),
  title: z.string(),
  paragraph: z.string().optional(),
  userConfirmed: z.boolean(),
});

export type UserJobQualificationType = z.infer<typeof UserJobQualification>;

export const UserJob = z.object({
  endDate: z.string().optional(),
  hours: z.string().optional(),
  gsLevel: z.string().optional(),
  id: z.string(),
  startDate: z.string().optional(),
  organization: z.string(),
  title: z.string(),
  responsibilities: z.string().optional(),
  userJobQualifications: z.array(UserJobQualification),
});

export type UserJobType = z.infer<typeof UserJob>;
export type UserJobQualification = z.infer<typeof UserJobQualification>;
export const UserJobsArraySchema = z.object({ userJobs: z.array(UserJob) });
export const Volunteer = z.object({
  endDate: z.string().optional(),
  hours: z.string().optional(),
  gsLevel: z.string().optional(),
  id: z.string(),
  startDate: z.string().optional(),
  organization: z.string(),
  title: z.string(),
  responsibilities: z.string().optional(),
  userJobQualifications: z.array(UserJobQualification),
});
export type VolunteerType = z.infer<typeof Volunteer>;
export const VolunteerArraySchema = z.object({ volunteer: z.array(Volunteer) });
export type StepType =
  | "temp_registration"
  | "usa_jobs"
  | "specialized_experience"
  | "extract_keywords"
  | "sort_topics"
  | "resume"
  | "user_jobs"
  | "user_job_details"
  | "awards"
  | "education"
  | "volunteer"
  | "volunteer_details"
  | "return_resume"
  | "pause";

export interface JobType {
  agencyDescription: string;
  department: string;
  duties: string;
  evaluationCriteria: string;
  qualificationsSummary: string;
  requiredDocuments: string;
  title: string;
}
