import { NextResponse } from 'next/server'
import dbConnect from '@/libs/mongo'
import NewsArticle from '@/libs/articleModal'

export async function DELETE() {
  try {
    await dbConnect()
    
    // Find oldest 1000 documents
    const oldestDocs = await NewsArticle
      .find({})
      .sort({ published_date: 1 })
      .limit(1000)
    
    const docIds = oldestDocs.map(doc => doc._id)
    
    if (docIds.length) {
      const result = await NewsArticle.deleteMany({
        _id: { $in: docIds }
      })
      
      return NextResponse.json({
        message: `Deleted ${result.deletedCount} documents`
      })
    }
    
    return NextResponse.json({
      message: "No documents to delete"
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete documents: ${error}` },
      { status: 500 }
    )
  }
}