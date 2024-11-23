from flask import Flask, jsonify, request
from flask_cors import CORS
import webscapper

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def home():
    return jsonify(message="Welcome to the News Classifier API")

@app.route('/scaper', methods=['GET', 'POST'])
def scrape():
    data = request.json
    websites = data.get('websites', [])

    if not websites:
        return jsonify({"error": "No websites provided"}), 400

    results = webscapper.scrape(websites)
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)