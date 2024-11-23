import nltk
from newspaper import Article
from datetime import datetime
import newspaper
import json

nltk.download('punkt')
nltk.download('punkt_tab')

def scrape(websites: list, count: int = 50) -> dict:
    """
    Scrapes articles from a list of websites and extracts metadata and content.

    Args:
        websites (list): A list of website URLs to scrape.

    Returns:
        list: A list of dictionaries, each containing metadata and content for an article.
    """
    articles_data = []
    temp = count

    for website in websites:
        temp = count
        try:
            site = newspaper.build(website, language='en', memorize=False)
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
                        "tags": list(article.tags)
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
    Saves the given data to a JSON file.

    Args:
        data (list): The data to save (list of dictionaries).
        output_file (str): The filename to save the data into.
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as json_file:
            json.dump(data, json_file, ensure_ascii=False, indent=4)
        print(f"Data saved to {output_file}")
    except Exception as e:
        print(f"Failed to save data to JSON. Error: {e}")


def main():
    websites = [
        "https://www.ndtv.com/",
        "https://www.thequint.com/",
        "https://www.hindustantimes.com/",
        "https://www.opindia.com/",
        "https://timesofindia.indiatimes.com/",
        "https://www.republicworld.com/",
    ]

    results = scrape(websites, 60000)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_to_json(results, f"scraped_articles_{timestamp}.json")
    print(results)

if __name__ == "__main__":
    main()