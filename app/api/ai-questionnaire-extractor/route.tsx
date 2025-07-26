import OpenAI from "openai";
import { type NextRequest } from "next/server";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { questionnaireLinkFinderPrompt } from "@/app/prompts/questionnaireLinkFinderPrompt";

// Zod schema for questionnaire URL response
const questionnaireUrlSchema = z.object({
  questionnaireUrl: z.string().nullable(),
  found: z.boolean(),
  reasoning: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("Missing API key");
    return new Response("Missing API key", { status: 500 });
  }

  const client = new OpenAI({ apiKey });
  const data = await req.json();
  const { jobId } = data;

  if (!jobId) {
    return new Response("Missing jobId", { status: 400 });
  }

  try {
    // Fetch HTML content server-side to avoid CORS
    console.log(`Fetching job page for ${jobId}...`);
    const htmlContent = await fetchJobPageHTML(jobId);

    if (!htmlContent) {
      return new Response(
        JSON.stringify({
          found: false,
          questionnaireUrl: null,
          reasoning: "Could not fetch job page HTML",
          jobId,
        }),
        { status: 200 }
      );
    }

    const content = `Analyze this USAJobs page HTML to find the questionnaire URL for job ${jobId}:

${htmlContent.substring(0, 45000)}`; // Truncate to avoid token limits

    const completion = await client.beta.chat.completions.parse({
      messages: [
        questionnaireLinkFinderPrompt,
        {
          role: "user",
          content: content,
        },
      ],
      model: "gpt-4o",
      response_format: zodResponseFormat(
        questionnaireUrlSchema,
        "questionnaireUrl"
      ),
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const message = completion.choices[0]?.message;

    if (message?.parsed) {
      const result = message.parsed;

      // Validate the extracted URL format
      if (result.found && result.questionnaireUrl) {
        const isValidUrl =
          /https:\/\/apply\.usastaffing\.gov\/ViewQuestionnaire\/\d+/.test(
            result.questionnaireUrl
          );

        if (!isValidUrl) {
          console.warn(
            `Invalid questionnaire URL format for job ${jobId}: ${result.questionnaireUrl}`
          );
          return new Response(
            JSON.stringify({
              found: false,
              questionnaireUrl: null,
              reasoning: "Found URL but format doesn't match expected pattern",
              jobId,
            }),
            { status: 200 }
          );
        }
      }

      return new Response(
        JSON.stringify({
          ...result,
          jobId,
        }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({
          found: false,
          questionnaireUrl: null,
          reasoning: "No valid response from AI",
          jobId,
        }),
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Error during questionnaire extraction:", error);
    return new Response(
      JSON.stringify({
        error: "Error during questionnaire extraction",
        message: error.message || "Unknown error",
        details: error.toString(),
        jobId,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Helper function to fetch job page HTML server-side
export async function fetchJobPageHTML(jobId: string): Promise<string | null> {
  try {
    console.log(`Fetching HTML for job ${jobId}...`);

    const response = await fetch(`https://www.usajobs.gov/job/${jobId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch job page ${jobId}: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const html = await response.text();
    console.log(
      `Successfully fetched ${html.length} characters for job ${jobId}`
    );
    return html;
  } catch (error) {
    console.error(`Error fetching job page ${jobId}:`, error);
    return null;
  }
}
