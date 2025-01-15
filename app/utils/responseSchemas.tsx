import {z} from 'zod';

export const Keywords = z.object({
    keywords: z.array(z.string()),
  })

export const Qualification = z.object({
    id: z.string(), 
    name: z.string(),
    description: z.string(),
})

export const Recommendation = z.object({
    numberOfQualifiedKeyPhrases: z.number(),
    recommendation: z.enum(["Recommend", "Do not recommend"]), 
    justification: z.string()
})

export const Qualifications = z.object({
    recommendation: Recommendation.optional(),
    metQualifications: z.array(Qualification),
    unmetQualifications: z.array(Qualification),
})

export type QualificationType = z.infer<typeof Qualification>;
export type QualificationsType = z.infer<typeof Qualifications>;

export const Topic = z.object({
    id: z.string(),
    name: z.string(),
    keywords: z.array(z.string()),
    evidence: z.string().optional(),
    question: z.string().optional(),
})

export const TopicsArraySchema = z.object({
    topics: z.array(Topic)
})

export type TopicType = z.infer<typeof Topic>;

export type ResumeType = {
    path: string,
    lastModified: Date,
    eTag: string,
}