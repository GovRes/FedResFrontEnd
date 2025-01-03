import { qualificationsEvidenceWriterPrompt } from "@/app/prompts/qualificationsEvidenceWriter";
import { sendMessages } from "@/app/utils/api";
import { TopicsType, TopicType } from "@/app/utils/responseSchemas";
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/index.mjs";

export const qualificationsEvidenceWriter = async ({
  currentTopic,
  jobDescription,
  resume,
  setLoading,
  setLoadingText,
}: {
  currentTopic: TopicType;
  jobDescription: string;
  resume: string;
  setLoading: Function;
  setLoadingText: Function;
}) => {
  try {
    setLoading(true);
    setLoadingText("Writing qualifications evidence");
    console.log("Current Topic:", currentTopic);

    const userMessage: ChatCompletionUserMessageParam = {
      role: "user",
      content: `Job description: ${jobDescription}. Resume: ${resume}, Current qualification topic: ${JSON.stringify(currentTopic)}`,
    };

    const messagesForQualificationsReviewer: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] = [
      userMessage,
      qualificationsEvidenceWriterPrompt,
    ];

    const res = await sendMessages({ messages: messagesForQualificationsReviewer, responseFormat: { type: "json_object" } });
    return res.topic as TopicType;
  } catch (error) {
    console.error("API Call Error:", error);
    throw error; // Handle errors gracefully
  } finally {
    setLoading(false);
  }
};
