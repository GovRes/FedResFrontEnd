import { jobDescriptionReviewerPrompt } from "@/app/prompts/jobDescriptionReviewer";
import { sendMessages } from "@/app/utils/api";
import { Function } from "aws-cdk-lib/aws-cloudfront";
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/index.mjs";

export const jobDescriptionReviewer = async ({
  jobDescription,
  setLoading,
  setLoadingText,
}: {
  jobDescription: string;
  setLoading: (value: boolean) => void;
  setLoadingText: (text: string) => void;
}) => {
    
      const userMessage: ChatCompletionUserMessageParam = {
        role: "user",
        content: jobDescription,
      };
      const messages: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] = [
        userMessage,
        jobDescriptionReviewerPrompt,
      ];
      setLoading(true)
      setLoadingText("Extracting keywords from job description");
      let res = await sendMessages({ messages, responseFormat: { type: "json_object" } });
      setLoading(false)
      const result = res.keywords as Array<string>
      return result
  };