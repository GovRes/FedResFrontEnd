import { z } from "zod";
import { UserType } from "@/app/utils/userAttributeInterface";
import { agencies } from "@/app/utils/usaJobsCodes";
export type ApplicationType = {
  awards?: AwardType[];
  completedSteps: string[];
  educations?: EducationType[];
  id: string;
  jobId: string;
  job: JobType;
  resumes?: ResumeType[];
  specializedExperiences?: SpecializedExperienceType[];
  status: string;
  userId: string;
  pastJobs?: PastJobType[];
  volunteers?: PastJobType[];
};
export const Keywords = z.object({
  keywords: z.array(z.string()),
});

export const Recommendation = z.object({
  numberOfQualifiedKeyPhrases: z.number(),
  recommendation: z.enum(["Recommend", "Do not recommend"]),
  justification: z.string(),
});
export const Education = z.object({
  date: z.string(),
  degree: z.string(),
  gpa: z.string().optional(),
  id: z.string(),
  major: z.string(),
  school: z.string(),
  schoolCity: z.string().optional(),
  schoolState: z.string().optional(),
  title: z.string(),
  userConfirmed: z.boolean().optional(),
  userId: z.string(),
});
export const EducationArraySchema = z.object({
  education: z.array(Education),
});
export type EducationType = z.infer<typeof Education>;
export const Award = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  userId: z.string(),
});
export const AwardsArraySchema = z.object({
  awards: z.array(Award),
});
export type AwardType = z.infer<typeof Award>;

export interface JobSearchObject {
  keyword?: string;
  locationName?: string;
  radius?: number;
  organization?: keyof typeof agencies;
  positionTitle?: string;
  positionScheduleType?: string;
  remote?: boolean;
  travelPercentage?: string;
  user: UserType;
}

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
  userId: z.string(),
});

export const SpecializedExperienceArraySchema = z.object({
  specializedExperiences: z.array(SpecializedExperience),
});
export const Topic = z.object({
  id: z.string(),
  title: z.string(),
  jobId: z.string(),
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
  id: string;
  userId?: string;
};

export const Qualification = z.object({
  id: z.string(),
  topic: Topic,
  description: z.string(),
  title: z.string(),
  paragraph: z.string().optional(),
  userId: z.string(),
  userConfirmed: z.boolean(),
});

export type QualificationType = z.infer<typeof Qualification>;

export const PastJob = z.object({
  endDate: z.string().optional(),
  gsLevel: z.string().optional(),
  hours: z.string().optional(),
  id: z.string(),
  organization: z.string(),
  organizationAddress: z.string().optional(),
  qualifications: z.array(Qualification),
  responsibilities: z.string().optional(),
  startDate: z.string().optional(),
  supervisorMayContact: z.boolean().optional(),
  supervisorName: z.string().optional(),
  supervisorPhone: z.string().optional(),
  title: z.string(),
  type: z.string(),
  userId: z.string(),
});

export type PastJobType = z.infer<typeof PastJob>;
export const PastJobsArraySchema = z.object({ pastJobs: z.array(PastJob) });

export const VolunteerArraySchema = z.object({ volunteer: z.array(PastJob) });
export type StepType =
  | "temp_registration"
  | "usa-jobs"
  | "specialized-experience"
  | "extract-keywords"
  | "resume"
  | "past-jobs"
  | "user-job-details"
  | "awards"
  | "education"
  | "volunteer"
  | "volunteer-details"
  | "return-resume"
  | "pause";

export type StepsType = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  path: string;
};

export interface JobType {
  id?: string;
  agencyDescription: string;
  department: string;
  duties: string;
  evaluationCriteria: string;
  qualificationsSummary: string;
  requiredDocuments: string;
  title: string;
  topics?: TopicType[];
  usaJobsId: string;
}
