document.addEventListener('DOMContentLoaded', () => {
    const mediaList = document.getElementById('media-list');
  
    function isImageUrl(url) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      return (
        imageExtensions.some(ext => url.toLowerCase().endsWith(ext)) ||
        url.startsWith('data:image/')
      );
    }
  
    function isBase64Image(url) {
      return url.startsWith('data:image/');
    }
  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_MEDIA' }, (response) => {
        if (response && response.urls) {
          populateMediaList(response.urls);
        }
      });
  
      chrome.runtime.sendMessage({ type: 'GET_ALL_MEDIA' }, (response) => {
        if (response && response.urls) {
          populateMediaList(response.urls);
        }
      });
    });
  
    function populateMediaList(urls) {
      urls.forEach(url => {
        if (!document.querySelector(`li[data-url="${url}"]`)) {
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
        }
      });
    }
  
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
            URL.revokeObjectURL(blobUrl);
          });
        };
        img.src = url;
      } else {
        chrome.downloads.download({ url }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
          }
        });
      }
    }
  
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
  
    document.getElementById('download-all').onclick = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_MEDIA' }, (response) => {
          if (response && response.urls) {
            response.urls.forEach(url => downloadMedia(url, false));
          }
        });
        chrome.runtime.sendMessage({ type: 'GET_ALL_MEDIA' }, (response) => {
          if (response && response.urls) {
            response.urls.forEach(url => downloadMedia(url, false));
          }
        });
      });
    };
  });