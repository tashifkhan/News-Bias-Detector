from flask import Flask, jsonify, request
import pandas as pd
from src.pipeline.predict_pipeline import PredictPipeline
from flask_cors import CORS
import webscapper
import json
from nltk.data import find
import nltk


def ensure_nltk_resource(resource_name):
    try:
        find(resource_name)  # Check if the resource is already downloaded
    except LookupError:
        print(f"Downloading NLTK resource: {resource_name}")
        nltk.download(resource_name)

# Ensure required NLTK resources are available
ensure_nltk_resource('punkt')
ensure_nltk_resource('wordnet')

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
    webscapper.save_to_json(results, "news_articles.json")
    
    # Read the updated JSON file
    try:
        with open("news_articles.json", "r", encoding="utf-8") as file:
            entire_data = json.load(file)
        return jsonify(entire_data)
    except Exception as e:
        return jsonify({"error": f"Failed to read saved data: {e}"}), 500

@app.route('/cache', methods=['GET'])
def cache():
    # Read the JSON file and return its content
    try:
        with open("news_articles.json", "r", encoding="utf-8") as file:
            entire_data = json.load(file)
        return jsonify(entire_data)
    except FileNotFoundError:
        return jsonify({"error": "No cached data found. Please scrape first."}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to read cached data: {e}"}), 500

@app.route('/predict',methods=['POST'])
def bias():
    try:
        data = request.json
        pred = pd.DataFrame([data])
        pred['text'] = pred['title'] + pred['text']
        predict_pipeline = PredictPipeline()
        result = predict_pipeline.predict(pred[['text']])
        return jsonify({"bias": result.tolist()})
    except Exception as e:
        return jsonify({"error": f"Failed to predict: {e}"}),500


if __name__ == '__main__':
    app.run(debug=True)