import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';
export const keywordsSchema = zodToJsonSchema(z.object({
    keywords: z.array(z.string()),
  }));

export const Qualification = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
})

export const Recommendation = z.object({
    numberOfQualifiedKeyPhrases: z.number(),
    recommendation: z.enum(["Recommend", "Do not recommend"]), 
    justification: z.string()
})


export const QualificationsSchema = z.object({
    recommendation: Recommendation.optional(),
    metQualifications: z.array(Qualification),
    unmetQualifications: z.array(Qualification),
})

export const qualificationsSchema = zodToJsonSchema(QualificationsSchema);


export type QualificationType = z.infer<typeof Qualification>;
export type QualificationsType = z.infer<typeof QualificationsSchema>;

