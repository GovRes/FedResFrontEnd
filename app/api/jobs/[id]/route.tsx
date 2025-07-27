import { usaJobsTextFetch } from "@/app/utils/usaJobsTextFetch";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    const results = await usaJobsTextFetch({ jobId: id });
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}
