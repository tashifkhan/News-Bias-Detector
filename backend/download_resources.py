import nltk

def download_resources():
    resources = ['punkt', 'stopwords', 'wordnet']
    for resource in resources:
        nltk.download(resource)

if __name__ == "__main__":
    download_resources()