// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('search');
  const resultsDiv = document.getElementById('results');
  const toggleBtn = document.getElementById('toggle-panel');

  // Fetch local data
  const url = chrome.runtime.getURL('data.json');
  let data = {};
  try {
    const response = await fetch(url);
    data = await response.json();
  } catch (e) {
    console.error('Error loading data:', e);
  }

  const renderResults = (query) => {
    resultsDiv.innerHTML = '';
    const lowerQuery = query.toLowerCase();

    const matches = Object.values(data).filter(item => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const companyMatch = item.companies.some(c => c.toLowerCase().includes(lowerQuery));
      return titleMatch || companyMatch;
    });

    if (matches.length === 0) {
      resultsDiv.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }

    matches.slice(0, 15).forEach(item => {
      const el = document.createElement('div');
      el.className = 'item';
      
      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = item.title;

      const comp = document.createElement('div');
      comp.className = 'item-company';
      comp.textContent = item.companies.slice(0, 4).join(', ') + (item.companies.length > 4 ? '...' : '');

      el.appendChild(title);
      el.appendChild(comp);
      resultsDiv.appendChild(el);
    });
  };

  searchInput.addEventListener('input', (e) => renderResults(e.target.value));
  renderResults(''); // Initial render

  // Toggle panel in active tab
  toggleBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('leetcode.com/problems/')) {
      chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }).catch(err => {
        console.log("Could not send message, content script might not be injected yet.");
      });
    } else {
      alert('Please open a LeetCode problem page to toggle the panel.');
    }
  });
});
