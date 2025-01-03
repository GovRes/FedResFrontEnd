import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
import { TopicSchema } from "../utils/responseSchemas";
const technicalRequirements = ` Please respond with a JSON object in this format: { "topics": [${JSON.stringify(TopicSchema)}] }. Use this precise format, including generating a legal UUID for each topic. You do not need to fill in the evidence attribute, just return an empty string for that.`
export const topicsCategorizerPrompt: ChatCompletionSystemMessageParam = {
    role: "system",
    content: `Given a job description and an AI-generated list of key phrases from that job description, organize the key phrases into topical groupings by type of skill. Give each topic a name and list of the key phrases in that topic\n${technicalRequirements}`
}   