import { educationExtractorPrompt } from "@/app/prompts/educationExtractorPrompt";
import { EducationType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const educationExtractor = async ({
  resumes,
  setLoading,
  setLoadingText,
}: {
  resumes: string[];
  setLoading: Function;
  setLoadingText: Function;
}) => {
  setLoadingText("Extracting your educations from your resumes");
  setLoading(true);
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `resumes: ${resumes}`,
  };
  const messagesForUserJobsExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, educationExtractorPrompt];
  try {
    let res = await sendMessages({
      messages: messagesForUserJobsExtractor,
      //has to match line 26 in api/ai/route.tsx
      name: "education",
    });

    return res.educations as EducationType[];
  } catch (error) {
    console.error("Error extracting educations", error);
    throw error;
  } finally {
    setLoading(false);
  }
};
