import { NextResponse } from 'next/server'
import dbConnect from '@/libs/mongo'
import NewsArticle from '@/libs/articleModal'
import { NewsArticles } from '@/app/page'
import { scrapeScrapy } from '@/hooks/hookNewsArticles'

export async function POST(request: Request) {
    try {
        await dbConnect()

        let addedCount = 0
        let duplicateCount = 0

        const validResults = await scrapeScrapy() as unknown as { articles: NewsArticles[] }
        
        try {
            // Insert many documents
            const result = await NewsArticle.insertMany(validResults.articles, { ordered: false })
            addedCount = result.length
            duplicateCount = validResults.articles.length - addedCount
        } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 11000) { // Duplicate key error
                const writeErrors = (error as { writeErrors?: { length: number }[] }).writeErrors || []
                addedCount = validResults.articles.length - writeErrors.length
                duplicateCount = writeErrors.length
            } else {
                throw error
            }
        }

        // Delete unwanted content
        const unwantedTexts = [
            "", "Get App for Better Experience",
            "Log onto movie.ndtv.com for more celebrity pictures",
            "No description available."
        ]

        await NewsArticle.deleteMany({
            title: { $regex: '^(dell|hp|acer|lenovo)', $options: 'i' }
        })
        await NewsArticle.deleteMany({
            text: { $in: unwantedTexts }
        })

        // Maintain maximum of 1500 documents
        const totalCount = await NewsArticle.countDocuments()
        if (totalCount > 1500) {
            const excessDocs = totalCount - 1500
            const oldestDocs = await NewsArticle.find({}, '_id')
                .sort({ published_date: 1 })
                .limit(excessDocs)
            
            const docIds = oldestDocs.map(doc => doc._id)
            if (docIds.length > 0) {
                await NewsArticle.deleteMany({ _id: { $in: docIds } })
            }
        }

        return NextResponse.json({
            message: "Scraping completed!",
            added_articles: addedCount,
            duplicates_skipped: duplicateCount
        })

    } catch (error) {
        return NextResponse.json(
            { error: `Unexpected error: ${error}` },
            { status: 500 }
        )
    }
}