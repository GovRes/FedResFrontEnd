import { jobDescriptionReviewerPrompt } from "@/app/prompts/jobDescriptionReviewer";
import { sendMessages } from "@/app/utils/api";
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/index.mjs";

 export const jobDescriptionReviewer = async ({jobDescription, setKeywords, setLoading, setStep}: {jobDescription: string, setKeywords: Function, setLoading: Function, setStep: Function}) => {
    
      const userMessage: ChatCompletionUserMessageParam = {
        role: "user",
        content: jobDescription,
      };
      const messages: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] = [
        userMessage,
        jobDescriptionReviewerPrompt,
      ];
      setLoading(true)
      let res = await sendMessages({ messages, responseFormat: { type: "json_object" } });
      console.log(JSON.parse(res.message).keywords);
      setKeywords(JSON.parse(res.message).keywords);
      setLoading(false)
      setStep("career_coach")
    return;
  };