import { jobDescriptionReviewerPrompt } from "@/app/prompts/jobDescriptionReviewer";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const jobDescriptionReviewer = async ({
  job,
  setLoading,
  setLoadingText,
}: {
  job: string;
  setLoading: (value: boolean) => void;
  setLoadingText: (text: string) => void;
}) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: job,
  };
  const messages: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, jobDescriptionReviewerPrompt];
  setLoading(true);
  setLoadingText("Extracting keywords from job description");
  let res = await sendMessages({ messages, name: "keywords" });
  setLoading(false);
  const result = res.keywords as Array<string>;
  console.log(result);
  return result;
};
