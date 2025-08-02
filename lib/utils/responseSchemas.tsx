import { z } from "zod";
import { agencies } from "@/lib/utils/usaJobsCodes";
import { UserType, userZodSchema } from "@/lib/utils/userAttributeUtils";
export type ApplicationType = {
  awards?: AwardType[];
  completedSteps: string[];
  educations?: EducationType[];
  id: string;
  jobId: string;
  job: JobType;
  resumes?: ResumeType[];
  status: string;
  userId: string;
  pastJobs?: PastJobType[];
  volunteers?: PastJobType[];
};
export const Keywords = z.object({
  keywords: z.array(z.string()),
});
export const educationZodSchema = z.object({
  date: z.string().min(1, "Date is required"),
  degree: z.string().nullish(),
  gpa: z.string().nullish(),
  id: z.string().nullish(),
  major: z.string().nullish(),
  minor: z.string().nullish(),
  school: z.string().min(1, "School or institution is required"),
  schoolCity: z.string().nullish(),
  schoolState: z.string().nullish(),
  type: z.string(), // "education" or "certification"
  userId: z.string(),
});
export const educationArrayZodSchema = z.object({
  education: z.array(educationZodSchema),
});
export type EducationType = z.infer<typeof educationZodSchema>;
export const awardZodSchema = z.object({
  date: z.string(),
  id: z.string().nullish(),
  title: z.string(),
  userId: z.string(),
});
export const awardsArrayZodSchema = z.object({
  awards: z.array(awardZodSchema),
});
export type AwardType = z.infer<typeof awardZodSchema>;

const agencyKeys = Object.keys(agencies) as Array<keyof typeof agencies>;
const agencyEnum = z.enum(
  agencyKeys as [keyof typeof agencies, ...Array<keyof typeof agencies>]
);
const optionalString = z.string().nullish().or(z.literal(""));
const optionalNumber = z
  .string()
  .transform((val) => (val === "" ? undefined : parseFloat(val)))
  .nullish();

export const jobSearchZodSchema = z.object({
  keyword: optionalString,
  locationName: optionalString,
  radius: optionalNumber,
  organization: z.union([agencyEnum, z.literal("")]).nullish(),
  positionTitle: optionalString,
  positionScheduleType: optionalString,
  remote: z.boolean().nullish(),
  travelPercentage: optionalString,
  user: userZodSchema.nullish(),
});
export interface JobSearchObject {
  keyword?: string | undefined | null;
  locationName?: string | undefined | null;
  radius?: number | undefined | null;
  organization?: keyof typeof agencies | "" | undefined | null;
  positionTitle?: string | undefined | null;
  positionScheduleType?: string | undefined | null;
  remote?: boolean | undefined | null;
  travelPercentage?: string | undefined | null;
  user?: UserType | null | undefined;
}
export const topicZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  jobId: z.string(),
  keywords: z.array(z.string()),
  description: z.string().nullish(),
  //maybe are not needed
  evidence: z.string().nullish(),
});

export const topicsArrayZodSchema = z.object({
  topics: z.array(topicZodSchema),
});

export type TopicType = z.infer<typeof topicZodSchema>;

export type ResumeType = {
  path: string;
  lastModified: Date;
  eTag: string;
  id: string;
  userId?: string;
};

export const qualificationZodSchema = z.object({
  id: z.string(),
  topic: topicZodSchema,
  description: z.string(),
  title: z.string(),
  paragraph: z.string().nullish(),
  question: z.string().nullish(),
  userId: z.string(),
  userConfirmed: z.boolean(),
});

export type QualificationType = z.infer<typeof qualificationZodSchema>;

export const pastJobZodSchema = z.object({
  endDate: z.string().nullish(),
  gsLevel: z.string().nullish(),
  hours: z.string().nullish(),
  id: z.string().nullish(),
  organization: z.string().min(1, "Organization is required"),
  organizationAddress: z.string().nullish(),
  qualifications: z.array(qualificationZodSchema).nullish(),
  responsibilities: z.string().nullish(),
  startDate: z.string().nullish(),
  supervisorMayContact: z.boolean().nullish(),
  supervisorName: z.string().nullish(),
  supervisorPhone: z.string().nullish(),
  title: z.string().min(1, "Title is required"),
  type: z.string(),
  userId: z.string(),
});

export type PastJobType = z.infer<typeof pastJobZodSchema>;
export const pastJobsArrayZodSchema = z.object({
  pastJobs: z.array(pastJobZodSchema),
});

export type StepsType = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  path: string;
  disabled: boolean;
};

export const jobZodSchema = z.object({
  id: z.string().nullish(),
  agencyDescription: z.string().nullish(),
  department: z.string().nullish(),
  duties: z.string().nullish(),
  evaluationCriteria: z.string().nullish(),
  qualificationsSummary: z.string().nullish(),
  questionnaire: z.string().nullish(),
  requiredDocuments: z.string().nullish(),
  title: z.string(),
  topics: z.array(topicZodSchema).nullish(),
  usaJobsId: z.string(),
});

export interface JobType {
  id?: string;
  agencyDescription?: string;
  department: string;
  duties?: string;
  evaluationCriteria?: string;
  qualificationsSummary?: string;
  questionnaire?: string;
  requiredDocuments?: string;
  title: string;
  topics?: TopicType[];
  usaJobsId: string;
}

export interface USAJobsPositionTextFetch {
  usajobsControlNumber: number;
  positionOpenDate: string;
  positionCloseDate: string;
  hiringAgencyCode: string;
  hiringDepartmentCode: string;
  announcementNumber: string;
  summary: string;
  duties: string;
  hiringPathExplanation: string;
  majorDutiesList: string;
  requirementsConditionsOfEmployment: string;
  requirementsQualifications: string;
  requirementsEducation: string;
  requiredStandardDocuments: string;
  requiredDocuments: string;
  howToApply: string;
  howToApplyNextSteps: string;
  requirements: null | string;
  evaluations: string;
  benefitsURL: string;
  benefits: null | string;
  otherInformation: string;
  appointmentTypeOverride: null | string;
  positionScheduleOverride: null | string;
  exclusiveClarificationText: null | string;
  videoURL: string;
  JobCategories: Array<any>; // Could be more specific if you know the structure
}
