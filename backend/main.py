import os
import subprocess

# Ensure NLTK resources are downloaded
subprocess.run(["python", "download_resources.py"])

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
from pymongo.errors import BulkWriteError
import dotenv

# Load environment variables
dotenv.load_dotenv()


def ensure_nltk_resource(resource_name):
    nltk_data_dir = os.path.join(os.getcwd(), 'nltk_data')
    os.makedirs(nltk_data_dir, exist_ok=True)
    
    # Add the NLTK data directory to the search path
    if nltk_data_dir not in nltk.data.path:
        nltk.data.path.append(nltk_data_dir)
        
    try:
        find(resource_name)  # Check if the resource is already downloaded
    except LookupError:
        print(f"Downloading NLTK resource: {resource_name}")
        nltk.download(resource_name, download_dir=nltk_data_dir)

# Ensure required NLTK resources are available
ensure_nltk_resource('punkt')
ensure_nltk_resource('wordnet')
ensure_nltk_resource('stopwords')

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
    if not data:
        return jsonify({"error": "Invalid or empty JSON"}), 400

    websites = data.get('websites', [])
    count = data.get('count', 50)  # Default to 50

    if not websites:
        return jsonify({"error": "No websites provided"}), 400

    # Scrape websites
    results = webscapper.scrape(websites, count)
    valid_results = [r for r in results if r.get('title') and r.get('text')]

    if not valid_results:
        return jsonify({"message": "No valid results to insert"}), 200

    added_count = 0
    duplicate_count = 0

    try:
        # Bulk insert and handle duplicates
        result = collection.insert_many(valid_results, ordered=False)
        added_count = len(result.inserted_ids)
        duplicate_count = len(valid_results) - added_count
    except BulkWriteError as bwe:
        write_errors = bwe.details.get('writeErrors', [])
        added_count = len(valid_results) - len(write_errors)
        duplicate_count = len(write_errors)
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

    # Remove unwanted documents
    unwanted_texts = [
        "", "Get App for Better Experience",
        "Log onto movie.ndtv.com for more celebrity pictures",
        "No description available."
    ]
    collection.delete_many({'title': {'$exists': True, '$regex': '^(?i)(dell|hp|acer|lenovo)'}})
    collection.delete_many({'text': {'$in': unwanted_texts}})
    
    # Maintain a size limit of 1500 documents
    total_count = collection.count_documents({})
    if total_count > 1500:
        excess_docs = total_count - 1500
        oldest_docs = collection.find({}, {'_id': 1}).sort("published_date", 1).limit(excess_docs)
        doc_ids = [doc['_id'] for doc in oldest_docs]
        if doc_ids:
            collection.delete_many({'_id': {'$in': doc_ids}})

    return jsonify({
        "message": "Scraping completed!",
        "added_articles": added_count,
        "duplicates_skipped": duplicate_count
    })

@app.route('/cache', methods=['GET', 'OPTIONS'])
def cache():
    try:
        # Retrieve all documents from the MongoDB collection, sorted by published date
        entire_data = list(collection.find().sort("published_date", -1))  # -1 for descending order
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
    
@app.route('/delete', methods=['DELETE'])
def delete():
    try:
        # Find the oldest 1000 documents sorted by published_date
        oldest_docs = collection.find().sort("published_date", 1).limit(1000)
        
        # Get the _ids of documents to delete
        doc_ids = [doc['_id'] for doc in oldest_docs]
        
        # Delete the documents
        if doc_ids:
            result = collection.delete_many({'_id': {'$in': doc_ids}})
            return jsonify({"message": f"Deleted {result.deleted_count} documents"})
        return jsonify({"message": "No documents to delete"})
    except Exception as e:
        return jsonify({"error": f"Failed to delete documents: {e}"}), 500

if __name__ == '__main__':
    app.run()