console.log('Content script carregado');

// Função para verificar se a URL é de uma imagem
function isImageUrl(url) {
  // Verifica extensões tradicionais ou URLs Base64 de imagens
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  return (
    imageExtensions.some(ext => url.toLowerCase().endsWith(ext)) ||
    url.startsWith('data:image/')
  );
}

// Função para extrair URLs de mídia do DOM e contar imagens
function extractMediaUrls() {
  const urls = new Set();
  let imageCount = 0;

  document.querySelectorAll('img').forEach(img => {
    if (img.src) {
      urls.add(img.src);
      if (isImageUrl(img.src)) imageCount++;
    }
  });

  document.querySelectorAll('video').forEach(video => {
    if (video.src) urls.add(video.src);
    video.querySelectorAll('source').forEach(source => {
      if (source.src) urls.add(source.src);
    });
  });

  document.querySelectorAll('*').forEach(element => {
    const style = window.getComputedStyle(element);
    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== 'none' && bgImage.startsWith('url(')) {
      const url = bgImage.slice(4, -1).replace(/['"]/g, '');
      if (url) {
        urls.add(url);
        if (isImageUrl(url)) imageCount++;
      }
    }
  });

  chrome.runtime.sendMessage({ type: 'UPDATE_IMAGE_COUNT', count: imageCount });
  return Array.from(urls);
}

// Enviar URLs ao background e popup
function sendMediaUrls() {
  const urls = extractMediaUrls();
  chrome.runtime.sendMessage({ type: 'MEDIA_URLS', urls });
}

// Executar análise inicial
sendMediaUrls();

// Observar mudanças no DOM
const observer = new MutationObserver(() => {
  sendMediaUrls();
});
observer.observe(document.body, { childList: true, subtree: true });

// Receber mensagens
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_MEDIA') {
    sendMediaUrls();
  } else if (message.type === 'GET_MEDIA') {
    sendResponse({ urls: extractMediaUrls() });
  } else if (message.type === 'CLEAR_MEDIA') {
    sendMediaUrls();
  }
});