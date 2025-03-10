import { advancedQualificationsReviewerPrompt } from "@/app/prompts/advancedQualificationsReviewer";
import { qualificationsRecommenderPrompt } from "@/app/prompts/qualificationsRecommender";
import { qualificationsReviewerPrompt } from "@/app/prompts/qualificationsReviewer";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";
import { QualificationsType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import { JobType } from "@/app/providers";
import { formatJobDescriptionForAI } from "@/app/utils/aiInteractionUtils";
export const qualificationsReviewer = async ({
  job,
  keywords,
  resumes,
  setLoading,
  setLoadingText,
}: {
  job: JobType;
  keywords: string[];
  resumes: string[];
  setLoading: Function;
  setLoadingText: Function;
}) => {
  setLoadingText("Reviewing your qualifications");
  setLoading(true);
  //first it sends it to the junior reviewer
  const jobDescription = formatJobDescriptionForAI({ job });
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `Job description: ${jobDescription}. Key phrases: ${
      Array.isArray(keywords) ? keywords.join(", ") : ""
    }. Resumes: ${Array.isArray(resumes) ? resumes.join(", ") : ""}`,
  };
  const messagesForQualificationsReviewer: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, qualificationsReviewerPrompt];
  let qualificationsReviewerRes = await sendMessages({
    messages: messagesForQualificationsReviewer,
    name: "qualifications",
  });
  //then it passes to the advanced reviewer
  const tempMetQualifications = qualificationsReviewerRes.metQualifications;
  const tempUnmetQualifications = qualificationsReviewerRes.unmetQualifications;
  const advancedUserMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `Job description: ${jobDescription}. Key phrases: ${
      Array.isArray(keywords) ? keywords.join(", ") : ""
    }.Resumes: ${
      Array.isArray(resumes) ? resumes.join(", ") : ""
    }. Met qualifications: ${tempMetQualifications}. Unmet qualifications: ${tempUnmetQualifications}`,
  };
  const messageForAdvancedQualificationsReviewer: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [advancedUserMessage, advancedQualificationsReviewerPrompt];
  let advancedQualificationsReviewerRes = await sendMessages({
    messages: messageForAdvancedQualificationsReviewer,
    name: "qualifications",
  });
  setLoading(false);
  const result = advancedQualificationsReviewerRes as QualificationsType;
  return result;
};

export const qualificationsRecommender = async ({
  job,
  keywords,
  resumes,
  setLoading,
  setLoadingText,
}: {
  job: JobType;
  keywords: Array<string>;
  resumes: string[];
  setLoading: Function;
  setLoadingText: Function;
}) => {
  setLoading(true);
  setLoadingText("Reviewing your qualifications one more time");
  //user edits might have an impact on recommendation, so let's ask one more time.
  const jobDescription = formatJobDescriptionForAI({ job });
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `Job description: ${jobDescription}. Key phrases: ${
      Array.isArray(keywords) ? keywords.join(", ") : ""
    }. Resume: ${Array.isArray(resumes) ? resumes.join(", ") : ""}`,
  };
  const messagesForQualificationsReviewer: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, qualificationsRecommenderPrompt];
  let qualificationsReviewerRes = await sendMessages({
    messages: messagesForQualificationsReviewer,
    name: "qualifications",
  });
  setLoading(false);
  return qualificationsReviewerRes as QualificationsType;
};
