import { z } from "zod";
import { agencies } from "@/app/utils/usaJobsCodes";
import { UserType, userZodSchema } from "@/app/utils/userAttributeUtils";
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
  degree: z.string().optional(),
  gpa: z.string().optional(),
  id: z.string().optional(),
  major: z.string().optional(),
  minor: z.string().optional(),
  school: z.string().min(1, "School or institution is required"),
  schoolCity: z.string().optional(),
  schoolState: z.string().optional(),
  type: z.string(), // "education" or "certification"
  userId: z.string(),
});
export const educationArrayZodSchema = z.object({
  education: z.array(educationZodSchema),
});
export type EducationType = z.infer<typeof educationZodSchema>;
export const awardZodSchema = z.object({
  date: z.string(),
  id: z.string().optional(),
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
const optionalString = z.string().optional().or(z.literal(""));
const optionalNumber = z
  .string()
  .transform((val) => (val === "" ? undefined : parseFloat(val)))
  .optional();

export const jobSearchZodSchema = z.object({
  keyword: optionalString,
  locationName: optionalString,
  radius: optionalNumber,
  organization: z.union([agencyEnum, z.literal("")]).optional(),
  positionTitle: optionalString,
  positionScheduleType: optionalString,
  remote: z.boolean().optional(),
  travelPercentage: optionalString,
  user: userZodSchema.optional(),
});
export interface JobSearchObject {
  keyword?: string | undefined;
  locationName?: string | undefined;
  radius?: number | undefined;
  organization?: keyof typeof agencies | "" | undefined;
  positionTitle?: string | undefined;
  positionScheduleType?: string | undefined;
  remote?: boolean | undefined;
  travelPercentage?: string | undefined;
  user?: UserType;
}
export const topicZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  jobId: z.string(),
  keywords: z.array(z.string()),
  description: z.string().optional(),
  //maybe are not needed
  evidence: z.string().optional(),
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
  paragraph: z.string().optional(),
  question: z.string().optional(),
  userId: z.string(),
  userConfirmed: z.boolean(),
});

export type QualificationType = z.infer<typeof qualificationZodSchema>;

export const pastJobZodSchema = z.object({
  endDate: z.string().optional(),
  gsLevel: z.string().optional(),
  hours: z.string().optional(),
  id: z.string().optional(),
  organization: z.string().min(1, "Organization is required"),
  organizationAddress: z.string().optional(),
  qualifications: z.array(qualificationZodSchema).optional(),
  responsibilities: z.string().optional(),
  startDate: z.string().optional(),
  supervisorMayContact: z.boolean().optional(),
  supervisorName: z.string().optional(),
  supervisorPhone: z.string().optional(),
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

export interface JobType {
  id?: string;
  agencyDescription?: string;
  department: string;
  duties: string;
  evaluationCriteria: string;
  qualificationsSummary: string;
  questionnaire?: string;
  requiredDocuments: string;
  title: string;
  topics?: TopicType[];
  usaJobsId: string;
}
