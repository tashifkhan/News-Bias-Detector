import mongoose from 'mongoose'

const NewsArticleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    published_date: { type: Date},
    link: { type: String, required: true },
    author: { type: [String]},
    keywords: { type: [String]},
    tags: { type: [String]},
    thumbnail: { type: String, required: true }
}, {
    timestamps: false
})

NewsArticleSchema.index({ title: 'text', text: 'text' })

export default mongoose.models.NewsArticle || mongoose.model('NewsArticle', NewsArticleSchema)
