import { usaJobsTextFetch } from "@/lib/utils/usaJobsTextFetch";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    console.log("Fetching job details for ID:", id);
    const results = await usaJobsTextFetch({ jobId: id });

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}
