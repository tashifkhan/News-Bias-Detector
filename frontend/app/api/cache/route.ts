import { NextResponse } from 'next/server'
import clientPromise from '@/libs/mongo'
import { Collection } from 'mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const collection: Collection = client.db("NewsBiasApp").collection("NewsArtciles")
    
    // Retrieve all documents
    const entireData = await collection
      .find({})
      .toArray()
    
    if (!entireData.length) {
      return NextResponse.json(
        { error: "No cached data found. Please scrape first." },
        { status: 404 }
      )
    }

    // Sort: items with publish date first (descending), then those without publish date at the end
    const sortedData = entireData.sort((a, b) => {
      const aHasDate = !!a.published;
      const bHasDate = !!b.published;
      if (aHasDate && bHasDate) {
        // If both have published date, sort descending
        return new Date(b.published).getTime() - new Date(a.published).getTime();
      }
      if (aHasDate) return -1; // a comes before b
      if (bHasDate) return 1;  // b comes before a
      return 0; // both have no published date
    });

    return NextResponse.json(sortedData)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to retrieve cached data: ${error}` },
      { status: 500 }
    )
  }
}
