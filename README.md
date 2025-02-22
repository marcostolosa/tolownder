# Tolownder Pro

**Tolownder Pro** é uma extensão para o Google Chrome que permite detectar e baixar imagens e vídeos de qualquer página da web com facilidade. 

## Recursos Principais

- **Detecção Avançada de Mídia**: Extrai URLs de imagens e vídeos do DOM (elementos `<img>`, `<video>`, `<source>`), estilos CSS (`background-image`) e requisições de rede (`webRequest`).
- **Contagem no Ícone**: Exibe o número total de imagens detectadas na página diretamente no ícone da extensão via badge.
- **Interface Premium**: Popup elegante com miniaturas, URLs e opções de download, projetado com um estilo refinado.
- **Suporte a Base64**: Identifica imagens embutidas (ex.: `data:image/svg+xml`), exibe miniaturas e permite conversão para JPG ao baixar.
- **Download Flexível**: Baixe arquivos individualmente ou em massa com o botão "Download All".
- **Monitoramento Dinâmico**: Detecta mídia adicionada após o carregamento inicial da página com `MutationObserver`.

## Como Funciona

### Estrutura da Extensão
A extensão é composta por cinco arquivos principais:

1. **`manifest.json`**:
   - Define a configuração da extensão, permissões (`activeTab`, `webRequest`, `downloads`, `storage`), e registra os scripts e popup.
   - Usa `manifest_version: 3` para compatibilidade com os padrões atuais do Chrome.

2. **`background.js`**:
   - Executa como um service worker, interceptando requisições de rede com `chrome.webRequest` para capturar URLs de mídia dinâmicas (ex.: `.jpg`, `.mp4`, `.m3u8`).
   - Mantém uma lista consolidada de URLs (`mediaUrls`) e atualiza o badge com a contagem de imagens via `chrome.action.setBadgeText`.

3. **`content.js`**:
   - Injetado em todas as páginas (`<all_urls>`), analisa o DOM para extrair URLs de mídia de elementos visíveis e invisíveis.
   - Usa `MutationObserver` para detectar mudanças dinâmicas (ex.: imagens carregadas via JavaScript).
   - Calcula a contagem de imagens únicas e envia ao `background.js` para o badge.

4. **`popup.html`**:
   - Interface do usuário com design premium, incluindo uma lista de mídia com miniaturas, URLs abreviadas e botões de download.
   - Estilizado com fontes modernas (`SF Pro Display`), cores sutis e sombras suaves, refletindo um visual de alta qualidade.

5. **`popup.js`**:
   - Gerencia o popup, combinando URLs do `content.js` e `background.js`, exibindo apenas imagens únicas.
   - Oferece opções de download normal e conversão de imagens Base64 para JPG usando `<canvas>`.

### Fluxo de Funcionamento
1. **Ao carregar uma página**:
   - O `content.js` analisa o DOM inicial e envia URLs de mídia ao `background.js`.
   - O `background.js` escuta requisições de rede e adiciona URLs adicionais detectadas.
   - A contagem de imagens únicas é enviada ao badge no ícone.

2. **Mudanças dinâmicas**:
   - O `MutationObserver` no `content.js` detecta novas imagens ou vídeos adicionados ao DOM e atualiza a contagem e a lista de URLs.

3. **Ao abrir o popup**:
   - O `popup.js` solicita URLs do `content.js` (DOM) e do `background.js` (rede), combina-as em uma lista única e filtra apenas imagens.
   - Cada imagem é exibida com miniatura, URL abreviada e botões de download ("Download" e "As JPG" para Base64).

4. **Download**:
   - Botão "Download": Faz o download direto da URL original.
   - Botão "As JPG": Converte imagens Base64 para JPG usando `<canvas>` e baixa como Blob.
   - Botão "Download All": Baixa todas as URLs listadas em sequência.

## Instalação

1. **Clone o Repositório**:
- git clone https://github.com/marcostolosa/tolownder.git
- cd tolownder

2. **Carregue no Chrome**:
- Abra o Chrome e vá para `chrome://extensions/`.
- Ative o "Modo de desenvolvedor" no canto superior direito.
- Clique em "Carregar sem compactação" e selecione a pasta do repositório.

3. **Verifique os Ícones**:
- Certifique-se de que a pasta `icons` contém `icon16.png`, `icon48.png` e `icon128.png`. Caso contrário, crie ícones simples ou use placeholders.

4. **Teste**:
- Navegue até uma página com imagens ou vídeos (ex.: LinkedIn, YouTube) e clique no ícone da extensão para abrir o popup.

## Uso

- **Contagem no Ícone**: Ao visitar uma página, o número no ícone (badge vermelho) indica quantas imagens foram detectadas.
- **Abrir o Popup**: Clique no ícone da extensão para ver a lista de imagens com miniaturas.
- **Baixar Individualmente**:
- Clique em "Download" para baixar a imagem no formato original.
- Para imagens Base64 (ex.: SVG), clique em "As JPG" para convertê-las para JPG.
- **Baixar Tudo**: Clique em "Download All" para baixar todas as imagens listadas.

## Requisitos
- Google Chrome (versão compatível com `manifest_version: 3`).
- Permissões de acesso a todas as URLs (`<all_urls>`).

## Contribuição
Sinta-se à vontade para abrir issues ou pull requests no repositório. 

---

**Tolownder Pro** — Simplicidade, poder e elegância em uma extensão.