import type { APIGatewayProxyHandler } from "aws-lambda";
import OpenAI from "openai";

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("=== AMPLIFY FUNCTION START ===");
  const startTime = Date.now();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing API key" }),
    };
  }

  const client = new OpenAI({ apiKey });

  try {
    const data = JSON.parse(event.body || "{}");
    console.log(`Input length: ${data.input?.length || 0}`);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `${data.input}

Return valid JSON: {"pastJobs": [job_objects_with_qualifications]}`,
        },
      ],
      max_tokens: 2000,
      temperature: data.temperature || 0,
    });

    console.log(`Completed in ${Date.now() - startTime}ms`);

    const content = completion.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(content);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      };
    } catch (parseError) {
      console.log("Parse failed, trying extraction...");
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(extracted),
          };
        } catch (extractError) {
          // Fall through to empty response
        }
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastJobs: [] }),
      };
    }
  } catch (error: any) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Function failed",
        message: error.message,
        pastJobs: [],
      }),
    };
  }
};
