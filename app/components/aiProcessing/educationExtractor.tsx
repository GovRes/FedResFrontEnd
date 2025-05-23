import { educationExtractorPrompt } from "@/app/prompts/educationExtractorPrompt";
import { EducationType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const educationExtractor = async ({
  resumes,
}: {
  resumes: string[];
}) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `resumes: ${resumes}`,
  };
  const messagesForpastJobsExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, educationExtractorPrompt];
  try {
    let res = await sendMessages({
      messages: messagesForpastJobsExtractor,
      //has to match line 26 in api/ai/route.tsx
      name: "education",
    });
    return res.education as EducationType[];
  } catch (error) {
    console.error("Error extracting educations", error);
    throw error;
  } finally {
  }
};
