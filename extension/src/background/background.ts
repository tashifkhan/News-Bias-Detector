import extractArticleBody from '../contentScript/contentScript';

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractArticleBody,
    args: ['default', '']  // Provide default method and selectors
  });
});