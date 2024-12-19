import OpenAI from "openai";
import { type NextRequest } from 'next/server'

const openai = new OpenAI();

export async function POST(req: NextRequest) {
    const data = await req.json();
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: data.messages,
    });
    return Response.json({ message: completion.choices[0]?.message?.content });
}
