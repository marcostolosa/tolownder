// Conjunto para armazenar URLs de mídia
let mediaUrls = new Set();

function isMediaUrl(url) {
  const mediaExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
    '.mp4', '.webm', '.ogg', '.m3u8', '.mpd'
  ];
  return mediaExtensions.some(ext => url.toLowerCase().endsWith(ext));
}

// Registrar listeners no início do service worker
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    if (isMediaUrl(url) && details.tabId >= 0) { // Verificar se tabId é válido
      mediaUrls.add(url);
      chrome.tabs.sendMessage(details.tabId, { type: 'NEW_MEDIA', url });
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tabId >= 0) { // Verificar se tabId é válido
    mediaUrls.clear();
    chrome.tabs.sendMessage(tabId, { type: 'CLEAR_MEDIA' });
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ALL_MEDIA') {
    sendResponse({ urls: Array.from(mediaUrls) });
  } else if (message.type === 'UPDATE_IMAGE_COUNT' && sender.tab && sender.tab.id >= 0) {
    const count = message.count.toString();
    chrome.action.setBadgeText({ text: count, tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000', tabId: sender.tab.id });
  }
});