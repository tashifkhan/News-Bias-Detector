from flask import Flask, jsonify, request
import pandas as pd
from src.pipeline.predict_pipeline import PredictPipeline
from flask_cors import CORS
import webscapper
import json
from nltk.data import find
import nltk
from pymongo import MongoClient
from bson.json_util import dumps
import random
import os
import dotenv

# Load environment variables
dotenv.load_dotenv()

def ensure_nltk_resource(resource_name):
    try:
        find(resource_name)  # Check if the resource is already downloaded
    except LookupError:
        print(f"Downloading NLTK resource: {resource_name}")
        nltk.download(resource_name)

# Ensure required NLTK resources are available
ensure_nltk_resource('punkt')
ensure_nltk_resource('wordnet')

# MongoDB setup
client = MongoClient(os.getenv('MONGO_DB_URI'))
db = client['NewsBiasApp']
collection = db['NewsArtciles']

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def home():
    return jsonify(message="Welcome to the News Classifier API")

@app.route('/scaper', methods=['GET', 'POST'])
def scrape():
    data = request.json
    if data is None:
        return jsonify({"error": "Invalid or empty JSON"}), 400

    websites = data.get('websites', [])
    count = data.get('count', 50)  # Default to 50 if 'count' is not provided

    if not websites:
        return jsonify({"error": "No websites provided"}), 400

    results = webscapper.scrape(websites, count)

    added_count = 0
    duplicate_count = 0
    for result in results:
        try:
            # Check if an article with the same title and text already exists
            exists = collection.find_one({
                "title": result['title'],
                "text": result['text']
            })
            if ((not exists) and (not (result['title'] == '' or result['text'] == ''))):
                collection.insert_one(result)
                added_count += 1
            else:
                duplicate_count += 1
        except Exception as e:
            return jsonify({"error": f"Unexpected error: {e}"}), 500
        
    collection.delete_many({'title': ''})
    collection.delete_many({'text': ''})
    collection.delete_many({'text': 'Get App for Better Experience'})
    collection.delete_many({'text': 'Log onto movie.ndtv.com for more celebrity pictures'})
    collection.delete_many({'text': 'No description available.'})
    collection.delete_many({
        'title': {
            '$regex': '(?i)(dell|hp|acer|lenovo)'
        }
    })

    return jsonify({
        "message": "Scraping completed!",
        "added_articles": added_count,
        "duplicates_skipped": duplicate_count
    })

@app.route('/cache', methods=['GET', 'OPTIONS'])
def cache():
    try:
        # Retrieve all documents from the MongoDB collection
        entire_data = list(collection.find())
        random.shuffle(entire_data)
        if not entire_data:
            return jsonify({"error": "No cached data found. Please scrape first."}), 404
        return jsonify(json.loads(dumps(entire_data)))
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve cached data: {e}"}), 500

@app.route('/predict', methods=['POST'])
def bias():
    try:
        data = request.json
        pred = pd.DataFrame([data])
        pred['text'] = pred['title'] + pred['text']
        predict_pipeline = PredictPipeline()
        result = predict_pipeline.predict(pred[['text']])
        return jsonify({"bias": result.tolist()})
    except Exception as e:
        return jsonify({"error": f"Failed to predict: {e}"}), 500

@app.route('/search', methods=['POST'])
def search():
    data = request.json
    keyword = data.get('keyword')
    if not keyword:
        return jsonify({"error": "No keyword provided"}), 400
    try:
        # Ensure text index exists
        collection.create_index([('title', 'text'), ('text', 'text')])

        # Perform text search
        results = collection.find(
            {"$text": {"$search": keyword}},
            {"score": {"$meta": "textScore"}}
        ).sort([('score', {'$meta': 'textScore'})])

        articles = list(results)
        if not articles:
            return jsonify({"message": "No articles found"}), 404
        return jsonify(json.loads(dumps(articles)))
    except Exception as e:
        return jsonify({"error": f"Search failed: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)