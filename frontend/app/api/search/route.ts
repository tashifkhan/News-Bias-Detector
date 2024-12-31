import { NextResponse } from 'next/server'
import dbConnect from '@/libs/mongo'
import NewsArticle from '@/libs/articleModal'

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json()
    
    if (!keyword) {
      return NextResponse.json(
        { error: "No keyword provided" },
        { status: 400 }
      )
    }

    await dbConnect()
    
    const articles = await NewsArticle
      .find({
        $or: [
          { tags: { $regex: keyword, $options: 'i' } },
          { title: { $regex: keyword, $options: 'i' } },
          { $text: { $search: keyword } }
        ]
      },
      { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
    
    if (!articles.length) {
      return NextResponse.json(
        { message: "No articles found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(articles)
  } catch (error) {
    return NextResponse.json(
      { error: `Search failed: ${error}` },
      { status: 500 }
    )
  }
}