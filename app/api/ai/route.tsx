import OpenAI from "openai";
import { type NextRequest } from 'next/server';
import { zodResponseFormat } from 'openai/helpers/zod';
import { Keywords, Qualification, Qualifications, Topic, TopicsArraySchema } from "@/app/utils/responseSchemas";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Missing API key');
    return new Response('Missing API key', { status: 500 });
  }

  const   client = new OpenAI({ apiKey });
  const data = await req.json();

  const schemas = {
    keywords: Keywords,
    qualification: Topic,
    qualifications: Qualifications,
    topics: TopicsArraySchema,
  };

  type SchemaKey = keyof typeof schemas;
  const schemaName = data.name as SchemaKey;
  const selectedSchema = schemas[schemaName];

  if (!selectedSchema) {
    console.error(`Invalid schema name: ${data.name}`);
    return new Response(`Invalid schema name: ${data.name}`, { status: 400 });
  }

  console.log(selectedSchema)

  try {
    const completion = await client.beta.chat.completions.parse({
      messages: data.messages,
      model:'gpt-4o-mini',
      response_format: zodResponseFormat(selectedSchema, schemaName)
    })

    if (!completion) {
      console.error('No content in the completion response');
      return new Response('Invalid response from OpenAI', { status: 500 });
    }
    const message = completion.choices[0]?.message;
    console.log(message)
    if (message?.parsed) {
      return new Response(JSON.stringify(message.parsed), { status: 200 });
    } else {
     return new Response(JSON.stringify(message), { status: 200 });
    }
  } catch (error) {
    console.error('Error during OpenAI API call:', error);
    return new Response('Error during API call', { status: 500 });
  }
}

