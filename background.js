let mediaUrls = new Set();

function isMediaUrl(url) {
  const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.mp4', '.webm', '.ogg', '.m3u8', '.mpd'];
  return mediaExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.startsWith('data:image/');
}

// Intercepta as requisições para identificar URLs de mídia
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    if (isMediaUrl(url) && details.tabId >= 0) {
      mediaUrls.add(url);
      chrome.tabs.sendMessage(details.tabId, { type: 'NEW_MEDIA', url }, () => {
        if (chrome.runtime.lastError) {
          console.error("Erro ao enviar NEW_MEDIA:", chrome.runtime.lastError);
        }
      });
    }
  },
  { urls: ["<all_urls>"] }
);

// Limpa as URLs de mídia quando a aba é atualizada
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tabId >= 0) {
    mediaUrls.clear();
    chrome.tabs.sendMessage(tabId, { type: 'CLEAR_MEDIA' }, () => {
      if (chrome.runtime.lastError) {
        console.error("Erro ao enviar CLEAR_MEDIA:", chrome.runtime.lastError);
      }
    });
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
});

// Comunicação entre background, content e popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ALL_MEDIA') {
    sendResponse({ urls: Array.from(mediaUrls) });
  } else if (message.type === 'UPDATE_IMAGE_COUNT' && sender.tab && sender.tab.id >= 0) {
    const count = message.count.toString();
    chrome.action.setBadgeText({ text: count, tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000', tabId: sender.tab.id });
  } else if (message.type === 'MEDIA_URLS') {
    message.urls.forEach(url => mediaUrls.add(url));
  }
});
