import { NextResponse } from 'next/server'
import clientPromise from '@/libs/mongo'
import { scrapeScrapy } from '@/hooks/hookNewsArticles'

interface ScrapedArticle {
    title: string;
    text: string;
    author: string[];
    publish_date: string | null;
    keywords: string[];
    tags: string[];
    link: string;
    thumbnail?: string;
}

interface ScrapyResponse {
    articles: ScrapedArticle[];
}

interface MongoWriteError {
    code: number;
    index: number;
    errmsg: string;
    op: Record<string, unknown>;
}

export async function POST() {
    try {
        const client = await clientPromise
        const db = client.db("NewsBiasApp")
        const collection = db.collection("NewsArtciles")

        let addedCount = 0
        let duplicateCount = 0

        const validResults = await scrapeScrapy() as unknown as ScrapyResponse

        try {
            const result = await collection.insertMany(validResults.articles, { ordered: false })
            addedCount = result.insertedCount
            duplicateCount = validResults.articles.length - addedCount
        } catch (error) {
            if (error && typeof error === 'object' && 'writeErrors' in error) {
                const writeErrors = (error as { writeErrors?: MongoWriteError[] }).writeErrors || []
                addedCount = validResults.articles.length - writeErrors.length
                duplicateCount = writeErrors.length
            } else {
                throw error
            }
        }

        // Delete unwanted content
        const unwantedTexts = [
            "", `Get App for Better Experience`,
            `Log onto movie.ndtv.com for more celebrity pictures`,
            `No description available.`
        ]

        await collection.deleteMany({
            title: { $regex: `^(dell|hp|acer|lenovo)`, $options: 'i' }
        })

        await collection.deleteMany({
            text: { $in: unwantedTexts }
        })

        // Maintain maximum of 1500 documents
        const totalCount = await collection.countDocuments()
        if (totalCount > 1500) {
            const excessDocs = totalCount - 1500
            const oldestDocs = await collection.find({}, { projection: { _id: 1 } })
                .sort({ published_date: 1 })
                .limit(excessDocs)
                .toArray()

            const docIds = oldestDocs.map(doc => doc._id)
            if (docIds.length > 0) {
                await collection.deleteMany({ _id: { $in: docIds } })
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