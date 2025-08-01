import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { url } = data;
  console.log("Received URL:", url);
  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  //extract the jobId from the URL
  const jobId = url.match(/\/job\/(\d+)/);
  console.log("Extracted jobId:", jobId);
  try {
    // Fetch HTML content server-side to avoid CORS
    const htmlContent = await fetchPageHTML(url);

    if (!htmlContent) {
      return new Response("Failed to fetch job page HTML", { status: 500 });
    }

    // Extract questionnaire link from HTML
    const questionnaireLink = extractQuestionnaireLink(htmlContent);
    if (!questionnaireLink) {
      console.error("No questionnaire link found in the job page HTML");
      const response = {
        questionnaireLink: false,
        jobId: jobId ? jobId[1] : null,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      const questionnaireContent =
        await scrapeQuestionnaireWithBrowserless(questionnaireLink);

      const response = {
        questionnaireLink: questionnaireLink,
        jobId: jobId ? jobId[1] : null,
        content: questionnaireContent,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error(`Error fetching job page ${jobId}:`, error);
    return new Response("Internal server error", { status: 500 });
  }
}

async function scrapeQuestionnaireWithBrowserless(
  url: string
): Promise<string | null> {
  try {
    const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
    console.log("BROWSERLESS_TOKEN exists:", !!BROWSERLESS_TOKEN);
    console.log(
      "All env vars:",
      Object.keys(process.env).filter((key) => key.includes("BROWSERLESS"))
    );
    if (!BROWSERLESS_TOKEN) {
      console.error(
        "BROWSERLESS_TOKEN not found. Available env vars:",
        Object.keys(process.env)
      );
      throw new Error("BROWSERLESS_TOKEN environment variable is not set");
    }

    console.log(`Scraping questionnaire content from: ${url}`);

    // Simplified request body that matches Browserless API requirements
    const response = await fetch(
      `https://production-sfo.browserless.io/content?token=${BROWSERLESS_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          waitForTimeout: 10000, // Wait 10 seconds for content to load
          // Remove the problematic options and use simpler approach
          rejectResourceTypes: ["image", "stylesheet", "font"],
        }),
      }
    );

    console.log("Browserless response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Browserless error response:", errorText);
      throw new Error(
        `Browserless request failed: ${response.status} - ${errorText}`
      );
    }

    const content = await response.text();
    console.log(`Raw content length: ${content.length}`);

    if (!content || content.length < 100) {
      console.warn("Received very little content, might be a loading issue");
      return null;
    }

    const cleanedContent = cleanTextForAI(content);
    console.log(
      `Successfully scraped ${cleanedContent.length} characters from questionnaire`
    );

    return cleanedContent;
  } catch (error) {
    console.error("Failed to scrape questionnaire with Browserless:", error);
    return null;
  }
}
// Helper function to clean text for AI analysis
function cleanTextForAI(text: string): string {
  return (
    text
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      // Remove common web elements that aren't useful
      .replace(
        /\b(Home|Login|Register|Privacy Policy|Terms of Service|Cookie Policy)\b/gi,
        ""
      )
      // Clean up common patterns
      .replace(/\*\s+/g, "• ") // Convert asterisks to bullet points
      .replace(/^\s*[\d]+\.\s*/gm, "") // Remove numbered list markers at start of lines
      // Remove navigation breadcrumbs
      .replace(/Home\s*>\s*[^>]*>\s*/gi, "")
      // Trim and remove extra line breaks
      .trim()
      .replace(/\n\s*\n\s*\n/g, "\n\n")
  ); // Collapse multiple line breaks
}

// Helper function to extract questionnaire link from HTML
function extractQuestionnaireLink(html: string): string | null {
  // Common patterns for questionnaire links
  const patterns = [
    // Direct USAStaffing links
    /https?:\/\/apply\.usastaffing\.gov\/ViewQuestionnaire\/\d+/gi,
    /https?:\/\/apply\.usastaffing\.gov\/Application\/[^"'\s]+/gi,

    // ApplicationManager links (alternative federal application system)
    /https?:\/\/[^"'\s]*applicationmanager\.gov[^"'\s]*/gi,

    // Generic patterns for questionnaire/assessment links
    /href=["']([^"']*(?:questionnaire|assessment)[^"']*)["']/gi,
    /href=["']([^"']*ViewQuestionnaire[^"']*)["']/gi,

    // Links containing "apply" and job/position numbers
    /href=["']([^"']*apply[^"']*\/(?:Application|ViewQuestionnaire)\/\d+[^"']*)["']/gi,
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      // Clean up the match - remove href= and quotes if present
      let link = matches[0];

      // If it's an href attribute, extract just the URL
      const hrefMatch = link.match(/href=["']([^"']+)["']/);
      if (hrefMatch) {
        link = hrefMatch[1];
      }

      // Ensure it's a complete URL
      if (link.startsWith("http")) {
        console.log(`Found questionnaire link: ${link}`);
        return link;
      }
    }
  }

  // Additional search for text content that might contain questionnaire links
  const textPatterns = [
    /(?:questionnaire|assessment)\s+(?:link|url):\s*(https?:\/\/[^\s]+)/gi,
    /(?:complete|view)\s+(?:the\s+)?(?:questionnaire|assessment).*?(https?:\/\/[^\s]+)/gi,
  ];

  for (const pattern of textPatterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      console.log(`Found questionnaire link in text: ${match[1]}`);
      return match[1];
    }
  }

  // Search for common button/link text patterns
  const buttonPatterns = [
    /<[^>]*(?:button|link|a)[^>]*[^>]*>.*?(?:apply|questionnaire|assessment).*?<\/[^>]*>/gi,
    /"Apply"[^>]*href=["']([^"']+)["']/gi,
    /"Start.*?Application"[^>]*href=["']([^"']+)["']/gi,
  ];

  for (const pattern of buttonPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const match of matches) {
        const urlMatch = match.match(/href=["']([^"']+)["']/);
        if (urlMatch && urlMatch[1].includes("apply")) {
          console.log(
            `Found potential questionnaire link in button: ${urlMatch[1]}`
          );
          return urlMatch[1];
        }
      }
    }
  }

  console.log("No questionnaire link found");
  return null;
}

// Helper function to fetch job page HTML server-side
async function fetchPageHTML(url: string): Promise<string | null> {
  try {
    console.log(`240, Fetching HTML for ${url}`);

    const response = await fetch(`${url}`, {
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
        `Failed to fetch page ${url} ${response.status} ${response.statusText}`
      );
      return null;
    }

    const html = await response.text();
    console.log(`Successfully fetched ${html.length} characters for page`);
    return html;
  } catch (error) {
    console.error(`Error fetching page:`, error);
    return null;
  }
}
