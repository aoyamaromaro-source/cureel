import { fetchMediaByIds } from "@/lib/anilist/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  if (!ids.length) return NextResponse.json({ media: [] });

  try {
    // AniList allows up to 50 per Page query; chunk if needed
    const chunks: number[][] = [];
    for (let i = 0; i < ids.length; i += 50) {
      chunks.push(ids.slice(i, i + 50));
    }
    const results = await Promise.all(chunks.map((chunk) => fetchMediaByIds(chunk)));
    return NextResponse.json({ media: results.flat() });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
