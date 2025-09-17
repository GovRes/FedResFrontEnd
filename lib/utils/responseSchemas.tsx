import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { agencies } from "@/lib/utils/usaJobsCodes";
import { UserType, userZodSchema } from "@/lib/utils/userAttributeUtils";

// ============================================================================
// SIMPLE SCHEMAS (no circular dependencies)
// ============================================================================

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

export const topicZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  jobId: z.string(),
  keywords: z.array(z.string()),
  description: z.string().nullish(),
});

export const topicsArrayZodSchema = z.object({
  topics: z.array(topicZodSchema),
});

export type TopicType = z.infer<typeof topicZodSchema>;

export const baseJobZodSchema = z.object({
  id: z.string().nullish(),
  agencyDescription: z.string().nullish(),
  department: z.string().nullish(),
  duties: z.string().nullish(),
  evaluationCriteria: z.string().nullish(),
  qualificationsSummary: z.string().nullish(),
  questionnaire: z.string().nullish(),
  requiredDocuments: z.string().nullish(),
  title: z.string(),
  usaJobsId: z.string(),
});

// ============================================================================
// UTILITY SCHEMAS
// ============================================================================

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

// ============================================================================
// SCHEMA FACTORY PATTERN
// ============================================================================

const createSchemas = () => {
  // Base schemas without any circular references
  const base = {
    qualification: z.object({
      id: z.string(),
      conversationThreadId: z.string().nullish(),
      topic: topicZodSchema,
      description: z.string(),
      title: z.string(),
      paragraph: z.string().nullish(),
      question: z.string().nullish(),
      userId: z.string(),
      userConfirmed: z.boolean(),
    }),

    pastJob: z.object({
      endDate: z.string().nullish(),
      gsLevel: z.string().nullish(),
      hours: z.string().nullish(),
      id: z.string().nullish(),
      organization: z.string().min(1, "Organization is required"),
      organizationAddress: z.string().nullish(),
      responsibilities: z.string().nullish(),
      startDate: z.string().nullish(),
      supervisorMayContact: z.boolean().nullish(),
      supervisorName: z.string().nullish(),
      supervisorPhone: z.string().nullish(),
      title: z.string().min(1, "Title is required"),
      type: z.string(),
      userId: z.string(),
    }),

    job: baseJobZodSchema,

    application: z.object({
      awards: z.array(awardZodSchema).nullish(),
      completedSteps: z.array(z.string()),
      educations: z.array(educationZodSchema).nullish(),
      id: z.string(),
      jobId: z.string(),
      status: z.string(),
      userId: z.string(),
    }),
  };

  // API-safe versions (no circular references, safe for OpenAI)
  const api = {
    qualification: base.qualification,

    pastJob: base.pastJob.extend({
      qualifications: z.array(base.qualification).nullish(),
    }),

    job: base.job.extend({
      topics: z.array(topicZodSchema).nullish(),
    }),

    application: base.application.extend({
      job: base.job.extend({
        topics: z.array(topicZodSchema).nullish(),
      }),
      pastJobs: z
        .array(
          base.pastJob.extend({
            qualifications: z.array(base.qualification).nullish(),
          })
        )
        .nullish(),
      volunteers: z
        .array(
          base.pastJob.extend({
            qualifications: z.array(base.qualification).nullish(),
          })
        )
        .nullish(),
    }),
  };

  // Full versions with circular references (for internal use)
  const full: {
    qualification: z.ZodType<any>;
    pastJob: z.ZodType<any>;
    job: z.ZodType<any>;
    application: z.ZodType<any>;
  } = {
    qualification: z.lazy(() =>
      base.qualification.extend({
        applications: z.array(full.application),
      })
    ),

    pastJob: z.lazy(() =>
      base.pastJob.extend({
        qualifications: z.array(full.qualification).nullish(),
      })
    ),

    job: z.lazy(() =>
      base.job.extend({
        topics: z.array(topicZodSchema).nullish(),
      })
    ),

    application: z.lazy(() =>
      base.application.extend({
        job: full.job,
        pastJobs: z.array(full.pastJob).nullish(),
        volunteers: z.array(full.pastJob).nullish(),
      })
    ),
  };

  return { base, api, full };
};

// Create schema instances
const schemas = createSchemas();

// ============================================================================
// TYPES (inferred from schemas for consistency)
// ============================================================================

export type QualificationType = z.infer<typeof schemas.full.qualification>;
export type PastJobType = z.infer<typeof schemas.full.pastJob>;
export type ApplicationType = z.infer<typeof schemas.full.application>;
export interface PastJobApplicationItem {
  pastJobId: string;
  applicationId: string;
  pastJob: PastJobType;
  createdAt: string;
  updatedAt: string;
}

export interface PastJobApplicationsApiResponse {
  data: {
    listPastJobApplications: {
      items: PastJobApplicationItem[];
    };
  };
}
export type ResumeType = {
  path: string;
  lastModified: Date;
  eTag: string;
  id: string;
  userId?: string;
};

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
  department?: string;
  duties?: string;
  evaluationCriteria?: string;
  qualificationsSummary?: string;
  questionnaire?: string;
  requiredDocuments?: string;
  title: string;
  topics?: TopicType[];
  usaJobsId: string;
}

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
  JobCategories: Array<any>;
}
// ============================================================================
// EXPLICIT SIMPLE TYPES (for TypeScript components)
// ============================================================================

export type SimplePastJobType = {
  id: string | null | undefined;
  endDate: string | null | undefined;
  gsLevel: string | null | undefined;
  hours: string | null | undefined;
  organization: string;
  organizationAddress: string | null | undefined;
  qualifications: any[] | null | undefined; // Simplified for component use
  responsibilities: string | null | undefined;
  startDate: string | null | undefined;
  supervisorMayContact: boolean | null | undefined;
  supervisorName: string | null | undefined;
  supervisorPhone: string | null | undefined;
  title: string;
  type: string;
  userId: string;
};
// ============================================================================
// EXPORTED API-SAFE SCHEMAS (for OpenAI responses)
// ============================================================================

export const qualificationZodSchema = schemas.api.qualification;
export const pastJobZodSchema = schemas.api.pastJob;
export const jobZodSchema = schemas.api.job;
export const applicationZodSchema = schemas.api.application;

// Array versions for API responses
export const pastJobsArrayZodSchema = z.object({
  pastJobs: z.array(pastJobZodSchema),
});

// ============================================================================
// EXPORTED FULL SCHEMAS (with circular references, for internal use)
// ============================================================================

export const fullQualificationZodSchema = schemas.full.qualification;
export const fullPastJobZodSchema = schemas.full.pastJob;
export const fullJobZodSchema = schemas.full.job;
export const fullApplicationZodSchema = schemas.full.application;

// ============================================================================
// JSON SCHEMAS FOR RESPONSES API (Auto-converted and flattened)
// ============================================================================

// Helper function to flatten schemas and remove $ref
const flattenJsonSchema = (schema: any, schemaName: string) => {
  if (schema.$ref && schema.definitions && schema.definitions[schemaName]) {
    // Return the actual definition instead of the $ref
    return schema.definitions[schemaName];
  }
  return schema;
};

const keywordsRawSchema = zodToJsonSchema(Keywords, "keywords");
export const keywordsJsonSchema = flattenJsonSchema(
  keywordsRawSchema,
  "keywords"
);

const awardsArrayRawSchema = zodToJsonSchema(awardsArrayZodSchema, "awards");
export const awardsArrayJsonSchema = flattenJsonSchema(
  awardsArrayRawSchema,
  "awards"
);

const educationArrayRawSchema = zodToJsonSchema(
  educationArrayZodSchema,
  "education"
);
export const educationArrayJsonSchema = flattenJsonSchema(
  educationArrayRawSchema,
  "education"
);
const jobRawSchema = zodToJsonSchema(jobZodSchema, "job");
export const jobJsonSchema = flattenJsonSchema(jobRawSchema, "job");

const qualificationRawSchema = zodToJsonSchema(
  qualificationZodSchema,
  "qualification"
);
export const qualificationJsonSchema = flattenJsonSchema(
  qualificationRawSchema,
  "qualification"
);

const topicRawSchema = zodToJsonSchema(topicZodSchema, "topic");
export const topicJsonSchema = flattenJsonSchema(topicRawSchema, "topic");

const topicsArrayRawSchema = zodToJsonSchema(topicsArrayZodSchema, "topics");
export const topicsArrayJsonSchema = flattenJsonSchema(
  topicsArrayRawSchema,
  "topics"
);

const pastJobsArrayRawSchema = zodToJsonSchema(
  pastJobsArrayZodSchema,
  "pastJobs"
);
export const pastJobsArrayJsonSchema = flattenJsonSchema(
  pastJobsArrayRawSchema,
  "pastJobs"
);

export const responsesApiSchemas = {
  awards: awardsArrayJsonSchema,
  education: educationArrayJsonSchema,
  job: jobJsonSchema,
  keywords: keywordsJsonSchema,
  qualification: qualificationJsonSchema,
  qualifications: qualificationJsonSchema, // Assuming this maps to the same
  topics: topicsArrayJsonSchema,
  pastJobs: pastJobsArrayJsonSchema,
} as const;
