// content.js
console.log('%c LeetCode Company Tag Viewer Active ', 'background: #222; color: #bada55');

const domainMap = {
  'amazon': 'amazon.com',
  'google': 'google.com',
  'meta': 'meta.com',
  'facebook': 'meta.com',
  'microsoft': 'microsoft.com',
  'uber': 'uber.com',
  'bloomberg': 'bloomberg.com',
  'apple': 'apple.com',
  'netflix': 'netflix.com',
  'adobe': 'adobe.com',
  'bytedance': 'bytedance.com',
  'goldman sachs': 'goldmansachs.com',
  'oracle': 'oracle.com',
  'linkedin': 'linkedin.com',
  'yahoo': 'yahoo.com',
  'flipkart': 'flipkart.com',
  'phonepe': 'phonepe.com',
  'salesforce': 'salesforce.com',
  'swiggy': 'swiggy.com',
  'zomato': 'zomato.com',
  'meesho': 'meesho.com',
  'paytm': 'paytm.com',
  'groww': 'groww.in',
  'myntra': 'myntra.com',
  'jpmorgan chase': 'jpmorganchase.com',
  'tcs': 'tcs.com',
  'infosys': 'infosys.com',
  'wipro': 'wipro.com',
  'accenture': 'accenture.com',
  'cognizant': 'cognizant.com',
  'capgemini': 'capgemini.com'
};

function getSlugFromUrl(url) {
  const match = url.match(/\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

async function fetchProblemData() {
  const url = chrome.runtime.getURL('data.json');
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('LC Tag Viewer: Failed to load data:', error);
    return null;
  }
}

async function getLogoUrl(company) {
  const clean = company.toLowerCase().trim();
  
  // Use local assets for major companies
  if (clean === 'amazon') return chrome.runtime.getURL('logo_amazon.png');
  if (clean === 'google') return chrome.runtime.getURL('logo_google.png');
  if (clean === 'meta' || clean === 'facebook') return chrome.runtime.getURL('logo_meta.png');
  if (clean === 'microsoft') return chrome.runtime.getURL('logo_microsoft.png');

  // Request base64 from background script
  const domain = domainMap[clean] || (clean.replace(/\s+/g, '') + '.com');
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'fetchFavicon', domain: domain }, response => {
      if (response && response.base64Url) {
        resolve(response.base64Url);
      } else {
        // Fallback transparent pixel
        resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
      }
    });
  });
}

async function injectIntoHeader(problemInfo) {
  // Remove existing if any
  const existing = document.querySelector('.lc-header-tags-container');
  if (existing) existing.remove();

  if (!problemInfo) return;

  // Search for the question title element
  const titleEl = document.querySelector('.text-title-large') || 
                  document.querySelector('[data-cy="question-title"]') ||
                  document.querySelector('div.flex.items-center.gap-4 div');

  if (!titleEl) return;

  const container = document.createElement('div');
  container.className = 'lc-header-tags-container';

  const comps = Array.isArray(problemInfo.companies) ? problemInfo.companies : [problemInfo.companies];
  const displayComps = comps.slice(0, 20); // Show up to 20 companies instead of just 3
  
  for (let index = 0; index < displayComps.length; index++) {
    const company = displayComps[index];
    const logoUrl = await getLogoUrl(company);
    
    const tagDiv = document.createElement('div');
    tagDiv.className = 'lc-header-tag';
    
    const img = document.createElement('img');
    img.className = 'lc-header-logo';
    img.src = logoUrl;
    img.onerror = function() { this.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; };
    
    const span = document.createElement('span');
    span.textContent = company;
    
    tagDiv.appendChild(img);
    tagDiv.appendChild(span);
    container.appendChild(tagDiv);
    
    if (index < displayComps.length - 1) {
      const sep = document.createElement('div');
      sep.className = 'lc-header-sep';
      container.appendChild(sep);
    }
  }

  if (problemInfo.frequency) {
    const sep = document.createElement('div');
    sep.className = 'lc-header-sep';
    container.appendChild(sep);
    
    const freq = document.createElement('div');
    freq.className = 'lc-header-freq';
    freq.textContent = `⚡${problemInfo.frequency}`;
    container.appendChild(freq);
  }
  
  // Find a suitable parent to append to (right next to title)
  titleEl.parentElement.style.display = 'flex';
  titleEl.parentElement.style.alignItems = 'center';
  titleEl.parentElement.appendChild(container);
}

let currentSlug = null;

async function checkAndInject() {
  const slug = getSlugFromUrl(window.location.href);
  if (!slug) return;
  
  currentSlug = slug;
  const data = await fetchProblemData();
  if (data && data[slug]) {
    // Poll for the title element to ensure SPA has rendered
    let attempts = 0;
    const interval = setInterval(() => {
      const titleEl = document.querySelector('.text-title-large') || 
                      document.querySelector('[data-cy="question-title"]');
      if (titleEl || attempts > 20) {
        clearInterval(interval);
        if (titleEl) injectIntoHeader(data[slug]);
      }
      attempts++;
    }, 500);
  }
}

// Watch for URL changes (SPA navigation)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(checkAndInject, 1000);
  }
});
observer.observe(document, { subtree: true, childList: true });

// Initial run
checkAndInject();
