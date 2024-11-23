from flask import Flask, jsonify
from flask_cors import CORS
import webscapper

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def home():
    return jsonify(message="Welcome to the News Classifier API")

@app.route('/scaper', methods=['GET', 'POST'])
def scrape():
    data = webscapper.scrape()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)