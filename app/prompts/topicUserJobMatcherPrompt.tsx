import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

export const topicUserJobMatcherPrompt: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `You will receive the user's past jobs, as well as a list of qualifications for a desired future job, organized by topic. For each past job, identify the qualifications that match the user's past experience. You will return an array of userJobs. Each userJob will have an array called userJobQualifications. Each userJobQualification will have the following attributes: id, topic, description, title, paragraph, and userConfirmed. The id should be a random string that is 10 characters long, consisting only of letters and numbers (no special characters and no white space). The topic should be one of the topics from the qualifications. The description should be the description attribute from that topic. The title should be the title attribute from that topic. The paragraph attribute should be empty. The userConfirmed field should be set to false by default.`,
};
