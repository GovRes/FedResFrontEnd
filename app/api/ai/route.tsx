import OpenAI from "openai";
import { type NextRequest } from 'next/server'



export async function POST(req: NextRequest) {
    const apiKey = process.env.OPENAI_API_KEY;
    const openai = new OpenAI({ apiKey });

  
    console.log(7, req.body)
    console.log(process.env.OPENAI_API_KEY)
    const data = await req.json();
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: data.messages,
    });
    if (!apiKey) {
        console.log('missing api key')
      }
    return Response.json({ message: completion.choices[0]?.message?.content });
}
