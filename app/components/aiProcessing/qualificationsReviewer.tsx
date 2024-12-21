import { advancedQualificationsReviewerPrompt } from "@/app/prompts/advancedQualificationsReviewer";
import { qualificationsRecommenderPrompt } from "@/app/prompts/qualificationsRecommender";
import { qualificationsReviewerPrompt } from "@/app/prompts/qualificationsReviewer";
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/index.mjs";

export const qualificationsReviewer = async ({jobDescription, keywords, resume, sendMessages, setLoading, setQualifications, setRecommendation}: {jobDescription: string, keywords: Array<string>, resume: string, sendMessages: Function, setLoading: Function, setQualifications: Function, setRecommendation: Function}) => {
      setLoading(true)
      //first it sends it to the junior reviewer
      const userMessage: ChatCompletionUserMessageParam = {
        role: "user",
        content: `Job description: ${jobDescription}. Key phrases: ${Array.isArray(keywords) ? keywords.join(", ") : ""}. Resume: ${resume}`,
      };
      const messagesForQualificationsReviewer: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] = [
        userMessage,
        qualificationsReviewerPrompt,
      ];
      let qualificationsReviewerRes = await sendMessages({ messages: messagesForQualificationsReviewer, responseFormat: { type: "json_object" } });
      console.log(JSON.parse(qualificationsReviewerRes.message))
      //then it passes to the advanced reviewer
      const tempMetQualifications = JSON.parse(qualificationsReviewerRes.message).metQualifications;
      const tempUnmetQualifications = JSON.parse(qualificationsReviewerRes.message).unmetQualifications;
      const advancedUserMessage: ChatCompletionUserMessageParam = {
        role: "user",
        content: `Job description: ${jobDescription}. Key phrases: ${Array.isArray(keywords) ? keywords.join(", ") : ""}. Resume: ${resume}. Met qualifications: ${tempMetQualifications}. Unmet qualifications: ${tempUnmetQualifications}`,
      };
      const messageForAdvancedQualificationsReviewer: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] = [
        advancedUserMessage,
        advancedQualificationsReviewerPrompt,
      ]; 
      let advancedQualificationsReviewerRes = await sendMessages({ messages: messageForAdvancedQualificationsReviewer, responseFormat: { type: "json_object" } });
      const metQualifications = JSON.parse(advancedQualificationsReviewerRes.message).metQualifications;
      const unmetQualifications = JSON.parse(advancedQualificationsReviewerRes.message).unmetQualifications;
      const recommendation = JSON.parse(advancedQualificationsReviewerRes.message).recommendation.recommendation;
   
      setLoading(false)
      setQualifications({ metQualifications, unmetQualifications });
      setRecommendation(recommendation)
    }

    export const qualificationsRecommender = async({
        jobDescription, 
        keywords, 
        resume, 
        sendMessages, 
        setLoading, 
        setRecommendation}: {
            jobDescription: string, 
            keywords: Array<string>, 
            resume: string, 
            sendMessages: Function, 
            setLoading: Function, 
            setRecommendation: Function
        }) => {
            setLoading(true)
      //user edits might have an impact on recommendation, so let's ask one more time.
      const userMessage: ChatCompletionUserMessageParam = {
        role: "user",
        content: `Job description: ${jobDescription}. Key phrases: ${Array.isArray(keywords) ? keywords.join(", ") : ""}. Resume: ${resume}`,
      };
      const messagesForQualificationsReviewer: (ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam)[] = [
        userMessage,
        qualificationsRecommenderPrompt,
      ];
      let qualificationsReviewerRes = await sendMessages({ messages: messagesForQualificationsReviewer, responseFormat: { type: "json_object" } });
      console.log(JSON.parse(qualificationsReviewerRes.message))
      const recommendation = JSON.parse(qualificationsReviewerRes.message).recommendation.recommendation;
      setRecommendation(recommendation)
        }