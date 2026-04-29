// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchFavicon') {
    const domain = request.domain;
    // Use Google Favicons since gstatic is now whitelisted for redirects
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = function() {
          sendResponse({ base64Url: reader.result });
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('Error fetching favicon:', error);
        sendResponse({ base64Url: null });
      });
      
    return true; // Indicates async response
  }
});
