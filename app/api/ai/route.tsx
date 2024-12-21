import OpenAI from "openai";
import { type NextRequest } from 'next/server'
import { normalizeResponse } from "@/app/utils/normalizeResponse";



export async function POST(req: NextRequest) {
    const apiKey = process.env.OPENAI_API_KEY;
  
    if (!apiKey) {
      console.log('Missing API key');
      return new Response('Missing API key', { status: 500 });
    }
  
    const openai = new OpenAI({ apiKey });
    const data = await req.json();
  
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: data.messages,
        response_format: data.response_format,
      });
  
      // Safely access the content or provide a default value
      const content = completion?.choices?.[0]?.message?.content;
      if (!content) {
        console.error('No content in the completion response');
        return new Response('Invalid response from OpenAI', { status: 500 });
      }
  
      // Normalize the response
      const normal = normalizeResponse(content);
  
      return normal;
    } catch (error) {
      console.error('Error during OpenAI API call:', error);
      return new Response('Error during API call', { status: 500 });
    }
  }