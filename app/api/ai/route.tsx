import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from 'next'
import { ChatCompletionRole, ChatCompletionMessage } from "openai/resources/index.mjs";

const openai = new OpenAI();
const runtime = "nodejs";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
    const data = await req.json();
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: data.messages,
    });
    return Response.json({ message: completion.choices[0]?.message?.content });
}