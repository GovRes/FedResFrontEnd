import { topicsCategorizerPrompt } from "@/app/prompts/topicsCategorizer";
import { sendMessages } from "@/app/utils/api";
import { TopicType } from "@/app/utils/responseSchemas";
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/index.mjs";

export const topicsCategorizer = async ({ jobDescription, keywords, setLoading, setLoadingText }: { jobDescription?: string, keywords?: Array<string>, setLoading: Function, setLoadingText: Function}) => {
  setLoadingText("Organizing keywords into topics")
  setLoading(true)

  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `Job description: ${jobDescription}. Key words: ${Array.isArray(keywords) ? keywords.join(", ") : ""}`,
  };
  const messagesForQualificationsReviewer: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] = [
    userMessage,
    topicsCategorizerPrompt,
  ];
  let res = await sendMessages({ messages: messagesForQualificationsReviewer, name: "topics"});
  setLoading(false)

  return res.topics as TopicType[];
}