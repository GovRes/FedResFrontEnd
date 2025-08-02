import { usaJobsSearch } from "@/lib/utils/usaJobsSearch";

export async function POST(request: Request) {
  const searchData = await request.json();
  try {
    const results = await usaJobsSearch(searchData);
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
