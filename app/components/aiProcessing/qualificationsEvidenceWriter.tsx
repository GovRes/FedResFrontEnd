import { qualificationsEvidenceWriterPrompt } from "@/app/prompts/qualificationsEvidenceWriter";
import { qualificationsEvidenceQuestionResponderPrompt } from "@/app/prompts/qualificationsEvidenceQuestionResponderPrompt";
import { qualificationsEvidenceFeedbackResponderPrompt } from "@/app/prompts/qualificationsEvidenceFeedbackResponderPrompt";
import { sendMessages } from "@/app/utils/api";
import { QualificationsType, TopicType } from "@/app/utils/responseSchemas";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";
import { JobType } from "@/app/providers";

export const qualificationsEvidenceWriter = async ({
  currentTopic,
  job,
  qualifications,
  resumes,
  setLoading,
  setLoadingText,
}: {
  currentTopic: TopicType;
  job: string;
  qualifications: QualificationsType;
  resumes: string[];
  setLoading: Function;
  setLoadingText: Function;
}) => {
  try {
    setLoading(true);
    setLoadingText("Writing qualifications evidence");

    const userMessage: ChatCompletionUserMessageParam = {
      role: "user",
      content: `Job description: ${job}. Resume: ${resumes}, qualifications: ${qualifications}, Current qualification topic: ${JSON.stringify(
        currentTopic
      )}`,
    };

    const messagesForQualificationsReviewer: (
      | ChatCompletionUserMessageParam
      | ChatCompletionSystemMessageParam
    )[] = [userMessage, qualificationsEvidenceWriterPrompt];

    let res = await sendMessages({
      messages: messagesForQualificationsReviewer,
      name: "qualification",
    });
    if (!res.evidence && !res.question) {
      res = await sendMessages({
        messages: messagesForQualificationsReviewer,
        name: "qualification",
      });
    }
    return res as TopicType;
  } catch (error) {
    console.error("API Call Error:", error);
    throw error; // Handle errors gracefully
  } finally {
    setLoading(false);
  }
};

export const qualificationsEvidenceQuestionResponder = async ({
  currentTopic,
  job,
  resumes,
  setLoading,
  setLoadingText,
  userResponse,
}: {
  currentTopic: TopicType;
  job: JobType;
  resumes: string[];
  setLoading: Function;
  setLoadingText: Function;
  userResponse: string;
}) => {
  try {
    setLoading(true);
    setLoadingText("Processing your response and writing new evidence");

    const userMessage: ChatCompletionUserMessageParam = {
      role: "user",
      content: `Job description: ${job}. Resume: ${resumes}, Current qualification topic: ${JSON.stringify(
        currentTopic
      )}. Your question: ${
        currentTopic.question
      } User response to your question: ${userResponse}`,
    };

    const messagesForQualificationsReviewer: (
      | ChatCompletionUserMessageParam
      | ChatCompletionSystemMessageParam
    )[] = [userMessage, qualificationsEvidenceQuestionResponderPrompt];

    const res = await sendMessages({
      messages: messagesForQualificationsReviewer,
      name: "qualification",
    });
    return res as TopicType;
  } catch (error) {
    console.error("API Call Error:", error);
    throw error; // Handle errors gracefully
  } finally {
    setLoading(false);
  }
};

export const qualificationsEvidenceFeedbackResponder = async ({
  currentTopic,
  job,
  resumes,
  setLoading,
  setLoadingText,
  userResponse,
}: {
  currentTopic: TopicType;
  job: JobType;
  resumes: string[];
  setLoading: Function;
  setLoadingText: Function;
  userResponse: string;
}) => {
  try {
    setLoading(true);
    setLoadingText("Processing your response and writing new evidence");

    const userMessage: ChatCompletionUserMessageParam = {
      role: "user",
      content: `Job description: ${job}. Resume: ${resumes}, Current qualification topic: ${JSON.stringify(
        currentTopic
      )}. Your original evidence: ${
        currentTopic.evidence
      } User feedback on your evidence: ${userResponse}`,
    };

    const messagesForQualificationsReviewer: (
      | ChatCompletionUserMessageParam
      | ChatCompletionSystemMessageParam
    )[] = [userMessage, qualificationsEvidenceFeedbackResponderPrompt];

    const res = await sendMessages({
      messages: messagesForQualificationsReviewer,
      name: "qualification",
    });
    return res as TopicType;
  } catch (error) {
    console.error("API Call Error:", error);
    throw error; // Handle errors gracefully
  } finally {
    setLoading(false);
  }
};
