import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
const technicalRequirements = "Additionally, for each topic, generate a random string that is 10 characters long, consisting only of letters and numbers (no special characters). Assign this string to the \"id\" attribute on the topic object."

export const topicsCategorizerPrompt: ChatCompletionSystemMessageParam = {
    role: "system",
    content: `Given a job description and an AI-generated list of key phrases from that job description, organize the key phrases into topical groupings by type of skill. Give each topic a name and list of the key phrases in that topic\nYou do not need to fill in the evidence attribute, just return an empty string for that.${technicalRequirements}`
}   