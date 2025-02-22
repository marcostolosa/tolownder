document.addEventListener('DOMContentLoaded', async () => {
    const mediaList = document.getElementById('media-list');
  
    // Verifica se a URL é de imagem
    function isImageUrl(url) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      return (
        imageExtensions.some(ext => url.toLowerCase().endsWith(ext)) ||
        url.startsWith('data:image/')
      );
    }
  
    // Verifica se a imagem está em formato base64
    function isBase64Image(url) {
      return url.startsWith('data:image/');
    }
  
    // Função assíncrona para obter as URLs de mídia via messaging
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
        const allUrls = [...new Set([...contentUrls, ...backgroundUrls])].filter(url => isImageUrl(url));
        return allUrls;
      } catch (error) {
        console.error("Erro ao obter URLs de mídia:", error);
        return [];
      }
    }
  
    // Atualiza a listagem de mídia no popup
    function populateMediaList(urls) {
      mediaList.innerHTML = '';
      urls.forEach(url => {
        const li = document.createElement('li');
        li.dataset.url = url;
  
        if (isImageUrl(url)) {
          const thumbnail = document.createElement('img');
          thumbnail.className = 'thumbnail';
          thumbnail.src = url;
          thumbnail.alt = 'Miniatura';
          li.appendChild(thumbnail);
        }
  
        const urlSpan = document.createElement('span');
        urlSpan.className = 'url';
        urlSpan.textContent = url.slice(0, 30) + (url.length > 30 ? '...' : '');
        li.appendChild(urlSpan);
  
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download';
        downloadBtn.onclick = () => downloadMedia(url, false);
        li.appendChild(downloadBtn);
  
        if (isBase64Image(url)) {
          const downloadJpgBtn = document.createElement('button');
          downloadJpgBtn.textContent = 'As JPG';
          downloadJpgBtn.className = 'secondary';
          downloadJpgBtn.onclick = () => downloadMedia(url, true);
          li.appendChild(downloadJpgBtn);
        }
  
        mediaList.appendChild(li);
      });
    }
  
    // Inicializa a listagem de mídia
    async function init() {
      const urls = await getMediaUrls();
      populateMediaList(urls);
    }
  
    // Função para download de mídia com conversão opcional
    function downloadMedia(url, convertToJpg = false) {
      if (convertToJpg && isBase64Image(url)) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const blob = dataURLtoBlob(jpgDataUrl);
          const blobUrl = URL.createObjectURL(blob);
          chrome.downloads.download({
            url: blobUrl,
            filename: 'image.jpg'
          }, () => {
            if (chrome.runtime.lastError) {
              console.error("Erro no download:", chrome.runtime.lastError);
            }
            URL.revokeObjectURL(blobUrl);
          });
        };
        img.src = url;
      } else {
        chrome.downloads.download({ url }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("Erro no download:", chrome.runtime.lastError);
          }
        });
      }
    }
  
    // Converte dataURL para Blob
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
  
    // Inicializa a interface
    init();
  
    // Botão para download de todos os itens
    document.getElementById('download-all').onclick = async () => {
      try {
        const urls = await getMediaUrls();
        urls.forEach(url => downloadMedia(url, false));
      } catch (error) {
        console.error("Erro ao baixar todas as mídias:", error);
      }
    };
  });
  