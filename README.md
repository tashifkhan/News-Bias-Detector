# News Bias Detector

This project is a machine learning-based solution to predict political bias (left-biased or right-biased) in textual content. The model is trained on labeled data using XGBoost. The frontend is built using Next.js, and a Streamlit app is maintained as a prototype.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Workflow](#workflow)
5. [Usage](#usage)
6. [Future Improvements](#future-improvements)
7. [Contributing](#contributing)

## Overview

In an era of diverse opinions and media influence, detecting political bias in textual content can provide insights into media and publication tendencies. This project utilizes a machine learning approach to categorize text as either left-biased or right-biased. By analyzing large volumes of labeled text data, the model aims to capture distinct features that differentiate these biases.

## Features

- **Text Preprocessing**: Cleans and preprocesses raw text to optimize model training and prediction.
- **Machine Learning Pipeline**: Uses the XGBoost algorithm for classification.
- **Bias Prediction**: Predicts political bias (left or right) based on input text.
- **Frontend Interface**: User-friendly interface built with Next.js for making predictions directly from a web browser.
- **Prototype Interface**: Streamlit app for initial testing and prototyping.
- **Backend Services**: Flask backend for API management and integration.
- **Database Management**: Utilizes MongoDB for data storage alongside legacy JSON implementations.
- **Workflow Management**: Structured pipeline for reproducible and maintainable code.

## Tech Stack

- **Python**: Core programming language.
- **XGBoost**: Model training and classification.
- **Next.js**: Frontend web framework for building the user interface.
- **Streamlit**: Prototype web application for initial testing.
- **Flask**: Backend framework for API development.
- **MongoDB**: NoSQL database for data storage.
- **Scikit-Learn**: Data preprocessing and evaluation utilities.
- **Pandas, NumPy**: Data handling and manipulation.
- **Matplotlib, Seaborn**: Visualization of data distribution and model performance.

## Workflow

The project workflow is as follows:

1. **Data Ingestion**: Raw data collection and loading.
2. **Data Transformation**: Text cleaning, lemmatization, and vectorization.
3. **Model Selection and Training**: Training the model using XGBoost.
4. **Evaluation**: Model evaluation with metrics such as accuracy score.
5. **Backend Development**: Setting up Flask APIs for model interaction.
6. **Frontend Development**: Building the user interface with Next.js.
7. **Database Integration**: Managing data with MongoDB and maintaining legacy JSON implementations.

### Clone the Repository

```bash
git clone https://github.com/aarshgupta24/L-R-News-Classifier.git
cd L-R-News-Classifier
```

### Install Dependencies

Create a virtual environment and install required packages:

```bash
python -m venv env
source env/bin/activate # On Windows use `env\Scripts\activate`
pip install -r requirements.txt
```

## Usage

**Live Link**
[🔗 fontend](https://news-bias-detector.vercel.app)
[🔗 backend](https://news-bias-detector.onrender.com/)

for the Bias Detection Wensite

**Launch Prototype Streamlit App**:
if you only want want bias detetion on the particular url you want

```bash
cd prototype
streamlit run app.py
```

**Launch the webside on local host**

terminal window 1

```bash
cd frontend
npm install
npm run dev
```

terminal window 2

```bash
cd backend
python main.py
```

## Future Improvements

1. **Support for Neutral Bias Detection**: Add a "neutral" category to detect texts that don't lean towards any specific bias.
2. **Sentiment Analysis Integration**: Incorporate sentiment analysis to capture emotional tone alongside bias.
3. **Improved NLP Techniques**: Explore advanced techniques like BERT or RoBERTa for better feature extraction.

## Contributing

Contributions are welcome! Please fork the repository, make your changes, and submit a pull request.
