import os
import shutil
from nltk.data import find
import nltk
import newspaper
import json

# Ensure necessary resources are downloaded

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
ensure_nltk_resource('stopwords')

# Path to the cache folder
CACHE_FOLDER = os.path.join(os.path.dirname(__file__), ".newspaper_scraper")

def clear_cache():
    """
    Clears the newspaper cache folder to force fresh scraping of all articles.
    """
    if os.path.exists(CACHE_FOLDER):
        try:
            shutil.rmtree(CACHE_FOLDER)  # Delete the cache folder
            print("Cache cleared successfully.")
        except Exception as e:
            print(f"Failed to clear cache: {e}")
    else:
        print("No cache to clear.")

def scrape(websites: list, count: int = 50) -> list:
    """
    Scrapes articles from a list of websites and extracts metadata, including thumbnails.

    Args:
        websites (list): A list of website URLs to scrape.
        count (int): Maximum number of articles to fetch per website.

    Returns:
        list: A list of dictionaries, each containing metadata and content for an article.
    """
    articles_data = []
    temp = count

    for website in websites:
        temp = count
        try:
            site = newspaper.build(website, language='en', memorize=False)  # Disable cache
            print(f"Links from {website} = {len(site.articles)}")

            for article in site.articles:
                try:
                    if temp == 0:
                        break
                    article.download()
                    article.parse()
                    article.nlp()

                    articles_data.append({
                        "link": article.url,
                        "title": article.title,
                        "text": article.text,
                        "author": article.authors,
                        "publish_date": article.publish_date.strftime('%Y-%m-%d') if article.publish_date else None,
                        "keywords": article.keywords,
                        "tags": list(article.tags),
                        "thumbnail": article.top_image  # Get the top image (thumbnail)
                    })
                    temp -= 1

                except Exception as e:
                    print(f"Failed to parse article: {article.url}. Error: {e}")
                    continue

        except Exception as e:
            print(f"Failed to process website: {website}. Error: {e}")
            continue

    print("**Finished Parsing**")
    print(f"Total Articles - {len(articles_data)}")
    return articles_data


def save_to_json(data, output_file):
    """
    Prepends the given data to an existing JSON file or creates a new file if none exists.

    Args:
        data (list): The data to save (list of dictionaries).
        output_file (str): The filename to save the data into.
    """
    try:
        # Load existing data if the file exists
        if os.path.exists(output_file):
            with open(output_file, 'r', encoding='utf-8') as json_file:
                existing_data = json.load(json_file)
        else:
            existing_data = []

        # Prepend new data to existing data
        combined_data = data + existing_data

        # Save updated data back to the file
        with open(output_file, 'w', encoding='utf-8') as json_file:
            json.dump(combined_data, json_file, ensure_ascii=False, indent=4)

        print(f"Data saved to {output_file}")
    except Exception as e:
        print(f"Failed to save data to JSON. Error: {e}")


def main():
    # Clear cache before scraping
    clear_cache()

    websites = [
        "https://www.ndtv.com/",
        "https://www.thequint.com/",
        "https://www.hindustantimes.com/",
        "https://www.opindia.com/",
        "https://timesofindia.indiatimes.com/",
        "https://www.republicworld.com/",
    ]

    results = scrape(websites, count=50)
    output_file = "news_articles.json"
    save_to_json(results, output_file)


if __name__ == "__main__":
    main()