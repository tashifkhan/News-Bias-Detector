import json
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')

db = client['NewsBiasApp']
collection = db['NewsArtciles']

with open('./news_articles.json', 'r', encoding='utf-8') as f:
    articles = json.load(f)

for article in articles:
    title = article.get('title', '')
    text = article.get('text', '')
    if not collection.find_one({'title': title, 'text': text}):
        collection.insert_one(article)

collection.delete_many({'thumbnail': ''})
collection.delete_many({'thumbnail': {'$exists': False}})
collection.delete_many({'title': ''})
collection.delete_many({'text': ''})
collection.delete_many({'text': 'Get App for Better Experience'})
collection.delete_many({'text': 'No description available.'})
collection.delete_many({
    'title': {
        '$regex': '(?i)(dell|hp|acer)'
    }
})

collection.delete_many({'text': 'Log onto movie.ndtv.com for more celebrity pictures'})