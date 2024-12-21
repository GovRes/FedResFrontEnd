import { qualificationEditorPrompt } from "@/app/prompts/qualificationDescriptionEditor";
import { QualificationType } from "@/app/utils/responseSchemas";
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/index.mjs";

export const qualificationDescriptionEditor = async ({
  jobDescription, 
  keywords, 
  resume, 
  sendMessages, 
  setLoading, 
  qualification,
  userFeedback
}: {
  jobDescription: string, 
  keywords: Array<string>, 
  resume: string, 
  sendMessages: Function, 
  setLoading: Function, 
  qualification: QualificationType,
  userFeedback: string,

}) => {
      setLoading(true)
      const userMessage: ChatCompletionUserMessageParam = {
        role: "user",
        content: `Job description: ${jobDescription}. Key phrases: ${Array.isArray(keywords) ? keywords.join(", ") : ""}. Resume: ${resume}. Qualification: ${qualification}. User feedback: ${userFeedback}`,
      };
      const messages: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] = [
        userMessage,
        qualificationEditorPrompt,
      ];
      let res = await sendMessages({ messages, responseFormat: { type: "json_object" } });
      setLoading(false)
      return res;
    }