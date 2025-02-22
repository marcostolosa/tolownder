console.log('Content script carregado');

// Verifica se a URL é de imagem
function isImageUrl(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  return (
    imageExtensions.some(ext => url.toLowerCase().endsWith(ext)) ||
    url.startsWith('data:image/')
  );
}

// Extrai múltiplas URLs de propriedades CSS (ex.: background-image com mais de uma imagem)
function extractUrlsFromCSS(bgImage) {
  const urls = [];
  const regex = /url\((['"]?)(.*?)\1\)/g;
  let match;
  while ((match = regex.exec(bgImage)) !== null) {
    urls.push(match[2]);
  }
  return urls;
}

// Extrai URLs de mídia do DOM e atualiza a contagem de imagens únicas
function extractMediaUrls() {
  const urls = new Set();
  let imageCount = 0;

  // Imagens via <img>
  document.querySelectorAll('img').forEach(img => {
    if (img.src && isImageUrl(img.src)) {
      urls.add(img.src);
    }
  });

  // Vídeos e fontes via <video> e <source>
  document.querySelectorAll('video').forEach(video => {
    if (video.src) urls.add(video.src);
    video.querySelectorAll('source').forEach(source => {
      if (source.src) urls.add(source.src);
    });
  });

  // Imagens de fundo via CSS (suporta múltiplas URLs)
  document.querySelectorAll('*').forEach(element => {
    const style = window.getComputedStyle(element);
    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const extractedUrls = extractUrlsFromCSS(bgImage);
      extractedUrls.forEach(url => {
        if (url && isImageUrl(url)) {
          urls.add(url);
        }
      });
    }
  });

  // Atualiza a contagem de imagens únicas
  imageCount = Array.from(urls).filter(url => isImageUrl(url)).length;
  chrome.runtime.sendMessage({ type: 'UPDATE_IMAGE_COUNT', count: imageCount });

  return Array.from(urls);
}

// Envia as URLs extraídas para o background e popup
function sendMediaUrls() {
  const urls = extractMediaUrls();
  chrome.runtime.sendMessage({ type: 'MEDIA_URLS', urls });
}

// Execução inicial da extração de mídia
sendMediaUrls();

// Função debounce para otimizar a execução da análise em mudanças do DOM
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const debouncedSendMediaUrls = debounce(sendMediaUrls, 500);

// Observa alterações no DOM para atualizar as URLs de mídia de forma otimizada
const observer = new MutationObserver(() => {
  debouncedSendMediaUrls();
});
observer.observe(document.body, { childList: true, subtree: true });

// Recebe mensagens do background ou popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_MEDIA') {
    sendMediaUrls();
  } else if (message.type === 'GET_MEDIA') {
    sendResponse({ urls: extractMediaUrls() });
  } else if (message.type === 'CLEAR_MEDIA') {
    sendMediaUrls();
  }
});
