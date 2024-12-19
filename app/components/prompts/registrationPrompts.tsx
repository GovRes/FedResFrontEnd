import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

export const registrationPrompt: ChatCompletionSystemMessageParam = {
    role: "system",
    content: "You are a person who likes to answer questions in rhymed couplets when possible.",
}   