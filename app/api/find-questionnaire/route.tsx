import { type NextRequest } from "next/server";

// TypeScript interfaces for the question extractor
interface Response {
  identifier: string | null;
  text: string;
  type: "radio" | "checkbox" | "dropdown" | "text";
}

interface Question {
  number: string | null;
  text: string; // exact question text without instructions
  responses: Response[];
  responseCount: number;
}

interface Section {
  name: string;
  questions: Question[];
}

interface ExtractedData {
  sections: Section[];
  totalQuestions: number;
}

// Question extraction function - filters out demographic questions but keeps exact text
function extractQuestionsAndResponses(htmlContent: string): ExtractedData {
  // Use JSDOM for server-side HTML parsing
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  // Find all question containers
  const questionContainers: NodeListOf<Element> = document.querySelectorAll(
    "div.col-md-10.col-md-offset-1.row.push-down-25"
  );

  const extractedData: ExtractedData = {
    sections: [],
    totalQuestions: 0,
  };

  for (const container of questionContainers) {
    // Extract question text
    const questionElement = container.querySelector(
      'span[data-bind*="textDecode: QuestionText"]'
    );
    if (!questionElement) continue;

    const fullQuestionText = questionElement.textContent?.trim() || "";

    // Skip empty questions
    if (!fullQuestionText || fullQuestionText.length < 10) continue;

    // Filter out demographic questions
    if (isDemographicQuestion(fullQuestionText)) continue;

    // Extract question number
    const questionNumElement = container.querySelector(
      'span[data-bind*="text: QuestionDisplayIdentifier"]'
    );
    const questionNumber = questionNumElement?.textContent?.trim() || null;

    // Clean question text - remove instructions but keep the exact question
    const cleanedQuestionText = cleanQuestionText(fullQuestionText);

    // Extract responses
    const responses: Response[] = [];

    // Radio button and checkbox responses
    const labels = container.querySelectorAll("label");
    for (const label of Array.from(labels)) {
      const input = label.querySelector(
        'input[type="radio"], input[type="checkbox"]'
      ) as HTMLInputElement;
      if (input) {
        // Get the response identifier (A, B, C, etc.)
        const identifierSpan = label.querySelector(
          'span[data-bind*="text: ResponseDisplayIdentifier"]'
        );
        const identifier = identifierSpan?.textContent?.trim() || null;

        // Get the response text (keep exact text)
        const responseSpan = label.querySelector("span.response-Text");
        if (responseSpan) {
          const responseText = responseSpan.textContent?.trim() || "";
          if (responseText) {
            responses.push({
              identifier,
              text: responseText,
              type: (input.type as "radio" | "checkbox") || "radio",
            });
          }
        }
      }
    }

    // Handle dropdown responses
    const selectElement = container.querySelector(
      "select"
    ) as HTMLSelectElement;
    if (selectElement) {
      const options = selectElement.querySelectorAll("option");
      for (const option of Array.from(options)) {
        const optionText = option.textContent?.trim() || "";
        if (optionText && optionText !== "--Select--") {
          responses.push({
            identifier: option.getAttribute("value") || "",
            text: optionText,
            type: "dropdown",
          });
        }
      }
    }

    // Handle text input
    const textInput = container.querySelector('input[type="text"]');
    if (textInput && responses.length === 0) {
      responses.push({
        identifier: null,
        text: "[Text Input Field]",
        type: "text",
      });
    }

    // Create question object if it has responses and isn't demographic
    if (responses.length > 0) {
      const question: Question = {
        number: questionNumber,
        text: cleanedQuestionText,
        responses,
        responseCount: responses.length,
      };

      // Categorize by section (only for non-demographic questions)
      const sectionName = categorizeNonDemographicQuestion(cleanedQuestionText);

      // Find or create section
      let section = extractedData.sections.find((s) => s.name === sectionName);
      if (!section) {
        section = { name: sectionName, questions: [] };
        extractedData.sections.push(section);
      }

      section.questions.push(question);
      extractedData.totalQuestions++;
    }
  }

  return extractedData;
}

// Check if question is demographic/eligibility related
function isDemographicQuestion(questionText: string): boolean {
  const text = questionText.toLowerCase();

  const demographicKeywords = [
    "veteran",
    "military",
    "armed forces",
    "disability",
    "spouse",
    "federal employee",
    "government employee",
    "sf-50",
    "dd-214",
    "reinstatement",
    "ctap",
    "ictap",
    "schedule a",
    "land management",
    "interchange agreement",
    "opm",
    "reasonable accommodation",
    "grade you are willing to accept",
    "lowest grade",
    "drug screening",
    "political appointee",
    "schedule c",
    "recruiter id",
    "background investigation",
  ];

  return demographicKeywords.some((keyword) => text.includes(keyword));
}

// Clean question text - remove instructions but keep exact question
function cleanQuestionText(fullText: string): string {
  // Split by common instruction markers
  const instructionMarkers = [
    "To verify eligibility",
    "To verify your eligibility",
    "For more information",
    "NOTE:",
    "Note:",
    "Please note:",
    "You must submit",
    "You can find out",
    "Such documentation must be",
  ];

  let cleanText = fullText;

  // Remove instruction sections
  for (const marker of instructionMarkers) {
    const markerIndex = cleanText.indexOf(marker);
    if (markerIndex !== -1) {
      cleanText = cleanText.substring(0, markerIndex).trim();
    }
  }

  // Clean up HTML tags and excessive whitespace
  cleanText = cleanText
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanText;
}

// Categorize non-demographic questions
function categorizeNonDemographicQuestion(questionText: string): string {
  const text = questionText.toLowerCase();

  if (
    text.includes("budget") ||
    text.includes("financial") ||
    text.includes("funding")
  ) {
    return "Budget Analysis Experience";
  }
  if (
    text.includes("communication") ||
    text.includes("verbal") ||
    text.includes("oral")
  ) {
    return "Communication Skills";
  }
  if (
    text.includes("experience") &&
    (text.includes("perform") || text.includes("task"))
  ) {
    return "Job-Related Experience";
  }
  if (
    text.includes("training") ||
    text.includes("education") ||
    text.includes("knowledge")
  ) {
    return "Qualifications & Training";
  }
  if (
    text.includes("verify") ||
    text.includes("accurate") ||
    text.includes("documentation")
  ) {
    return "Assessment Verification";
  }

  return "General Job Requirements";
}

function categorizeQuestion(questionText: string): string {
  // This function is no longer used - replaced by categorizeNonDemographicQuestion
  return "General";
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { url } = data;
  console.log("Received URL:", url);

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    console.error("Invalid URL format:", url);
    return new Response("Invalid URL format", { status: 400 });
  }

  //extract the jobId from the URL
  const jobId = url.match(/\/job\/(\d+)/);
  console.log("Extracted jobId:", jobId);

  try {
    // Fetch HTML content server-side to avoid CORS
    const htmlContent = await fetchPageHTML(url);

    if (!htmlContent) {
      console.error("Failed to fetch job page HTML");
      const response = {
        questionnaireLink: false,
        jobId: jobId ? jobId[1] : null,
        error:
          "Failed to fetch job page - the page may be unavailable or blocked",
      };
      return new Response(JSON.stringify(response), {
        status: 200, // Return 200 but with error info
        headers: {
          "Content-Type": "application/json",
        },
      });
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

      // Extract questions and responses from the questionnaire content
      let extractedQuestions: ExtractedData | null = null;
      if (questionnaireContent) {
        try {
          extractedQuestions =
            extractQuestionsAndResponses(questionnaireContent);
          console.log(
            `Extracted ${extractedQuestions.totalQuestions} questions from questionnaire`
          );
        } catch (extractionError) {
          console.error(
            "Error extracting questions from questionnaire:",
            extractionError
          );
        }
      }

      const response = {
        questionnaireLink: questionnaireLink,
        jobId: jobId ? jobId[1] : null,
        content: extractedQuestions,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error(`Error processing job page ${jobId}:`, error);
    const response = {
      questionnaireLink: false,
      jobId: jobId ? jobId[1] : null,
      error: "Internal server error - unable to process the job page",
    };
    return new Response(JSON.stringify(response), {
      status: 200, // Return 200 but with error info for client handling
      headers: {
        "Content-Type": "application/json",
      },
    });
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
        // Add timeout for Browserless requests too
        signal: AbortSignal.timeout(30000), // 30 second timeout
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
      .replace(/\*\s+/g, "â€¢ ") // Convert asterisks to bullet points
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

    // Monster Government Jobs questionnaire links
    /https?:\/\/jobs\.monstergovt\.com\/[^"'\s]*previewVacancyQuestions[^"'\s]*/gi,
    /https?:\/\/jobs\.monstergovt\.com\/[^"'\s]*\/vacancy\/[^"'\s]*[Qq]uestion[^"'\s]*/gi,

    // Other job portal questionnaire patterns
    /https?:\/\/[^"'\s]*\.gov[^"'\s]*previewVacancyQuestions[^"'\s]*/gi,
    /https?:\/\/[^"'\s]*\.gov[^"'\s]*vacancy[^"'\s]*[Qq]uestion[^"'\s]*/gi,

    // Generic patterns for questionnaire/assessment links
    /href=["']([^"']*(?:questionnaire|assessment)[^"']*)["']/gi,
    /href=["']([^"']*ViewQuestionnaire[^"']*)["']/gi,
    /href=["']([^"']*previewVacancyQuestions[^"']*)["']/gi,

    // Links containing "apply" and job/position numbers
    /href=["']([^"']*apply[^"']*\/(?:Application|ViewQuestionnaire)\/\d+[^"']*)["']/gi,

    // Generic job portal patterns with orgId and jnum parameters
    /https?:\/\/[^"'\s]*\.(?:gov|com)[^"'\s]*\/[^"'\s]*vacancy[^"'\s]*orgId=\d+[^"'\s]*/gi,
    /https?:\/\/[^"'\s]*\.(?:gov|com)[^"'\s]*jnum=\d+[^"'\s]*/gi,
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
    /(?:preview|view)\s+(?:vacancy\s+)?questions.*?(https?:\/\/[^\s]+)/gi,
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
    /<[^>]*(?:button|link|a)[^>]*[^>]*>.*?(?:apply|questionnaire|assessment|preview.*questions).*?<\/[^>]*>/gi,
    /"Apply"[^>]*href=["']([^"']+)["']/gi,
    /"Start.*?Application"[^>]*href=["']([^"']+)["']/gi,
    /"Preview.*?Questions?"[^>]*href=["']([^"']+)["']/gi,
    /"View.*?Questions?"[^>]*href=["']([^"']+)["']/gi,
  ];

  for (const pattern of buttonPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const match of matches) {
        const urlMatch = match.match(/href=["']([^"']+)["']/);
        if (
          urlMatch &&
          (urlMatch[1].includes("apply") ||
            urlMatch[1].includes("question") ||
            urlMatch[1].includes("questionnaire") ||
            urlMatch[1].includes("previewVacancyQuestions"))
        ) {
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

// Helper function to fetch job page HTML server-side with retry logic
async function fetchPageHTML(url: string): Promise<string | null> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: Fetching HTML for ${url}`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
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
          // Add cache control to avoid stale responses
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      // Clear the timeout since request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `Attempt ${attempt}: Failed to fetch page ${url} - ${response.status} ${response.statusText}`
        );

        // Don't retry for client errors (4xx), but retry for server errors (5xx)
        if (response.status >= 400 && response.status < 500) {
          console.error("Client error - not retrying");
          return null;
        }

        // Retry for server errors
        if (attempt === maxRetries) {
          return null;
        }
        continue;
      }

      const html = await response.text();
      console.log(
        `Successfully fetched ${html.length} characters for page on attempt ${attempt}`
      );
      return html;
    } catch (error: any) {
      console.error(`Attempt ${attempt}: Error fetching page:`, {
        message: error.message,
        code: error.code,
        cause: error.cause?.code || "unknown",
      });

      // Handle specific error types
      if (error.name === "AbortError") {
        console.error(`Attempt ${attempt}: Request timed out`);
      } else if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
        console.error(`Attempt ${attempt}: Network timeout/connection reset`);
      } else if (error.code === "ENOTFOUND") {
        console.error(
          `Attempt ${attempt}: DNS lookup failed - domain not found`
        );
        return null; // Don't retry DNS failures
      } else if (error.code === "ECONNREFUSED") {
        console.error(`Attempt ${attempt}: Connection refused by server`);
      }

      // If this was the last attempt, give up
      if (attempt === maxRetries) {
        console.error(`All ${maxRetries} attempts failed for ${url}`);
        return null;
      }

      // Wait before retrying (exponential backoff)
      const delay = retryDelay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}
