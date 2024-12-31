import { NextResponse } from 'next/server'
import dbConnect from '@/libs/mongo'
import NewsArticle from '@/libs/articleModal'

export async function GET() {
  try {
    await dbConnect()
    
    const articles = await NewsArticle
      .find({})
      .sort({ published_date: -1 })
    
    if (!articles.length) {
      return NextResponse.json(
        { error: "No cached data found. Please scrape first." },
        { status: 404 }
      )
    }
    
    return NextResponse.json(articles)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to retrieve cached data: ${error}` },
      { status: 500 }
    )
  }
}