export async function sendMessages({
  input,
  name,
  useVision = false,
  temperature = 0,
}: {
  input: string;
  name: string;
  useVision?: boolean;
  temperature?: number;
}) {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, name, useVision, temperature }),
    });

    const text = await res.text();

    console.log(`API Response Status: ${res.status}`);
    console.log(
      `API Response Text (first 200 chars): ${text.substring(0, 200)}...`
    );

    if (!res.ok) {
      try {
        const errorJson = JSON.parse(text);
        throw new Error(errorJson.error || `API error: ${res.status}`);
      } catch (parseError) {
        throw new Error(`API error (${res.status}): ${text}`);
      }
    }

    // Check if the response is empty
    if (!text || text.trim() === "") {
      throw new Error("Empty response from API");
    }

    try {
      const data: Record<string, any> = JSON.parse(text);
      console.log(
        `Successfully parsed JSON response with keys: ${Object.keys(data).join(", ")}`
      );
      return data;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response that failed to parse:", text);

      // Try to extract JSON if it's wrapped in other content
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedData = JSON.parse(jsonMatch[0]);
          console.log("Successfully extracted JSON from malformed response");
          return extractedData;
        }
      } catch (extractError) {
        console.error("Failed to extract JSON:", extractError);
      }

      throw new Error(
        `Failed to parse response as JSON. Response: ${text.substring(0, 200)}...`
      );
    }
  } catch (error) {
    console.error("sendMessages error:", error);
    throw error;
  }
}
