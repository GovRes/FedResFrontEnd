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
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, name, useVision, temperature }),
  });

  const text = await res.text();

  if (!res.ok) {
    try {
      const errorJson = JSON.parse(text);
      throw new Error(errorJson.error || "API error");
    } catch (e) {
      throw new Error(text || "Unknown API error");
    }
  }

  try {
    const data: Record<string, any> = JSON.parse(text);
    return data;
  } catch (error) {
    console.error("JSON parse error:", error);
    throw new Error(
      `Failed to parse response as JSON: ${text.substring(0, 100)}...`
    );
  }
}
