import { NextRequest, NextResponse } from "next/server";
import { fetchSearchAnime } from "@/lib/anilist/client";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ media: [] });
  }
  try {
    const media = await fetchSearchAnime(q);
    return NextResponse.json({ media }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
