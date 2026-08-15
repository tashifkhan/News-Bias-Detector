import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { Collection } from "mongodb";

/**
 * Lightweight feed endpoint for the home page.
 *
 * Returns only the fields the feed cards need (no full keyword/tags blobs)
 * and paginates server-side, so the client doesn't pull the whole 3.7 MB
 * dataset just to show a page of cards. Bias is computed client-side in
 * the browser (ONNX) — no Python/Flask involved.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    20,
    Math.max(1, parseInt(url.searchParams.get("limit") || "9", 10) || 9)
  );

  try {
    const client = await clientPromise;
    const collection: Collection = client
      .db("NewsBiasApp")
      .collection("NewsArtciles");

    const [total, docs] = await Promise.all([
      collection.countDocuments({}),
      collection
        .find(
          {},
          {
            projection: {
              link: 1,
              title: 1,
              text: 1,
              author: 1,
              publish_date: 1,
              published: 1,
              thumbnail: 1,
              _id: 0,
            },
          }
        )
        .sort({ published: -1, publish_date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);

    return NextResponse.json({
      articles: docs,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to retrieve feed: ${error}` },
      { status: 500 }
    );
  }
}
