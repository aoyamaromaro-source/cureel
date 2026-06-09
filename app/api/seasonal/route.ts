import { NextRequest, NextResponse } from "next/server";
import { fetchSeasonalAnime } from "@/lib/anilist/client";
import type { Season } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const season = (searchParams.get("season") ?? "SPRING") as Season;
  const year = parseInt(searchParams.get("year") ?? "2026", 10);

  try {
    const media = await fetchSeasonalAnime(season, year);
    return NextResponse.json({ media }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
