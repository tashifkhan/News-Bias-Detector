import axios from 'axios';

const websites = [
    "https://www.ndtv.com/",
    "https://www.thequint.com/",
    "https://www.hindustantimes.com/",
    "https://www.opindia.com/",
    "https://timesofindia.indiatimes.com/",
    "https://www.republicworld.com/",
]

const backendUrl = "http://127.0.0.1:5000/"
const payload = {
    websites: websites,
    count: 60000,
}

const getNewsArticles = async () => {    
    const response = await axios.post(
        backendUrl + "scaper",
        payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
}

const getCachedData = async () => {
    const response = await axios.get(
        backendUrl + "cache",
    );
    return response.data;
};

export { getNewsArticles, getCachedData, backendUrl, payload, websites };