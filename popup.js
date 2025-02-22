document.addEventListener('DOMContentLoaded', async () => {
    const mediaContainer = document.getElementById('media-container');
    const errorContainer = document.getElementById('error-container');
  
    // Função para logar erros na área de erros do popup
    function logError(message) {
      const errorItem = document.createElement('div');
      errorItem.className = 'error-item';
      errorItem.textContent = message;
      errorContainer.appendChild(errorItem);
    }
  
    // Verifica se a URL é de imagem (inclui base64)
    function isImageUrl(url) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      return imageExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.startsWith('data:image/');
    }
  
    // Verifica se é um vídeo
    function isVideoUrl(url) {
      const videoExtensions = ['.mp4', '.webm', '.ogg'];
      return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }
  
    // Obtém URLs de mídia via mensagens dos scripts content e background
    async function getMediaUrls() {
      try {
        const tabs = await new Promise(resolve =>
          chrome.tabs.query({ active: true, currentWindow: true }, resolve)
        );
        const tabId = tabs[0].id;
        const contentResponse = await new Promise(resolve =>
          chrome.tabs.sendMessage(tabId, { type: 'GET_MEDIA' }, resolve)
        );
        const backgroundResponse = await new Promise(resolve =>
          chrome.runtime.sendMessage({ type: 'GET_ALL_MEDIA' }, resolve)
        );
        const contentUrls = (contentResponse && contentResponse.urls) || [];
        const backgroundUrls = (backgroundResponse && backgroundResponse.urls) || [];
        return [...new Set([...contentUrls, ...backgroundUrls])];
      } catch (error) {
        logError("Erro ao obter URLs de mídia: " + error);
        return [];
      }
    }
  
    // Função de download com opção de conversão para JPG ou PNG
    // format: "original", "jpeg" ou "png"
    function downloadMedia(url, format = "original") {
      if (format === "original") {
        chrome.downloads.download({ url }, (downloadId) => {
          if (chrome.runtime.lastError) {
            logError("Erro no download: " + chrome.runtime.lastError.message);
          }
        });
      } else {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Tenta evitar problemas de CORS
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          let mimeType = "image/jpeg";
          let ext = "jpg";
          if (format === "png") {
            mimeType = "image/png";
            ext = "png";
          }
          const dataUrl = canvas.toDataURL(mimeType, 0.9);
          const blob = dataURLtoBlob(dataUrl);
          const blobUrl = URL.createObjectURL(blob);
          chrome.downloads.download({
            url: blobUrl,
            filename: `image.${ext}`
          }, () => {
            if (chrome.runtime.lastError) {
              logError("Erro no download: " + chrome.runtime.lastError.message);
            }
            URL.revokeObjectURL(blobUrl);
          });
        };
        img.onerror = () => {
          logError("Erro ao carregar imagem para conversão: " + url);
        };
        img.src = url;
      }
    }
  
    // Converte data URL para Blob
    function dataURLtoBlob(dataUrl) {
      const [header, data] = dataUrl.split(',');
      const mime = header.match(/:(.*?);/)[1];
      const binary = atob(data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      return new Blob([array], { type: mime });
    }
  
    // Cria o card para cada mídia
    function createMediaCard(url) {
      const card = document.createElement('div');
      card.className = 'media-card';
  
      let mediaElement;
      if (isImageUrl(url)) {
        mediaElement = document.createElement('img');
        mediaElement.src = url;
      } else if (isVideoUrl(url)) {
        mediaElement = document.createElement('video');
        mediaElement.src = url;
        mediaElement.controls = true;
      } else {
        // Tenta renderizar como imagem por padrão
        mediaElement = document.createElement('img');
        mediaElement.src = url;
      }
      mediaElement.className = 'thumbnail';
      // Atributos HTML para forçar o tamanho fixo de 60x60
      mediaElement.width = 60;
      mediaElement.height = 60;
      mediaElement.onerror = () => {
        logError("Erro ao carregar: " + url);
      };
      card.appendChild(mediaElement);
  
      // Exibe o link completo da mídia
      const urlText = document.createElement('div');
      urlText.className = 'media-url';
      urlText.textContent = url;
      card.appendChild(urlText);
  
      // Cria um container para os botões de download
      const btnContainer = document.createElement('div');
      btnContainer.className = 'button-container';
  
      // Botão para baixar o arquivo original
      const btnOriginal = document.createElement('button');
      btnOriginal.className = 'download-btn';
      btnOriginal.textContent = 'Original';
      btnOriginal.onclick = () => downloadMedia(url, "original");
      btnContainer.appendChild(btnOriginal);
  
      // Se for imagem, adiciona as opções de conversão para JPG e PNG
      if (isImageUrl(url)) {
        const btnJpg = document.createElement('button');
        btnJpg.className = 'download-btn';
        btnJpg.textContent = 'JPG';
        btnJpg.onclick = () => downloadMedia(url, "jpeg");
        btnContainer.appendChild(btnJpg);
  
        const btnPng = document.createElement('button');
        btnPng.className = 'download-btn';
        btnPng.textContent = 'PNG';
        btnPng.onclick = () => downloadMedia(url, "png");
        btnContainer.appendChild(btnPng);
      }
      card.appendChild(btnContainer);
      return card;
    }
  
    // Popula o container com os cards de mídia
    async function populateMedia() {
      const urls = await getMediaUrls();
      mediaContainer.innerHTML = '';
      if (urls.length === 0) {
        mediaContainer.textContent = "Nenhuma mídia encontrada.";
      }
      urls.forEach(url => {
        const card = createMediaCard(url);
        mediaContainer.appendChild(card);
      });
    }
  
    // Botão para download de todos os itens (usando a opção "original")
    document.getElementById('download-all').onclick = async () => {
      const urls = await getMediaUrls();
      urls.forEach(url => downloadMedia(url, "original"));
    };
  
    populateMedia();
  });
  