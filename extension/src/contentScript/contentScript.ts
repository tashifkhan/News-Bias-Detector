// function extractArticleBody() {
//     // List of common article body selectors used by major news sites
//     const selectors = [
//       'article',
//       '.article-body',
//       '.article__body',
//       '.content__body',
//       '#article-body',
//       '.post-content',
//       'main',
//       '.main-content',
//       '.entry-content',
//       '[data-cy="article-body"]'
//     ];
  
//     // Advanced extraction strategies
//     function findBestArticleContainer() {
//       // Try specific selectors first
//       for (let selector of selectors) {
//         const element = document.querySelector(selector);
//         if (element && isValidArticleContainer(element)) {
//           return element;
//         }
//       }
  
//       // Fallback: Find largest text container
//       const paragraphs = document.getElementsByTagName('p');
//       return findLargestTextContainer(paragraphs);
//     }
  
//     function isValidArticleContainer(element: Element) {
//       // Check text length and paragraph count
//       const paragraphs = element.getElementsByTagName('p') as HTMLCollectionOf<HTMLParagraphElement>;
//       const totalTextLength = Array.from(paragraphs)
//         .reduce((total, p: HTMLParagraphElement) => total + p.textContent.length, 0);
      
//       return paragraphs.length > 3 && totalTextLength > 500;
//     }
  
//     function findLargestTextContainer(paragraphs) {
//       let largestContainer = null;
//       let maxTextLength = 0;
  
//       // Check parent elements of paragraphs
//       for (let p of paragraphs) {
//         const parent = p.closest('div, article, section');
//         if (parent) {
//           const textLength = parent.textContent.length;
//           if (textLength > maxTextLength) {
//             maxTextLength = textLength;
//             largestContainer = parent;
//           }
//         }
//       }
  
//       return largestContainer;
//     }
  
//     // Extract and copy article body
//     const articleBody = findBestArticleContainer();
    
//     if (articleBody) {
//       // Copy to clipboard
//       navigator.clipboard.writeText(articleBody.innerText).then(() => {
//         alert('Article body copied to clipboard!');
//       }).catch(err => {
//         console.error('Failed to copy text: ', err);
//       });
//     } else {
//       alert('Could not extract article body. Please try manually.');
//     }
//   }

function extractArticleBody(method: string, customSelectors: string = '') {
    const strategies = {
      default: () => {
        const selectors = [ 
            'article',
            '.article-body',
            '.article__body',
            '.content__body',
            '#article-body',
            '.post-content',
            'main',
            '.main-content',
            '.entry-content',
            '[data-cy="article-body"]'
        ];
        
        for (let selector of selectors) {
          const element = document.querySelector(selector);
          if (element) return (element as HTMLElement).innerText;
        }
        return null;
      },
      custom: () => {
        const selectors = customSelectors.split(',').map(s => s.trim());
        for (let selector of selectors) {
          const element = document.querySelector(selector);
          if (element) return (element as HTMLElement).innerText;
        }
        return null;
      },
      advanced: () => {
        const paragraphs = document.getElementsByTagName('p');
        const textContents = Array.from(paragraphs)
          .map(p => p.textContent)
          .filter(text => text.length > 50);
        
        return textContents.join('\n\n');
      }
    };

    const extractionStrategy = strategies[method] || strategies.default;
    const extractedText = extractionStrategy();
  
    if (extractedText) {
      navigator.clipboard.writeText(extractedText).then(() => {
        alert('Article body copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    } else {
      alert('Could not extract article body.');
    }
  }
  
  export default extractArticleBody;