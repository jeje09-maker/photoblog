/* ?? app.js ??photoBlog Core Controller (Gemini API & WebP Converter) ?? */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. ?곹깭 諛??꾩뿭 蹂??珥덇린??  // ==========================================
  let apiKey = localStorage.getItem('photoblog_api_key') || '';
  let selectedModel = localStorage.getItem('photoblog_model') || 'gemini-3.1-pro-preview';
  if (selectedModel.includes('1.5') || selectedModel === 'gemini-2.5-pro' || selectedModel === 'gemini-2.0-flash' || selectedModel === 'gemini-3-pro-preview') {
    selectedModel = 'gemini-3.1-pro-preview';
    localStorage.setItem('photoblog_model', 'gemini-3.1-pro-preview');
  }
  let uploadedFiles = []; // Array of { name, type, base64, previewUrl }
  
  let currentCategory = 'restaurant'; // 'restaurant' | 'cafe' | 'travel' | 'tech' | ...
  let categoryEngineMap = JSON.parse(localStorage.getItem('photoblog_cat_engines') || '{}');
  
  let generatedTitle = '';
  let generatedBody = '';
  let generatedSeoTitles = [];
  let generatedSeoKeywords = [];
  let activeDemoPreset = null; // 'paris' | 'orangery'

  // DOM Elements
  const navbar = document.getElementById('navbar');
  const cursorGlow = document.getElementById('cursorGlow');
  
  // File Upload Elements
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const previewContainer = document.getElementById('previewContainer');
  const previewGrid = document.getElementById('previewGrid');
  const btnClearPhotos = document.getElementById('btnClearPhotos');
  
  // Meta Info Inputs & Reference Document
  const inputSubject = document.getElementById('inputSubject');
  const inputDate = document.getElementById('inputDate');
  const inputDesc = document.getElementById('inputDesc');
  const inputArticle = document.getElementById('inputArticle');
  const fileInputDoc = document.getElementById('fileInputDoc');
  // Options
  const selectBlogTone = document.getElementById('selectBlogTone');
  const selectCategoryEngine = document.getElementById('selectCategoryEngine');
  
  // Category Buttons
  const mainCategoryTabs = document.getElementById('mainCategoryTabs');
  
  // Generator & Output Viewers
  const btnGenerate = document.getElementById('btnGenerate');
  const outputPlaceholder = document.getElementById('outputPlaceholder');
  const outputLoading = document.getElementById('outputLoading');
  const outputContent = document.getElementById('outputContent');
  const progressBar = document.getElementById('progressBar');
  const loadingStatus = document.getElementById('loadingStatus');
  const articleMetaInfo = document.getElementById('articleMetaInfo');
  const articleTitle = document.getElementById('articleTitle');
  const articleBody = document.getElementById('articleBody');
  const seoResultsCard = document.getElementById('seoResultsCard');
  const seoTitleList = document.getElementById('seoTitleList');
  const seoKeywordGrid = document.getElementById('seoKeywordGrid');
  const btnSendToNaver = document.getElementById('btnSendToNaver');
  const btnCopyHtml = document.getElementById('btnCopyHtml');
  const btnCopyText = document.getElementById('btnCopyText');
  
  // Modals
  const settingsModal = document.getElementById('settingsModal');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const btnResetSettings = document.getElementById('btnResetSettings');
  const settingsApiKey = document.getElementById('settingsApiKey');
  const mainApiKey = document.getElementById('mainApiKey');
  const settingsModel = document.getElementById('settingsModel');
  const btnTogglePw = document.getElementById('btnTogglePw');
  const settingsStatusBox = document.getElementById('settingsStatusBox');
  
  const naverEditorModal = document.getElementById('naverEditorModal');
  const btnCloseNaverEditor = document.getElementById('btnCloseNaverEditor');
  const naverTitleInput = document.getElementById('naverTitleInput');
  const naverBodyArea = document.getElementById('naverBodyArea');
  const btnStartInject = document.getElementById('btnStartInject');
  const btnNaverPublish = document.getElementById('btnNaverPublish');
  const btnNaverSave = document.getElementById('btnNaverSave');
  
  const compareModal = document.getElementById('compareModal');
  const btnShowCompare = document.getElementById('btnShowCompare');
  const btnCloseCompare = document.getElementById('btnCloseCompare');
  const btnConfirmCompare = document.getElementById('btnConfirmCompare');
  
  const faqModal = document.getElementById('faqModal');
  const btnShowFaq = document.getElementById('btnShowFaq');
  const btnCloseFaq = document.getElementById('btnCloseFaq');
  const btnConfirmFaq = document.getElementById('btnConfirmFaq');
  
  const toast = document.getElementById('toast');
  const inputKeywords = document.getElementById('inputKeywords') || document.createElement('input');
  const keywordTags = document.getElementById('keywordTags') || document.createElement('div');
  const btnExtractKeywords = document.getElementById('btnExtractKeywords') || document.createElement('button');

  // Set default date to today
  const today = new Date().toISOString().substring(0, 10);
  inputDate.value = today;

  // ==========================================
  // 2. CURSOR GLOW EFFECT (留덉슦??愿묒썝 ?좊땲硫붿씠??
  // ==========================================
  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  function animateCursor() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    if (cursorGlow) {
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
    }
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // ==========================================
  // 3. TOAST & MODAL CONTROLS
  // ==========================================
  function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, duration);
  }

  function openModal(modal) {
    modal.classList.add('active');
  }

  function closeModal(modal) {
    modal.classList.remove('active');
  }

  // Settings Modal Events
  btnOpenSettings.addEventListener('click', () => {
    settingsApiKey.value = apiKey;
    settingsModel.value = selectedModel;
    updateSettingsStatus();
    openModal(settingsModal);
  });
  
  btnCloseSettings.addEventListener('click', () => closeModal(settingsModal));
  
  btnSaveSettings.addEventListener('click', () => {
    apiKey = settingsApiKey.value.trim();
    selectedModel = settingsModel.value;
    localStorage.setItem('photoblog_api_key', apiKey);
    localStorage.setItem('photoblog_model', selectedModel);
    updateSettingsStatus();
    closeModal(settingsModal);
    showToast('Gemini API ?ㅼ젙????λ릺?덉뒿?덈떎.');
  });

  btnResetSettings.addEventListener('click', () => {
    settingsApiKey.value = '';
    settingsModel.value = 'gemini-3.1-pro-preview';
    apiKey = '';
    selectedModel = 'gemini-3.1-pro-preview';
    localStorage.removeItem('photoblog_api_key');
    localStorage.removeItem('photoblog_model');
    updateSettingsStatus();
    showToast('?ㅼ젙??珥덇린?붾릺?덉뒿?덈떎.');
  });

  btnTogglePw.addEventListener('click', () => {
    const isPw = settingsApiKey.type === 'password';
    settingsApiKey.type = isPw ? 'text' : 'password';
    btnTogglePw.innerHTML = isPw 
      ? `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
           <line x1="1" y1="1" x2="23" y2="23"></line>
         </svg>`
      : `<svg class="icon-svg eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
           <circle cx="12" cy="12" r="3"></circle>
         </svg>`;
  });

  function updateSettingsStatus() {
    const dot = settingsStatusBox.querySelector('.status-dot');
    const text = settingsStatusBox.querySelector('.status-text');
    if (apiKey) {
      dot.className = 'status-dot status-online';
      text.textContent = 'API ?⑤씪???곌껐 ?곹깭';
    } else {
      dot.className = 'status-dot status-offline';
      text.textContent = '濡쒖뺄 ?곕え(泥댄뿕) 紐⑤뱶濡??쒖꽦???곹깭';
    }
  }

  // Auto load Gemini API Key from `.env` fetched locally
  async function loadEnvApiKey() {
    try {
      const response = await fetch('/.env');
      if (response.ok) {
        const text = await response.text();
        const match = text.match(/GEMINI_API_KEY\s*=\s*([^\s#\r\n]+)/);
        if (match && match[1]) {
          apiKey = match[1];
          localStorage.setItem('photoblog_api_key', apiKey);
          updateSettingsStatus();
          showToast('.env ?뚯씪?먯꽌 Gemini API Key瑜?濡쒕뱶?덉뒿?덈떎.', 3000);
        }
      }
    } catch (e) {
      console.warn('Could not auto-load key from .env:', e);
    }
  }
  loadEnvApiKey();

  // Compare Modal Events
  btnShowCompare.addEventListener('click', () => openModal(compareModal));
  btnCloseCompare.addEventListener('click', () => closeModal(compareModal));
  btnConfirmCompare.addEventListener('click', () => closeModal(compareModal));
  
  // FAQ Modal Events
  btnShowFaq.addEventListener('click', () => openModal(faqModal));
  btnCloseFaq.addEventListener('click', () => closeModal(faqModal));
  btnConfirmFaq.addEventListener('click', () => closeModal(faqModal));

  // FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all first
      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-answer').style.maxHeight = null;
      });
      
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Close modals when clicking outside card
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal(e.target);
    }
  });

  // ==========================================
  // 4. IMAGE UPLOAD & WebP CONVERTER
  // ==========================================
  
  // Client-side WebP conversion utilizing HTML5 Canvas
  function convertToWebp(file) {
    return new Promise((resolve, reject) => {
      const originalSize = file.size; // ?먮낯 ?뚯씪 諛붿씠???ш린 ???      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Image size scaling limit for token and network performance (max 1200px)
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Output WebP data URL with 0.85 compression quality
          const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
          const base64Data = webpDataUrl.split(',')[1];
          
          // WebP base64 ?곗씠?곗쓽 ?ㅼ젣 諛붿씠???ш린 怨꾩궛
          const webpSize = Math.round((base64Data.length * 3) / 4);
          const compressionRate = originalSize > 0 ? Math.round((1 - webpSize / originalSize) * 100) : 0;
          
          resolve({
            name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
            type: 'image/webp',
            base64: base64Data,
            previewUrl: webpDataUrl,
            originalSize: originalSize,
            webpSize: webpSize,
            compressionRate: Math.max(0, compressionRate)
          });
        };
        img.onerror = () => reject(new Error('Image load failed.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('File reading failed.'));
      reader.readAsDataURL(file);
    });
  }

  // comment
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
    }, false);
  });

  uploadZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  });

  function handleFiles(files) {
    if (files.length === 0) return;
    activeDemoPreset = null; // Clear preset state on manual upload

    const fileArray = Array.from(files);
    const validFiles = [];
    const invalidFiles = [];
    
    fileArray.forEach(f => {
      if (f.type.startsWith('image/')) {
        validFiles.push(f);
      } else {
        invalidFiles.push(f);
      }
    });

    if (invalidFiles.length > 0) {
      showToast(`지원되지 않는 파일(동영상, 문서 등) ${invalidFiles.length}개는 제외되었습니다.`, 5000);
    }

    const totalCount = validFiles.length;
    if (totalCount === 0) return;

    let processedCount = 0;
    showToast(`${totalCount}장의 이미지를 WebP로 변환 중...`);

    validFiles.forEach(file => {
      const placeholder = {
        name: file.name,
        originalSize: file.size,
        webpSize: file.size, // 임시 표시
        previewUrl: URL.createObjectURL(file),
        isLoading: true
      };
      uploadedFiles.push(placeholder);

      // 비동기 WebP 변환
      convertToWebp(file).then(webpFile => {
        Object.assign(placeholder, webpFile);
        placeholder.isLoading = false;
        processedCount++;
        renderPreviews();
        if (processedCount === totalCount) {
          showToast(`모든 이미지(${totalCount}장) 변환 완료!`);
        }
      }).catch(err => {
        console.error(err);
        showToast(`'${file.name}' 변환 중 오류가 발생했습니다.`, 5000);
        const idx = uploadedFiles.indexOf(placeholder);
        if (idx !== -1) uploadedFiles.splice(idx, 1);
        renderPreviews();
      });
    });

    renderPreviews();
  }

  function renderPreviews() {
    previewGrid.innerHTML = '';
    if (uploadedFiles.length > 0) {
      previewContainer.classList.remove('hidden');

      // ?꾩껜 ?⑸웾 ?붿빟 ?쒖떆
      const totalOriginal = uploadedFiles.reduce((sum, f) => sum + (f.originalSize || 0), 0);
      const totalWebp = uploadedFiles.reduce((sum, f) => sum + (f.webpSize || 0), 0);
      const totalRate = totalOriginal > 0 ? Math.max(0, Math.round((1 - totalWebp / totalOriginal) * 100)) : 0;

      // ?붿빟 諛곕꼫 ?앹꽦 (湲곗〈 ?붿냼媛 ?덉쑝硫??ъ깮??
      let summaryEl = previewContainer.querySelector('.preview-summary');
      if (!summaryEl) {
        summaryEl = document.createElement('div');
        summaryEl.className = 'preview-summary';
        previewContainer.insertBefore(summaryEl, previewGrid);
      }
      if (totalOriginal > 0) {
        summaryEl.innerHTML = `
          <span class="summary-count">${uploadedFiles.length}장 업로드</span>
          <span class="summary-size">${formatFileSize(totalOriginal)} → ${formatFileSize(totalWebp)}</span>
          <span class="summary-rate">-${totalRate}% 절감</span>
        `;
      } else {
        summaryEl.innerHTML = `<span class="summary-count">${uploadedFiles.length}장 업로드</span>`;
      }

      uploadedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.draggable = true;
        const sizeInfo = file.isLoading 
          ? '변환 중...' 
          : (file.originalSize ? `${formatFileSize(file.webpSize)}` : '');
        item.innerHTML = `
          <img src="${file.previewUrl}" alt="${file.name}">
          <button class="preview-remove" data-index="${index}">&times;</button>
          <div class="preview-badges">
            <span class="webp-badge">WebP</span>
            ${sizeInfo ? `<span class="size-badge">${sizeInfo}</span>` : ''}
          </div>
        `;

        // Drag and drop events for reordering
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', index);
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => item.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          previewGrid.querySelectorAll('.preview-item').forEach(el => el.classList.remove('drag-over'));
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          item.classList.add('drag-over');
        });

        item.addEventListener('dragleave', () => {
          item.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.classList.remove('drag-over');
          const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
          if (draggedIndex === index || isNaN(draggedIndex)) return;

          // Reorder the array
          let dropIndex = index;
          if (draggedIndex < dropIndex) {
            dropIndex--;
          }
          const draggedItem = uploadedFiles.splice(draggedIndex, 1)[0];
          uploadedFiles.splice(dropIndex, 0, draggedItem);
          
          renderPreviews();
        });

        previewGrid.appendChild(item);
      });
      
      // Add remove events
      previewGrid.querySelectorAll('.preview-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          uploadedFiles.splice(idx, 1);
          renderPreviews();
          if (uploadedFiles.length === 0) {
            activeDemoPreset = null;
          }
        });
      });
    } else {
      previewContainer.classList.add('hidden');
    }
  }

  btnClearPhotos.addEventListener('click', (e) => {
    e.preventDefault();
    uploadedFiles = [];
    activeDemoPreset = null;
    renderPreviews();
    showToast('?ъ쭊??紐⑤몢 ??젣?섏뿀?듬땲??');
  });

  // ==========================================
  // 5. SEO KEYWORDS TAGS
  // ==========================================
  let keywordsList = [];

  inputKeywords.addEventListener('keydown', (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addKeywordFromInput();
    }
  });

  inputKeywords.addEventListener('blur', () => {
    addKeywordFromInput();
  });

  function addKeywordFromInput() {
    const val = inputKeywords.value.trim().replace(/,/g, '');
    if (val && !keywordsList.includes(val)) {
      keywordsList.push(val);
      renderKeywordTags();
    }
    inputKeywords.value = '';
  }

  function renderKeywordTags() {
    keywordTags.innerHTML = '';
    keywordsList.forEach((kw, index) => {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag';
      tag.innerHTML = `
        #${kw}
        <button class="keyword-tag-remove" data-index="${index}">&times;</button>
      `;
      keywordTags.appendChild(tag);
    });

    keywordTags.querySelectorAll('.keyword-tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        keywordsList.splice(idx, 1);
        renderKeywordTags();
      });
    });
  }

  // AI Keyword extraction action
  btnExtractKeywords.addEventListener('click', async () => {
    if (uploadedFiles.length === 0 && !activeDemoPreset) {
      showToast('遺꾩꽍???ъ쭊??理쒖냼 1???낅줈?쒗븯嫄곕굹 ?곕え ?쒕굹由ъ삤瑜??좏깮?댁＜?몄슂.');
      return;
    }

    btnExtractKeywords.disabled = true;
    btnExtractKeywords.textContent = '異붿텧 以?..';

    const parisKeywords = ['파리여행', '에펠탑야경', '프랑스감성여행', '에펠탑카페', '유럽자유여행'];
    const orangeryKeywords = ['파리오랑주리', '오랑주리미술관', '파리미술관', '파리여행코스', '미술관관람'];
    const genericKeywords = ['일상블로그', '데이트코스', '감성사진', '주말나들이', '분위기좋은곳'];

    // If using live API
    if (apiKey && uploadedFiles.length > 0) {
      try {
        const extracted = await fetchKeywordsFromGemini();
        if (extracted && extracted.length > 0) {
          keywordsList = [...new Set([...keywordsList, ...extracted])];
        } else {
          keywordsList = [...new Set([...keywordsList, ...genericKeywords])];
        }
      } catch (err) {
        console.error(err);
        showToast('API ?ㅻ쪟濡??명빐 湲곕낯 ?ㅼ썙?쒕? 濡쒕뱶?⑸땲??');
        keywordsList = [...new Set([...keywordsList, ...genericKeywords])];
      }
    } else {
      // Demo mock delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      let demoKws = genericKeywords;
      if (activeDemoPreset === 'paris' || inputSubject.value.includes('?뚮━') || inputSubject.value.includes('?먰렆')) {
        demoKws = parisKeywords;
      } else if (activeDemoPreset === 'orangery' || inputSubject.value.includes('?ㅻ옉二쇰━') || inputSubject.value.includes('?뚯＜')) {
        demoKws = orangeryKeywords;
      }
      keywordsList = [...new Set([...keywordsList, ...demoKws])];
    }

    renderKeywordTags();
    btnExtractKeywords.disabled = false;
    btnExtractKeywords.textContent = 'AI ?ㅼ썙??異붿텧';
    showToast('AI ?ㅼ썙??異붿텧???꾨즺?섏뿀?듬땲??');
  });

  // ==========================================
  // 6. DEMO PRESETS LOADING (WebP Convert Supported)
  // ==========================================
  async function loadPresetImageToBase64(url, name) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], name, { type: blob.type });
      // Force conversion to webp layout
      return await convertToWebp(file);
    } catch (e) {
      console.error('Failed to convert preset image to WebP base64:', e);
      return {
        name: name.replace(/\.[^/.]+$/, "") + ".webp",
        type: 'image/webp',
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        previewUrl: url
      };
    }
  }

  presetParis.addEventListener('click', async () => {
    activeDemoPreset = 'paris';
    presetParis.classList.add('active');
    presetOrangery.classList.remove('active');
    
    inputSubject.value = '?꾨옉???뚮━ ?먰렆??媛먯꽦 ?ы뻾';
    inputDate.value = '2026-06-15';
    inputDesc.value = '?먰렆??洹쇱쿂 怨⑤ぉ 移댄럹?먯꽌 留쏆엳???먯뒪?꾨젅?????? ?몄쓣??吏?臾대졄 遺됯쾶 臾쇰뱾?닿????먰렆???꾨쭩??媛??源딆씠 ?⑤뒗 媛먮룞怨???쭔?곸씤 諛ㅼ씠?덉쓬.';
    keywordsList = ['파리여행', '에펠탑야경', '프랑스감성'];
    renderKeywordTags();

    uploadedFiles = [];
    renderPreviews();
    
    showToast('?뚮━ ?먰렆???꾨━???대?吏 濡쒕뵫 諛?WebP 蹂??以?..');
    const fileObj = await loadPresetImageToBase64('assets/paris_travel.png', 'paris_travel.png');
    uploadedFiles.push(fileObj);
    renderPreviews();
    showToast('?뚮━ ?먰렆??WebP 蹂??諛??꾨━???곗씠??濡쒕뱶 ?꾨즺!');
  });

  presetOrangery.addEventListener('click', async () => {
    activeDemoPreset = 'orangery';
    presetOrangery.classList.add('active');
    presetParis.classList.remove('active');

    inputSubject.value = '?뚯＜ ?ㅻ옉二쇰━ ?앸Ъ??移댄럹';
    inputDate.value = '2026-07-10';
    inputDesc.value = '?⑥떎??洹몃?濡??듭㎏濡???꺼?볦? ??븳 嫄곕????앸Ъ??移댄럹. ?대????곌굅吏?珥덈줉 ?앸Ъ?ㅺ낵 議몄「 ?먮Ⅴ???곕せ, 洹몃━怨??쒓렇?덉쿂 ?ㅻ젋吏 ?먯씠?쒓? 泥?웾?섍퀬 ?먮쭅 媛?앺뻽??';
    keywordsList = ['파리오랑주리', '식물원카페', '파리여행'];
    renderKeywordTags();

    uploadedFiles = [];
    renderPreviews();

    showToast('?ㅻ옉二쇰━ 移댄럹 ?꾨━???대?吏 濡쒕뵫 諛?WebP 蹂??以?..');
    const fileObj = await loadPresetImageToBase64('assets/orangery_cafe.png', 'orangery_cafe.png');
    uploadedFiles.push(fileObj);
    renderPreviews();
    showToast('?ㅻ옉二쇰━ 移댄럹 WebP 蹂??諛??꾨━???곗씠??濡쒕뱶 ?꾨즺!');
  });

  // ==========================================
  // 7. TAB & OPTIONS EVENT LISTENERS (Unified)
  // ==========================================
  if (fileInputDoc) {
    fileInputDoc.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        inputArticle.value = evt.target.result;
        showToast(`'${file.name}' 李멸퀬 臾몄꽌 ?댁슜???띿뒪???곸뿭???먮룞 遺숈뿬?ｊ린 ?섏뿀?듬땲??`);
      };
      reader.onerror = () => {
        showToast('臾몄꽌 ?뚯씪???쎈뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
      };
      reader.readAsText(file);
    });
  }

  const catTabs = document.querySelectorAll('.category-tab');
  catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      
      // 移댄뀒怨좊━蹂???λ맂 紐⑤뜽???덉쑝硫??숆린?? ?놁쑝硫?湲곕낯 紐⑤뜽 ?곸슜
      if (categoryEngineMap[currentCategory]) {
        selectCategoryEngine.value = categoryEngineMap[currentCategory];
      } else {
        selectCategoryEngine.value = selectedModel || 'gemini-3.1-pro-preview';
      }
      showToast(`[${tab.textContent.trim()}] 移댄뀒怨좊━ 諛?留욎땄 AI ?붿쭊???좏깮?섏뿀?듬땲??`);
    });
  });

  if (selectCategoryEngine) {
    selectCategoryEngine.addEventListener('change', () => {
      categoryEngineMap[currentCategory] = selectCategoryEngine.value;
      localStorage.setItem('photoblog_cat_engines', JSON.stringify(categoryEngineMap));
      showToast(`[${currentCategory}] 移댄뀒怨좊━ ?붿쭊??'${selectCategoryEngine.value}'(??濡?吏?뺣릺?덉뒿?덈떎.`);
    });
  }

  function updateOutputActionButtons() {
    if (outputContent.classList.contains('hidden')) return;
    // 紐⑤뱺 ?≪뀡 踰꾪듉(?띿뒪??蹂듭궗, HTML 蹂듭궗, ?ㅼ씠踰??먮뵒???꾩넚)????긽 ?좎뿰?섍쾶 ?쒓났
    if (btnCopyText) btnCopyText.classList.remove('hidden');
    if (btnCopyHtml) btnCopyHtml.classList.remove('hidden');
    if (btnSendToNaver) btnSendToNaver.classList.remove('hidden');
  }

  // ==========================================
  // 8. GEMINI API GENERATION ENGINE
  // ==========================================
  async function fetchKeywordsFromGemini() {
    const payload = {
      contents: [
        {
          parts: [
            { text: `?ㅼ쓬 釉붾줈洹?湲 ?뺣낫? 泥⑤????ъ쭊?ㅼ쓣 湲곕컲?쇰줈, 寃???붿쭊 理쒖쟻??SEO) 諛??ㅼ씠踰??곌? 寃?됱뿉 ???≫옄 ???덈뒗 ?⑥뼱 ?꾩＜???듭떖 ?쒓렇(?ㅼ썙??瑜?5媛쒕쭔 怨⑤씪 ?쒓? ?⑥뼱 ?뺥깭濡??쇳몴濡?援щ텇??異쒕젰?댁쨾. ?덉떆: ?뚯＜移댄럹,?앸Ъ?먯뭅???곗씠?몄퐫??二쇱젣: ${inputSubject.value}
異붽? 臾섏궗: ${inputDesc.value}` },
            ...uploadedFiles.map(f => ({
              inlineData: {
                mimeType: f.type,
                data: f.base64
              }
            }))
          ]
        }
      ]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error ? errData.error.message : 'API Request Failed';
      throw new Error(`[援ш? API ?먮윭] ${response.status}: ${errMsg}`);
    }
    
    const data = await response.json();
    const txt = data.candidates[0].content.parts[0].text.trim();
    return txt.split(',').map(s => s.trim().replace(/#/g, '')).filter(Boolean);
  }

  btnGenerate.addEventListener('click', async () => {
    if (uploadedFiles.length === 0 && !activeDemoPreset) {
      showToast('釉붾줈洹?湲???묒꽦?섎젮硫?理쒖냼 1?μ쓽 ?ъ쭊???낅줈?쒗빐二쇱꽭??');
      return;
    }
    if (!inputSubject.value.trim()) {
      showToast('釉붾줈洹?湲??二쇱젣 ?먮뒗 ?μ냼紐낆쓣 ?낅젰?댁＜?몄슂.');
      return;
    }

    outputPlaceholder.classList.add('hidden');
    outputContent.classList.add('hidden');
    outputLoading.classList.remove('hidden');
    btnGenerate.disabled = true;

    let progress = 0;
    progressBar.style.width = '0%';
    const progressInterval = setInterval(() => {
      progress += (100 - progress) * 0.1;
      progressBar.style.width = `${Math.min(progress, 95)}%`;
      
      if (progress < 30) {
        loadingStatus.textContent = 'Gemini Vision 멀티모달 모델이 사진 WebP 데이터를 분석 중입니다...';
      } else if (progress < 60) {
        loadingStatus.textContent = '사진 내 매장 레이아웃, 조명, 색상 요소를 추출하고 있습니다...';
      } else if (progress < 85) {
        loadingStatus.textContent = '선택한 블로그 최적화 템플릿과 프롬프트를 통합하여 원고를 설계하고 있습니다...';
      } else {
        loadingStatus.textContent = 'SEO 최적화 검증 및 문체 다듬기 작업을 마무리하는 중입니다...';
      }
    }, 350);

    try {
      if (apiKey) {
        const result = await generateBlogWithGemini();
        generatedTitle = result.title;
        generatedBody = result.body;
        generatedSeoTitles = result.seoTitles || [];
        generatedSeoKeywords = result.seoKeywords || [];
      } else {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const demoResult = generateLocalDemoContent();
        generatedTitle = demoResult.title;
        generatedBody = demoResult.body;
        generatedSeoTitles = demoResult.seoTitles || [];
        generatedSeoKeywords = demoResult.seoKeywords || [];
      }

      clearInterval(progressInterval);
      progressBar.style.width = '100%';
      loadingStatus.textContent = '생성 완료!';

      setTimeout(() => {
        outputLoading.classList.add('hidden');
        renderGeneratedOutput();
        btnGenerate.disabled = false;
        showToast('釉붾줈洹??ъ뒪?멸? ?깃났?곸쑝濡??앹꽦?섏뿀?듬땲??');
      }, 500);

    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      outputLoading.classList.add('hidden');
      outputPlaceholder.classList.remove('hidden');
      btnGenerate.disabled = false;
      showToast(`湲 ?앹꽦 ?먮윭: ${error.message}`, 6000);
    }
  });

  async function generateBlogWithGemini() {
    // 移댄뀒怨좊━ ?쒓?紐?留ㅽ븨
    const categoryMap = {
      restaurant: '맛집/푸드',
      cafe: '카페/디저트',
      travel: '여행/관광',
      tech: 'IT/테크/가전',
      fashion: '패션/뷰티',
      living: '리빙/인테리어',
      parenting: '육아/교육',
      review: '도서/영화/리뷰',
      health: '건강/운동/헬스',
      finance: '경제/재테크/비즈',
      news: '시사/경제/정치'
    };
    const categoryName = categoryMap[currentCategory] || currentCategory;

    // 移댄뀒怨좊━蹂??뱁솕 ?댁“
    let categoryToneInstruction = '';
    switch (currentCategory) {
      case 'restaurant':
        categoryToneInstruction = '맛집/푸드 분야: 시각과 미각을 돋우는 군침 도는 묘사를 가득 담아내세요.';
    const humanizeRule = `[???대㉫ ?섎Ⅴ?뚮굹 ?꾩닔]: ?몄쐞?곸씤 AI 留먰닾(~寃껋쑝濡?異붿젙?⑸땲?? ~?⑸땲????湲곌퀎???댄닾)瑜??꾨꼍??踰꾨━?몄슂. ?ㅼ젣 ?щ엺???꾩옣?먯꽌 ?ㅺ컧???듯빐 ?먮? 媛먯젙, ?ㅼ닔?? ??쇱?, 吏꾩쭨 留뚯”?덈뜕 遺遺???'?대㉫ ?섎Ⅴ?뚮굹'瑜?200% ?댁븘?댁뼱 吏꾩쭨 ?щ엺????寃?媛숈? ?앸챸?μ쓣 遺덉뼱?ｌ쑝?몄슂.`;

    const dateRule = inputDate.value 
      ? `[??諛⑸Ц/寃쏀뿕 ?좎쭨 泥섎━]: ?낅젰???좎쭨??'${inputDate.value}'?낅땲?? ?? 湲???먮쫫 ???좎쭨媛 ?ш쾶 以묒슂?섏? ?딄굅??援녹씠 ?멸툒???꾩슂媛 ?녿뒗 二쇱젣?쇰㈃ ?듭?濡??좎쭨瑜??곗? 留먭퀬 ?먯뿰?ㅻ읇寃??앸왂?섏꽭??`
      : `[??諛⑸Ц/寃쏀뿕 ?좎쭨 泥섎━]: ?좎쭨媛 ?낅젰?섏? ?딆븯?쇰?濡??좎쭨 ?멸툒 ?놁씠 ?먯뿰?ㅻ읇寃?援ъ꽦?섏꽭??`;

    const descRule = inputDesc.value
      ? `[??吏곸젒 寃쏀뿕 / ?대㉫ ?섎Ⅴ?뚮굹 ?뷀뀒??(理쒖슦??諛섏쁺)]: """${inputDesc.value}"""\n???ъ슜?먯쓽 ?앹깮??吏곸젒 寃쏀뿕怨?媛먯긽 ?뷀뀒?쇱쓣 蹂몃Ц 怨녠납??媛???먯뿰?ㅻ읇怨?鍮꾩쨷 ?덇쾶 ?뱀뿬?댁뼱 由ъ뼹 ?꾧린濡??꾩꽦?섏꽭??`
      : '';

    const articleRule = inputArticle && inputArticle.value
      ? `[??李멸퀬 湲곗궗 ?먮Ц / 李몄“ 臾몄꽌 ?⑺듃 湲곕컲 ?묒꽦 (理쒖슦??諛섏쁺)]: """${inputArticle.value}"""\n??李멸퀬 湲곗궗 ?먮뒗 臾몄꽌???⑺듃? ?듭떖 ?뺣낫瑜??뺥솗??李몄“?섍퀬 ?몄슜?섏뿬 ?꾨Ц?곸씠怨??щ룄 ?덈뒗 湲濡??묒꽦?섏꽭?? ?덈? ?ъ떎???쒓끝?섍굅??吏?대궡吏 留덉꽭??`
      : '';

    const prompt = `?뱀떊? 援?궡 ?묓떚??釉붾줈洹??명뵆猷⑥뼵?쒖씠??SEO 肄섑뀗痢??꾨Ц媛?낅땲?? 泥⑤????대?吏?ㅺ낵 李멸퀬 ?먮즺, 洹몃━怨??ㅼ쓬 ?ㅼ젙媛믩뱾??留욎텛???ъ뒪?낆쓣 ?묒꽦?섏꽭??

[湲곕낯 ?ㅼ젙]
- 移댄뀒怨좊━ 遺꾩빞: ${categoryName} (${categoryToneInstruction})
- 怨듯넻 ??留ㅻ꼫 (留먰닾): ${toneInstruction}
- ?듭떖 二쇱젣 / ?μ냼 / ??? ${inputSubject.value || '泥⑤? ?ъ쭊 湲곕컲 ?먯뿰?ㅻ윭??二쇱젣'}

[?묒꽦 吏移?諛?吏?쒖궗??
1. 泥⑤????대?吏?ㅼ쓣 ?뺣??섍쾶 遺꾩꽍(Vision)?섏뿬 ?쇱궗泥댁쓽 ?됯컧, 吏덇컧, 遺꾩쐞湲? ?뷀뀒?쇱쓣 蹂몃Ц 以묎컙以묎컙???앹깮?섍쾶 臾섏궗?섏꽭??
2. ${dateRule}
3. ${descRule}
4. ${articleRule}
5. ${humanizeRule}
6. 蹂몃Ц ?댁슜怨?移댄뀒怨좊━???꾨꼍??遺?⑺븯???듭떖 寃???ㅼ썙??10媛쒕? ?ㅼ뒪濡?異붿텧?섍퀬, 蹂몃Ц 以묎컙以묎컙???먯뿰?ㅻ읇寃??뱀뿬?댁뼱 寃???붿쭊 ?몄텧 ?먯닔瑜?洹밸??뷀븯?몄슂.`;
        break;
      case 'finance':
        categoryToneInstruction = '寃쎌젣/?ы뀒??鍮꾩쫰?덉뒪 遺꾩빞: ?됱쿋?섍퀬 ?뺣낫 吏묒빟?곸씠硫??섏튂? ?몄궗?댄듃瑜?紐낇솗???뺣━?섎뒗 ?좊ː???댁“';
        break;
      case 'news':
        categoryToneInstruction = '?쒖궗/寃쎌젣/?뺤튂 遺꾩빞: 以묐┰?곸씠怨??⑺듃 以묒떖?곸씤 ?뺤쨷???됰줎 諛??댁뒪 ?됰줎媛 ?댁“';
        break;
      default:
        categoryToneInstruction = '?꾨Ц?곸씠怨??뺢컝??釉붾줈洹??명뵆猷⑥뼵???댁“';
    }

    // ??移댄뀒怨좊━ 怨듯넻 ??留ㅻ꼫 (釉붾줈洹?留먰닾) 100% 諛섏쁺
    let toneInstruction = '';
    const toneVal = selectBlogTone.value;
    switch (toneVal) {
      case 'emotional':
        toneInstruction = '?몄뒪? 媛먯꽦???곕쑜?섍퀬 媛먯꽦?곸씤 議대뙎留??쇱긽泥?(~?덈떟?덈떎, ~??寃?媛숈븘?????곗뒪???댁“)';
        break;
      case 'seo':
        toneInstruction = '?뺥솗???뺣낫 以묒떖 諛?寃?됱뼱 ?몄텧 媛以묒튂瑜??믪씠??媛앷????꾨Ц ?뺣낫泥?(?뚯젣紐?諛?遺덈┸ 由ъ뒪???곴레 ?쒖슜)';
        break;
      case 'friendly':
        toneInstruction = '?댁썐 釉붾줈嫄곕뱾怨???뷀븯???뚯냼?섍퀬 ?ㅼ젙?ㅺ컧???댁썐 ?뚰넻泥?(~異붿쿇???쒕젮??, ~?덈굹?? ??';
        break;
      case 'formal':
        toneInstruction = '源붾걫?섍퀬 ?좊ː媛먯쓣 二쇰뒗 ?뺤쨷??寃⑹떇 由щ럭泥?(~?⑸땲?? ~濡??먮떒?⑸땲????吏꾩쨷???댁“)';
        break;
      case 'humorous':
        toneInstruction = '?좎풄???좊㉧? ?ъ튂 ?섏튂??援ъ뼱泥?(?곸젅??諛덇낵 ?띾????대え吏 媛???ㅽ???';
        break;
      case 'casual_informal':
        toneInstruction = '?쇨린???곕벏 ?붿쭅?섍퀬 ?먯뿰?ㅻ윭???대룉?댁궛 ?쇨린泥?(~?덈떎, ~?????媛踰쇱슫 諛섎쭚/議대뙎留??쇱슜 ?낅갚泥?';
        break;
      default:
        toneInstruction = '?뺢컝?섍퀬 ?몄븞??釉붾줈洹??댁“';
    }

    let humanizeRule = '';
    if (chkHumanize.checked) {
      humanizeRule = `[???대㉫ ?섎Ⅴ?뚮굹 ?꾩닔]: ?몄쐞?곸씤 AI 留먰닾(~寃껋쑝濡?異붿젙?⑸땲?? ~?⑸땲????湲곌퀎???댄닾)瑜??꾨꼍??踰꾨━?몄슂. ?ㅼ젣 ?щ엺???꾩옣?먯꽌 ?ㅺ컧???듯빐 ?먮? 媛먯젙, ?ㅼ닔?? ??쇱?, 吏꾩쭨 留뚯”?덈뜕 遺遺???'?대㉫ ?섎Ⅴ?뚮굹'瑜?200% ?댁븘?댁뼱 吏꾩쭨 ?щ엺????寃?媛숈? ?앸챸?μ쓣 遺덉뼱?ｌ쑝?몄슂.`;
    }

    const dateRule = inputDate.value 
      ? `[??諛⑸Ц/寃쏀뿕 ?좎쭨 泥섎━]: ?낅젰???좎쭨??'${inputDate.value}'?낅땲?? ?? 湲???먮쫫 ???좎쭨媛 ?ш쾶 以묒슂?섏? ?딄굅??援녹씠 ?멸툒???꾩슂媛 ?녿뒗 二쇱젣?쇰㈃ ?듭?濡??좎쭨瑜??곗? 留먭퀬 ?먯뿰?ㅻ읇寃??앸왂?섏꽭??`
      : `[??諛⑸Ц/寃쏀뿕 ?좎쭨 泥섎━]: ?좎쭨媛 ?낅젰?섏? ?딆븯?쇰?濡??좎쭨 ?멸툒 ?놁씠 ?먯뿰?ㅻ읇寃?援ъ꽦?섏꽭??`;

    const descRule = inputDesc.value
      ? `[??吏곸젒 寃쏀뿕 / ?대㉫ ?섎Ⅴ?뚮굹 ?뷀뀒??(理쒖슦??諛섏쁺)]: """${inputDesc.value}"""\n???ъ슜?먯쓽 ?앹깮??吏곸젒 寃쏀뿕怨?媛먯긽 ?뷀뀒?쇱쓣 蹂몃Ц 怨녠납??媛???먯뿰?ㅻ읇怨?鍮꾩쨷 ?덇쾶 ?뱀뿬?댁뼱 由ъ뼹 ?꾧린濡??꾩꽦?섏꽭??`
      : '';

    const articleRule = inputArticle && inputArticle.value
      ? `[??李멸퀬 湲곗궗 ?먮Ц / 李몄“ 臾몄꽌 ?⑺듃 湲곕컲 ?묒꽦 (理쒖슦??諛섏쁺)]: """${inputArticle.value}"""\n??李멸퀬 湲곗궗 ?먮뒗 臾몄꽌???⑺듃? ?듭떖 ?뺣낫瑜??뺥솗??李몄“?섍퀬 ?몄슜?섏뿬 ?꾨Ц?곸씠怨??щ룄 ?덈뒗 湲濡??묒꽦?섏꽭?? ?덈? ?ъ떎???쒓끝?섍굅??吏?대궡吏 留덉꽭??`
      : '';

    const faqRule = chkFaq.checked 
      ? `湲 ?섎떒?먮뒗 諛⑸Ц?먮굹 ?낆옄?ㅼ뿉寃??ㅼ쭏?곸쑝濡??꾩?????留뚰븳 轅?곸꽦 FAQ 肄붾꼫(Q1, Q2, Q3 ?뺤떇)瑜?3媛??묒꽦??二쇱꽭??` 
      : '';

    const prompt = `?뱀떊? 援?궡 ?묓떚??釉붾줈洹??명뵆猷⑥뼵?쒖씠??SEO 肄섑뀗痢??꾨Ц媛?낅땲?? 泥⑤????대?吏?ㅺ낵 李멸퀬 ?먮즺, 洹몃━怨??ㅼ쓬 ?ㅼ젙媛믩뱾??留욎텛???ъ뒪?낆쓣 ?묒꽦?섏꽭??

[湲곕낯 ?ㅼ젙]
- 移댄뀒怨좊━ 遺꾩빞: ${categoryName} (${categoryToneInstruction})
- 怨듯넻 ??留ㅻ꼫 (留먰닾): ${toneInstruction}
- ?듭떖 二쇱젣 / ?μ냼 / ??? ${inputSubject.value || '泥⑤? ?ъ쭊 湲곕컲 ?먯뿰?ㅻ윭??二쇱젣'}
- ?寃??ㅼ썙?? ${keywordsList.join(', ')}

[?묒꽦 吏移?諛?吏?쒖궗??
1. 泥⑤????대?吏?ㅼ쓣 ?뺣??섍쾶 遺꾩꽍(Vision)?섏뿬 ?쇱궗泥댁쓽 ?됯컧, 吏덇컧, 遺꾩쐞湲? ?뷀뀒?쇱쓣 蹂몃Ц 以묎컙以묎컙???앹깮?섍쾶 臾섏궗?섏꽭??
2. ${dateRule}
3. ${descRule}
4. ${articleRule}
5. ${humanizeRule}
6. ?寃??ㅼ썙?쒓? 蹂몃Ц???먯뿰?ㅻ읇寃?4~6???⑸퓣?ㅼ??꾨줉 ?ㅺ퀎?섏뿬 寃???붿쭊 ?몄텧 ?먯닔瑜??믪씠?몄슂.
7. ${faqRule}

[??理쒖쥌 異쒕젰 ?щ㎎ ?꾩닔 洹쒖튃 (?뺥솗??吏耳쒖＜?몄슂)]:
異쒕젰? 諛섎뱶???ㅼ쓬 3媛??뱀뀡 ?쒓렇濡?紐낇솗???섎늻??異쒕젰?댁빞 ?⑸땲??

[SEO_TITLES]
1. (SEO 寃?됱뿉 理쒖쟻?붾릺怨??대┃???좊룄?섎뒗 留ㅻ젰?곸씤 ?쒕ぉ 1)
2. (?쒕ぉ 2)
3. (?쒕ぉ 3)
4. (?쒕ぉ 4)
5. (?쒕ぉ 5)

[SEO_KEYWORDS]
#?ㅼ썙??, #?ㅼ썙??, #?ㅼ썙??, #?ㅼ썙??, #?ㅼ썙??, #?ㅼ썙??, #?ㅼ썙??, #?ㅼ썙??, #?ㅼ썙??, #?ㅼ썙??0

[MAIN_CONTENT]
[TITLE]: (??5媛??쒕ぉ 以?媛???꾨꼍?섍퀬 ?뚮???理쒖쥌 ????쒕ぉ 1媛?
(?ш린?쒕???釉붾줈洹?蹂몃Ц ?묒꽦. ?곗뒪?좊━/?뚮뱶?꾨젅???ㅼ씠踰꾩뿉 諛붾줈 ?곌린 醫뗫룄濡?H2, H3, P, UL, LI ??留덊겕???쒓렇瑜??곸젅???쒖슜?섍퀬, 以묎컙以묎컙 ?ъ쭊???ㅼ뼱媛??꾩튂??<img src="assets/??쒖씠誘몄?.png" alt="?ъ쭊 臾섏궗"> ?쒓렇瑜??곸뼱??1~3媛??쎌엯?댁＜?몄슂.)`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...uploadedFiles.map(f => ({
              inlineData: {
                mimeType: f.type,
                data: f.base64
              }
            }))
          ]
        }
      ]
    };

    const targetModel = (selectCategoryEngine && selectCategoryEngine.value) || selectedModel || 'gemini-3.1-pro-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error ? errData.error.message : 'API Request Failed';
      throw new Error(`[援ш? API ?먮윭] ${response.status}: ${errMsg}`);
    }
    
    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text.trim();
    
    let seoTitles = [];
    let seoKeywords = [];
    let title = '?몄쬆???ъ뒪???쒕ぉ';
    let body = rawText;
    
    // ?뚯떛 濡쒖쭅
    if (rawText.includes('[SEO_TITLES]')) {
      const parts = rawText.split('[SEO_TITLES]');
      const afterTitles = parts[1];
      if (afterTitles.includes('[SEO_KEYWORDS]')) {
        const titleAndRest = afterTitles.split('[SEO_KEYWORDS]');
        const titlesRaw = titleAndRest[0].trim().split('\n');
        seoTitles = titlesRaw.map(t => t.replace(/^\d+\.\s*/, '').replace(/[*"']/g, '').trim()).filter(Boolean);
        
        const afterKeywords = titleAndRest[1];
        if (afterKeywords.includes('[MAIN_CONTENT]')) {
          const kwAndMain = afterKeywords.split('[MAIN_CONTENT]');
          seoKeywords = kwAndMain[0].trim().split(',').map(k => k.trim()).filter(Boolean);
          body = kwAndMain[1].trim();
        } else {
          body = afterKeywords.trim();
        }
      }
    }

    if (body.startsWith('[TITLE]:')) {
      const bParts = body.split('\n');
      title = bParts[0].replace('[TITLE]:', '').trim();
      body = bParts.slice(1).join('\n').trim();
    } else if (body.includes('\n') && title === '?몄쬆???ъ뒪???쒕ぉ') {
      const idx = body.indexOf('\n');
      title = body.substring(0, idx).replace('[TITLE]:', '').trim();
      body = body.substring(idx + 1).trim();
    }
    
    return { title, body, seoTitles, seoKeywords };
  }

  // ==========================================
  // 9. LOCAL DEMO CONTENT GENERATION
  // ==========================================
  function generateLocalDemoContent() {
    const isSnap = activeTab === 'snapblog';
    const isEmotional = isSnap && (selectBlogTone.value === 'emotional' || selectBlogTone.value === 'friendly');
    const isParis = activeDemoPreset === 'paris';
    const isOrangery = activeDemoPreset === 'orangery';
    
    let title = '';
    let body = '';

    // ?? ?꾨━?? ?뚮━ ?먰렆????
    if (isParis) {
      if (isSnap) {
        if (isEmotional) {
          title = "二쇳솴鍮??몄쓣怨???쭔 ???? ?꾨옉???뚮━ ?먰렆??媛먯꽦 ?ы뻾 ?꾧린 ?눏?눟";
          body = `?붿쭅??怨좊갚?섏옄硫? ????뚮━??濡쒕쭩??洹몃젃寃??ъ? ?딆? ?щ엺?댁뿀?댁슂. ?섏?留??몄쓣 吏???댁쭏?? ?먰렆?묒쓣 ?덉븵??留덉＜??洹?李곕굹???쒓컙 紐⑤뱺 ?앷컖???ㅻ컮?뚯뿀?듬땲?? ?섎뒛??留덉튂 二쇳솴鍮?臾쇨컧????대넃? 寃껋쿂??遺됯쾶 臾쇰뱾?닿???媛?대뜲 ?낆옣?섍쾶 ???덈뒗 ?먰렆?묒쓽 紐⑥뒿? 洹??먯껜濡?嫄곕???媛먮룞?댁뿀?댁슂.

?먰렆??二쇰????꾧린?먭린??怨⑤ぉ湲몃뱾???곕씪 嫄룸떎 蹂대땲, ?묒? ?뚮━ ?몄쿇 移댄럹媛 ?덉뿉 ?ㅼ뼱?ㅻ뜑?쇨퀬?? ?뚮씪?ㅼ뿉 ?먮━瑜??↔퀬 ?먯뒪?꾨젅?????붿쓣 ?쒖폒???吏앹씠?붾뜲, ?됱떥由꾪븳 而ㅽ뵾 ???꾨줈 ?ㅼ튂??媛?꾨컮?뚭낵 ?닿뎅?곸씤 嫄곕━媛 ?덈Т????쭔?곸씠?덈떟?덈떎.

?댁뒪由꾩씠 吏숈뼱吏怨??쒕뵒???먰렆?묒뿉 ?몃? ?꾧뎄 議곕챸?ㅼ씠 諛섏쭩諛섏쭩 耳쒖????쒓컙?먮뒗 ?뺣쭚 ?ъ옣??荑??섍퀬 ?대젮?됰뒗 以??뚯븯?댁슂. ?붾젮?섍쾶 諛섏쭩?대뒗 湲덈튆 ????꾨옒?먯꽌 嫄룸뒗 諛ㅺ만? 留덉튂 ?곹솕 ??二쇱씤怨듭씠 ????븳 李⑷컖??二쇨린??異⑸텇?덈떟?덈떎.

${chkFaq.checked ? `<h3>???뚮━ ?먰렆???ы뻾 FAQ</h3>
<p><strong>Q1. ?먰렆???몄쓣 媛먯긽 踰좎뒪???ㅽ뙚??</strong><br>?ㅼ슂 沅?愿묒옣?먯꽌 ?뺣㈃ 酉곕? 異붿쿇?⑸땲??<br><br><strong>Q2. 怨⑤ぉ 移댄럹 異붿쿇 硫붾돱媛 ?덈굹??</strong><br>?먯뒪?꾨젅?뚯? ?щ（?꾩긽 議고빀??媛뺤텛?댁슂!<br><br><strong>Q3. ?뚮ℓ移섍린 ?덈갑 轅??</strong><br>媛諛⑹쓣 ?욎쑝濡?硫붽퀬, ?ㅻ쭏?명룿???먮ぉ ?ㅽ듃?⑹쓣 ?곌껐?섏꽭??</p>` : ''}`;
        } else {
          title = "파리 에펠탑 명당 뷰 & 주변 골목 카페 코스 총정리";
          body = `?꾨옉???뚮━ ?먯쑀?ы뻾???듭떖 肄붿뒪, **?뚮━ ?먰렆??*怨?二쇰? 怨⑤ぉ 移댄럹 ?먮갑 ?뺣낫瑜??뺣━?⑸땲??

**1. ?먰렆???몄쓣 ?ㅽ뙚 諛??쒓컙?**
?쇰ぐ 30遺????ㅼ슂 沅??꾩갑??沅뚯옣?⑸땲?? 二쇳솴鍮??좎뀑怨?怨⑤ぉ湲?議곕챸???댁슦?ъ???怨⑤뱺??꾩엯?덈떎.

**2. ?먰렆??洹쇱쿂 濡쒖뺄 移댄럹 異붿쿇**
- ?꾩튂: ?먰렆???꾨낫 7遺?嫄곕━ 怨⑤ぉ
- ???硫붾돱: ?먯뒪?꾨젅?? ?꾨젋移??щ（?꾩긽

${chkFaq.checked ? `<h3>???꾨옉???뚮━ ?ы뻾 FAQ</h3>
<p><strong>Q1. ?쇱씠?몄뾽 議곕챸???쒓컙??</strong><br>留ㅼ씪 ?쇰ぐ ???뺢컖遺??5遺꾧컙 ?댁쁺.<br><br><strong>Q2. 移댄럹 ?덉궛??</strong><br>?먯뒪?꾨젅??湲곗? 3~5?좊줈 ??<br><br><strong>Q3. 移대뱶 寃곗젣 ?몃━?쒓???</strong><br>?遺遺??댁쇅 泥댄겕移대뱶 寃곗젣 媛?ν빀?덈떎.</p>` : ''}`;
        }
      } else {
        title = "??쭔??媛?앺븳 ?꾩떆 ?뚮━ ?ы뻾, ?먰렆???몄쓣怨?怨⑤ぉ 移댄럹 媛먯꽦";
        body = `<h2>遺됯쾶 臾쇰뱺 ?섎뒛 ?꾨옒, ?먰렆?묒쓣 留덉＜?섎떎</h2>
<p>?닿? ?臾쇱뼱媛?利덉쓬 ?뚮━???ㅼ뭅?대씪?몄쓣 諛곌꼍?쇰줈 ?낆옣?섍쾶 ???덈뒗 ?먰렆?묒? ?뗭쓣 ?볤쾶 留뚮뱶??留ㅻ젰???덉뒿?덈떎.</p>

<h2>怨⑤ぉ湲?移댄럹?먯꽌 留뚮궃 ?먯뒪?꾨젅??????/h2>
<p>?먰렆??援ш꼍 ??怨⑤ぉ ?덉そ???몄쿇 移댄럹?먯꽌 吏꾪븳 ?먯뒪?꾨젅?뚮? 利먭꺼蹂댁꽭??</p>

<h3>?뚮━ ?ы뻾 肄붿뒪 轅??/h3>
<ul>
  <li><strong>異붿쿇 ?쒓컙?:</strong> ?쇰ぐ 吏곸쟾 (?ㅽ썑 6??8??</li>
  <li><strong>異붿쿇 ?ㅽ뙚:</strong> ?ㅼ슂 沅곸쟾 ?뚮씪??/li>
</ul>

${chkFaq.checked ? `<h3>???뚮━ ?먯쑀?ы뻾 FAQ</h3>
<ul>
  <li><strong>Q: ?꾨쭩? ?덉빟 ?꾩닔?</strong><br>A: ?깆닔湲곗뿉???ъ쟾 ?덈ℓ媛 ?좊━?⑸땲??</li>
</ul>` : ''}`;
      }

    // ?? ?꾨━?? ?뚯＜ ?ㅻ옉二쇰━ ??
    } else if (isOrangery) {
      if (isSnap) {
        if (isEmotional) {
          title = "嫄곕????⑥떎 ??珥덈줉鍮??먮쭅 怨듦컙, ?뚯＜ ?ㅻ옉二쇰━ ?앸Ъ??移댄럹 ?뙼";
          body = `諛붿걶 ?쇱긽 ?띿뿉???⑥씠 ??留됲옄 ?? ???吏??二쇰쭚 珥덈줉 媛?앺븳 **?뚯＜ ?ㅻ옉二쇰━**???ㅻ??붿뼱?? 臾몄쓣 ?닿퀬 ?ㅼ뼱?쒕뒗 ?쒓컙, ?몄갹???대?由??띿뿉 ?ㅼ뼱??寃껋쿂??留묒? 怨듦린? ? ?꾩깉媛 ?⑤じ??媛먯떥?붾씪怨좎슂.

移댄럹 泥쒖옣??嫄곕????좊━ ?⑥떎 ?붿쑝濡??섏뼱 ?덉뼱???붿궗???뉗궡???잛븘???대졇?댁슂. ?뚮쫯?뚮쫯??珥덈줉 ?앸Ъ?ㅺ낵 ?????쇱옄?? 洹몃━怨??ㅻ궡 以묒븰??議곌렇留??곕せ源뚯?!

?쒓렇?덉쿂 **?ㅻ젋吏 ?먯씠??*??泥?웾?⑥쓽 ?앺뙋?뺤씠?덉뼱?? 癒몃Т???대궡 ?먮쭅 媛???됰났??二쇰쭚?댁뿀?듬땲??

${chkFaq.checked ? `<h3>???뚯＜ ?ㅻ옉二쇰━ 移댄럹 FAQ</h3>
<p><strong>Q1. 二쇱감 ?명븳媛??</strong><br>留ㅼ옣 ???꾩슜 二쇱감???덇퀬, ?뚮즺 二쇰Ц ??3?쒓컙 臾대즺.<br><br><strong>Q2. 諛섎젮?숇Ъ 媛??</strong><br>紐⑹쨪 李⑹슜 ???쇰? 援ъ뿭 ?숇컲 媛??<br><br><strong>Q3. 踰좎뒪??珥ъ쁺 ?ㅽ뙚?</strong><br>?ㅻ궡 以묒븰 ?섎Т ?붾뱾?ㅻ━ ?꾧? ?몄깮 ???ъ씤??</p>` : ''}`;
        } else {
          title = "?뚯＜ ?앸Ъ??移댄럹 [?ㅻ옉二쇰━] ?붿쭅 ?꾧린 - 二쇱감, 硫붾돱, ?⑥떎 ?뺣낫";
          body = `寃쎄린???뚯＜ ?쒕씪?대툕 肄붿뒪 ????⑥떎??移댄럹, **?ㅻ옉二쇰━**???ㅻ??붿뒿?덈떎.

**1. 李얠븘媛??湲?諛?二쇱감 ?뺣낫**
- 二쇱냼: 寃쎄린 ?뚯＜??愿묓깂硫?湲곗궛濡?329
- 二쇱감: 留ㅼ옣 ???洹쒕え 二쇱감 援ъ뿭 (移댄럹 ?댁슜 ??3?쒓컙 臾대즺)

**2. ?ㅻ궡 ?뺤썝 ?ㅼ???*
?믪? 痢듦퀬???좊━ 泥쒖옣, 愿?쎌떇臾? ?곕せ怨??쒕깈臾??뚮━媛 ?댁슦?ъ쭊 怨듦컙?낅땲??

**3. ?쒓렇?덉쿂 硫붾돱**
- ??? ?ㅻ젋吏 ?먯씠?????앷낵???щ씪?댁뒪媛 ?щ퓤

${chkFaq.checked ? `<h3>???ㅻ옉二쇰━ FAQ</h3>
<p><strong>Q1. 二쇰쭚 ?湲??쒓컙?</strong><br>?쇳겕 ???14~16?? ?쇳븯怨??ㅼ쟾 11??異붿쿇.<br><br><strong>Q2. 鍮??ㅻ뒗 ?좊룄 愿쒖갖?섏슂?</strong><br>?ㅻ궡 ?⑥떎?대씪 ?ш퀎??苡뚯쟻?⑸땲??<br><br><strong>Q3. ?꾩씠 ?숇컲?</strong><br>?곕せ怨?臾쇨퀬湲곌? ?덉뼱 ?꾩씠?ㅼ씠 醫뗭븘?⑸땲??</p>` : ''}`;
        }
      } else {
        title = "?뚯＜ ?앸Ъ??移댄럹 ?ㅻ옉二쇰━, ?꾩떖 ???⑥떎 ?뺤썝?먯꽌 利먭린??二쇰쭚 ?먮쭅";
        body = `<h2>?먯뿰???덉? 嫄곕????ㅻ궡 ?⑥떎???뺤썝 移댄럹</h2>
<p>寃쎄린???뚯＜???쒕뱶留덊겕, ?앸Ъ??移댄럹 **?ㅻ옉二쇰━**???ㅻ??붿뒿?덈떎. ?믪? 泥쒖옣??媛??梨꾩슫 ?대? ?쇱옄?? ?먮Ⅴ???곕せ源뚯? ?깃렇?ъ슫 ?먯뿰 ?띿뿉 ?ㅼ뼱????빀?덈떎.</p>

<h2>?뀁냽 怨듦컙?먯꽌???곹겮???ㅻ젋吏 ?먯씠??????/h2>
<p>?쒓렇?덉쿂 ?ㅻ젋吏 ?먯씠?쒕? ?ㅼ씠耳쒕땲 媛?댁냽源뚯? 泥?웾??湲곗슫??梨꾩썙議뚯뒿?덈떎.</p>

<h3>?듭떖 泥댄겕?ъ씤??/h3>
<ul>
  <li><strong>二쇱감:</strong> ?꾩슜 二쇱감??(?곸닔利??몄쬆 ??3?쒓컙 臾대즺)</li>
  <li><strong>?ы넗議?</strong> ?ㅻ궡 以묒븰 ?곕せ ?ㅻ━ ??/li>
</ul>

${chkFaq.checked ? `<h3>???ㅻ옉二쇰━ 移댄럹 FAQ</h3>
<ul>
  <li><strong>Q: ?뚮즺 媛寃⑸??</strong><br>A: ?꾨찓由ъ뭅??8泥??먮?. ?뺤썝 ?좎?鍮??ы븿?대씪 ?⑸뱷 媛?ν빀?덈떎.</li>
</ul>` : ''}`;
      }

    // ?? 踰붿슜: ?ъ슜?먭? 吏곸젒 ?낅젰??二쇱젣/?ㅻ챸 湲곕컲 ?숈쟻 ?앹꽦 ??
    } else {
      const subject = inputSubject.value.trim() || '?섏쓽 ?밸퀎??寃쏀뿕';
      const desc = inputDesc.value.trim();
      const dateStr = inputDate.value ? inputDate.value.replace(/-/g, '. ') : '?ㅻ뒛';
      const kwText = keywordsList.length > 0 ? keywordsList.join(', ') : subject;
      const photoCount = uploadedFiles.length;
      const photoText = photoCount > 0 ? `(?낅줈?쒕맂 ${photoCount}?μ쓽 ?ъ쭊 湲곕컲)` : '';

      if (isSnap) {
        switch (toneVal) {
          case 'emotional':
            title = `[媛먯꽦?쇱긽] ${subject}??癒몃Ъ?? ?뚯냼?섍퀬 ?뚯쨷?덈뜕 ?쒓컙??湲곕줉`;
            body = `?곗궗濡쒖슫 ?뉗궡??諛쏆쑝硫??ㅻ???${subject}?먯꽌???섎（瑜?議곗떖?ㅻ젅 ?④퉩?덈떎. ${photoText}
            
${desc ? `?닿납?먯꽌 寃쏀뿕??"${desc}"??湲곗뼲? ?쇱긽?먯꽌 ???섍린媛 ?섏뿀?듬땲?? ?ъ쭊?쇰줈 ?ㅼ떆 爰쇰궡蹂댁븘??李?湲곕텇??醫뗭븘吏묐땲??` : '泥?嫄몄쓬???붾뵒???쒓컙 怨듦컙 ?꾩껜?????섍쾶 ?띻린???뱀쑀???꾨뒔??議곕챸怨?遺꾩쐞湲곌? 留ㅻ젰?곸씠?덉뒿?덈떎.'}
            
?뚯쨷???먮쭅????湲곕텇?댁뼱??移대찓???뷀꽣瑜??????놁씠 ?뚮??듬땲?? 諛붿걶 留ㅼ씪 ?띿뿉???묒? ?쇳몴瑜?李얘퀬 怨꾩떊?ㅻ㈃ 媛蹂띻쾶 沅뚰빐 ?쒕┰?덈떎.

${chkFaq.checked ? `<h3>* ${subject} 媛먯꽦 FAQ</h3>
<p><strong>Q1. ?몄젣 諛⑸Ц?섎뒗 寃껋씠 遺꾩쐞湲곌? 醫뗫굹??</strong><br>?뉗궡??遺?쒕읇寃??대━弛먮뒗 ??? ?ㅽ썑 ?쒓컙?瑜??곴레 異붿쿇?⑸땲??<br><br><strong>Q2. 諛⑸Ц ???뚯븘???곸씠 ?덈굹??</strong><br>?ъ쑀濡?쾶 怨듦컙???꾨뒔???뚮━? ?뺤랬??吏묒쨷?대낫?쒓린 諛붾엻?덈떎.<br><br><strong>Q3. ?ъ쭊?????섏삤??媛먯꽦 ?ㅽ뙚???</strong><br>?먯뿰愿묒씠 ?댁쭩 ?ㅼ뼱?ㅻ뒗 李쎄? 洹쇱쿂???뚰뭹???덉걯寃?紐⑥뿬?덈뒗 踰쎈㈃??醫뗭뒿?덈떎.</p>` : ''}`;
            break;

          case 'seo':
            title = `[정보] ${subject} 요즘 후기 - 위치, 주차, 이용 꿀팁 총정리`;
            body = `방문객 분들을 위해 ${dateStr}에 직접 경험한 ${subject} 핵심 정보를 가독성 높은 정리글로 전달합니다. ${photoText}

1. ${subject} 湲곕낯 遺꾩꽍
- 諛⑸Ц ?쇱옄: ${dateStr}
- 二쇱슂 ?ㅼ썙?? ${kwText}
${desc ? `- 현장 답사 상세 내용: ${desc}` : '- 상세 특징: 깔끔하고 전문적인 시설 관리'}

2. 異붿쿇 ?쒖슜???곗씠??肄붿뒪???쒕씪?대툕 ?곌퀎 肄붿뒪濡??쒖슜?섍린???꾩＜ ?⑹씠??援ъ꽦??痍⑦븯怨??덉뒿?덈떎. ?쇳겕 ??꾩뿉???湲곗뿴???덉쓣 ???덉쑝???뺤삤 ?댁쟾??諛⑸Ц?섏떆???몄쓣 沅뚯옣?⑸땲??

${chkFaq.checked ? `<h3>* ${subject} ?덈궡 FAQ</h3>
<p><strong>Q1. ?댁슜 ???붽툑?대굹 ?덉궛 ?섏?? ?대뼚?쒓???</strong><br>怨듦컙 ?명봽?쇱? 肄섑뀗痢??鍮?異⑸텇???⑸━?곸씠硫?吏異쒗븷 留뚰븳 ?덉궛 踰붿쐞?낅땲??<br><br><strong>Q2. ?湲곗쨪?대굹 ?쇱옟 ?쒓컙????몄젣?멸???</strong><br>?ㅽ썑 2???꾪썑媛 媛???쇱옟?섎?濡??ㅼ쟾 ?쒓컙?瑜??쒖슜?섏떆硫?苡뚯쟻?섍쾶 ?댁슜?섏떎 ???덉뒿?덈떎.<br><br><strong>Q3. 李⑤웾 二쇱감媛 ?먰솢???몄씤媛??</strong><br>?곌퀎???꾩슜 二쇱감 怨듦컙?대굹 二쇰? 怨듭슜 二쇱감?μ씠 ?꾨퉬?섏뼱 ?섏썡?⑸땲??</p>` : ''}`;
            break;

          case 'friendly':
            title = `[?댁썐異붿쿇] ?諛?留뚯”! ?꾩쟾 ?留뚯”?덈뜕 ${subject} ?뚭컻?댁슂!`;
            body = `?댁썐?섎뱾 ?덈뀞?섏뀛?? 吏??${dateStr}???쒕뵒??踰쇰Ⅴ??${subject}??諛⑸Ц?덈떟?덈떎! ?꾩쟾 ???ㅽ??쇱씤 嫄??덉짛? ${photoText}

${desc ? `?뱁엳 ?諛?異붿쿇?섍퀬 ?띠뿀??遺遺꾩? 諛붾줈 "${desc}" ???댁슜?몃뜲?? 吏곸젒 蹂대땲源??댁썐?섎뱾????洹몃젃寃?媛뺤텛?섏뀲?붿? ???뚭쿋?붾씪怨좎슂.` : '泥섏쓬 ?ㅼ뼱???뚮????곕쑜?섍퀬 移쒖닕?섍쾶 留욎븘二쇰뒗 遺꾩쐞湲곗뿉 湲댁옣媛먯씠 ???뱀븘?대졇?듬땲??'}

?ъ쭊 李띾뒗 議깆” 泥?웾?섍퀬 ?댁걯寃??섏???移댄넚 ?꾩궗??諛붾줈 諛붽엥?댁슂. ?댁썐?섎뱾???쒓컙 ?댁꽌 瑗??쒕쾲 媛蹂댁떆湲?媛뺤텛?⑸땲??

${chkFaq.checked ? `<h3>* 移쒖젅??${subject} Q&A</h3>
<p><strong>Q1. ?쇱옄 媛湲곗뿉??愿쒖갖? 臾대뱶?멸???</strong><br>?? ?꾨뒔?섍쾶 ??援ъ꽍???먮━ ?↔퀬 梨낆쓣 蹂닿굅???앷컖?섍린?먮룄 李?醫뗫떟?덈떎.<br><br><strong>Q2. 諛섎젮?숇Ъ ?숇컲??媛?ν븷源뚯슂?</strong><br>援ъ뿭?대굹 議곌굔???곕씪 ?곸씠?섎?濡?諛⑸Ц ?꾩뿉 留ㅼ옣 ?좎꽑 ?뺤씤??異붿쿇?댁슂.<br><br><strong>Q3. ?ъ옣?섏씠 異붿쿇?섏떆???쒓렇?덉쿂 轅議고빀??</strong><br>湲곕낯??異⑹떎?섎ŉ ?щ즺 蹂몄뿰??留쏆씠??硫뗭쓣 ?대┛ ??쒖쟻???좏깮??異붿쿇?⑸땲??</p>` : ''}`;
            break;

          case 'formal':
            title = `${subject}에 대한 공간적 특성 및 고객 만족도 상세 보고서`;
            body = `${dateStr} 諛⑸Ц 議곗궗瑜?湲곕컲?쇰줈 ?묒꽦??${subject}???댁슜 ?몄쓽?깃낵 ?명봽??媛移?蹂닿퀬?쒖엯?덈떎. ${photoText}

1. 湲고쉷 ?숈꽑 諛??대? 議고삎
蹂??쒖꽕? ?댁슜?먯쓽 ?대룞 ?숈꽑??諛곕젮???좉린?곸씤 ?됰㈃ ?ㅺ퀎媛 ?뗫낫?낅땲??
${desc ? `?뱁엳 ?ㅼ궗??痢〓㈃???뱀씠?ы빆??"${desc}" 遺遺꾩? 怨듦컙??怨좎쑀???뚮쭏瑜?援녠굔???ㅼ졇二쇰뒗 二쇱슂 ?깃났 ?붿씤?쇰줈 蹂댁엯?덈떎.` : '湲곌뎄臾?諛곗튂? ?대? 梨꾧킅 ?곹깭媛 ?곗닔?섏뿬 苡뚯쟻??鍮꾩＜?쇱쟻 議곌굔??留뚯”?쒗궎怨??덉뒿?덈떎.'}

2. 醫낇빀 ?됯? ?섍껄
醫낇빀?곸씤 愿?먯뿉??蹂???${subject}?(?? ?숆툒 移댄뀒怨좊━ ?댁뿉???곗닔???덉쭏 ?좎?瑜??쒓났?섎뒗 紐⑤쾾??紐⑤뜽濡??щ즺?⑸땲??

${chkFaq.checked ? `<h3>* ${subject} ?댁쁺 媛?대뱶 FAQ</h3>
<p><strong>Q1. ?⑥껜 怨좉컼 ?섏슜 ?λ젰??異⑸텇?쒓???</strong><br>?ъ쟾 ?묒쓽瑜?留덉튌 寃쎌슦 異⑸텇???ъ쑀 怨듦컙 諛곗젙??媛?ν븳 洹쒕え?낅땲??<br><br><strong>Q2. ?쎌옄 諛곕젮 ?몄쓽 ?쒖꽕???꾩엯?섏뿀?섏슂?</strong><br>吏꾩엯濡?寃쎌궗 ?쒖꽕 諛??섎━踰좎씠???숈꽑??湲곕낯 援ъ“??諛섏쁺?섏뼱 ?덉뒿?덈떎.<br><br><strong>Q3. ?뺣낫 ?띾뱷???좎슜??怨듭떇 寃쎈줈瑜??쒖븞諛붾엻?덈떎.</strong><br>怨듭떇 ?붿???梨꾨꼸 諛?二쇨린?곸씤 ?덉빟 ?숉뼢???곸떆 援먯감 泥댄겕?댁＜?쒓린 諛붾엻?덈떎.</p>` : ''}`;
            break;

          case 'humorous':
            title = `[휴먼] 이번 주말은 여기였습니다 대박 ${subject} 작살 후기`;
            body = `?섎뱾 吏꾩쭨 ?뗣뀑???ш린 ??媛蹂??щ엺 ?녾쾶 ?댁＜?몄슂. ${dateStr}???ㅻ???${subject}?몃뜲 ?꾩쟾 留ㅻ젰 ??컻?낅땲?? ${photoText}

${desc ? `?뱁엳 ???ъ옣???ъ젙?놁씠 ?寃⑺뻽??嫄?諛붾줈 "${desc}" ??遺遺? 蹂댁옄留덉옄 ???뚮━媛 ?≪꽦?쇰줈 ??대굹????곗뭅 ?뷀꽣 ?꾩껌?섍쾶 ?뚮졇?듬땲??` : '臾??닿퀬 ?ㅼ뼱媛?먮쭏???쇱퀜吏???숉븳 ?먯뀡 ?뺣텇??媛ㅻ윭由??⑸웾 ?곗쭏 六뷀뻽?듬땲??'}

媛먯꽦??誘몄퀜???щ갑臾??섏궗 諛깅쭔?쇱꽱?몄엯?덈떎. 癒몃━ ?앺엳怨??띠쑝??遺꾨뱾 諛붾줈 異쒕컻 醫뚰몴 李띿쑝?붿슂!

${chkFaq.checked ? `<h3>* ${subject} ?쒕┰ FAQ</h3>
<p><strong>Q1. 二쇰㉧???ъ젙???뉗???媛먮떦 媛?ν븷源뚯슂?</strong><br>?쒓컙?곸씤 ?낆옣???섎뜑?쇰룄 ?됲솕? ?먮쭅???ъ삱 ???덉뼱 ?꾩쟾 ?대뱷?낅땲??<br><br><strong>Q2. ?꾧뎄??媛???戮뺤쓣 戮묒쓣 ???덈굹??</strong><br>?ъ쭊 援щ룄 湲곕쭑?덇쾶 ?↔퀬 ?몄쓳 ?섑빐二쇰뒗 由ъ븸???μ씤 移쒓뎄 ?숇컲??媛뺤텛?⑸땲??<br><br><strong>Q3. ?⑥씠???ш쾶?댄듃瑜??쇳븯??轅???</strong><br>?덉튂寃뚯엫 ??깃났??湲곗썝?섎ŉ ?ㅽ뵂 ?쒓컙 10遺??꾩뿉 ?ш렇癒몃땲 媛?덇린 沅뚯옣?⑸땲??</p>` : ''}`;
            break;

          case 'casual_informal':
            title = `媛踰쇱슫 留덉쓬?쇰줈 ?ㅻⅨ ${subject} 湲곕줉, 苑ㅻ굹 愿쒖갖?섏쓬.`;
            body = `${dateStr}??媛蹂띻쾶 ?ㅻ??붾뜕 ${subject}. 怨꾩냽 由ъ뒪?몄뿉留???덈뒗??媛蹂대땲 苑?留ㅻ젰 ?덈떎. ${photoText}

${desc ? `?뱁엳 "${desc}" ??遺遺꾩씠 ??痍⑦뼢??留욎븯?붾뜲 ???ㅻ뱾 ?됱씠 愿쒖갖?吏 媛蹂대땲源???寃?媛숇떎.` : '?명뀒由ъ뼱??怨쇳븯吏 ?딄퀬 ?대갚?댁꽌 癒몃━ ?앺엳湲곗뿏 李??몄븞???명봽??援ъ“???'}

?異?紐?????댂 李띿뼱遊ㅻ뒗?곕룄 梨꾧킅??醫뗭븘 ?ъ쭊 寃곌낵臾쇰룄 ?쒕쾿 ?댁걯寃??섏???肉뚮벏?섎떎. ?ㅼ쓬?먮룄 議곗슜??硫??뚮━怨??띠쓣 ???쇱옄 ?ъ찉 ?ㅻ???쇨쿋??

${chkFaq.checked ? `<h3>* ${subject} ?쇨린 FAQ</h3>
<p><strong>Q1. 二쇱감 怨듦컙? ?ъ쑀濡쒖슫 ?몄씤媛?</strong><br>二쇰쭚 ?ㅽ썑??붾뜲??二쇱감??怨듦컙 ?됰꼮?댁꽌 臾몄젣 ?놁뿀??<br><br><strong>Q2. ?쇱옄 媛湲곗뿉???곹빀?쒓??</strong><br>議곗슜???묒뾽?섍굅??硫??뚮━湲?理쒖쟻?대씪 ?쇨?議깅텇???곴레 沅뚯옣??<br><br><strong>Q3. 異붿쿇 ?ъ씤???섎굹留?以?ㅻ㈃?</strong><br>援ъ꽍援ъ꽍 ?뱀븘?덈뒗 ?뚯냼???ъ씤?몃뱾 ?뺣텇???명븯寃?異⑹쟾?????덉쓬.</p>` : ''}`;
            break;
        }
      } else {
        // Multi-Platform 紐⑤뱶 (HTML ?뺤떇)
        let categoryContentHtml = '';
        
        switch (currentCategory) {
          case 'restaurant':
            title = `[留쏆쭛] ?낆븞 媛??媛먮룞! ${subject} ?④꺼吏?轅留??붿쭅 由щ럭`;
            categoryContentHtml = `
              <h2>?쒓컖怨?誘멸컖???щ줈?≪? 留쏆쓽 ?꾩옣</h2>
              <p>吏곸젒 留쏅낫怨???<strong>${subject}</strong>? 洹몄빞留먮줈 援곗묠 ?꾨뒗 誘몄떇???멸퀎??듬땲?? ${desc ? desc : '?좎꽑???앹옱猷뚯? ?덈쵖???뚯뒪 諛곗튂媛 湲곌? 留됲엺 留쏆쓽 議고솕瑜?蹂댁뿬二쇱뿀?듬땲??'}</p>
              <h2>???硫붾돱? 留쏆엳??臾섏궗</h2>
              <p>????踰좎뼱 臾쇱옄留덉옄 ?낆븞 媛?????곗????띾???留쏄낵 已꾧퉫?섍퀬 遺?쒕윭???앷컧???뺣쭚 ?쇳뭹?댁뿀?듬땲?? ?ъ쭊留?遊먮룄 ?ㅼ떆 媛怨??띠뼱吏?留뚰겮 誘멸컖???щ줈?〓뒗 鍮꾩＜?쇨낵 ?쒕퉬?ㅺ? ?留뚯”?ㅻ윭?좎뒿?덈떎.</p>
            `;
            break;
          case 'cafe':
            title = `[카페] 감성 분위기와 아늑함, 인스타 핫플 ${subject} 다녀옴`;
            categoryContentHtml = `
              <h2>?뉗궡怨?媛먯꽦??癒몃Т???곕쑜??怨듦컙</h2>
              <p>怨듦컙 湲고쉷???뗫낫?대뒗 <strong>${subject}</strong>??癒몃Ъ???붿뒿?덈떎. ${desc ? desc : '遺?쒕윭??議곌킅怨?媛먭컖?곸씤 媛援?諛곗튂, ?덉걶 ?됯컧??議고솕瑜??대， ?먮쭅 ?ㅽ뙚?댁뿀?듬땲??'}</p>
              <h2>?명뀒由ъ뼱 諛?酉??ъ씤??/h2>
              <p>紐⑦뎮???뚯씠釉붿뿉 ?됱븘 李띿? ?ъ쭊留덈떎 梨꾧킅?????ㅻŉ??洹몄빞留먮줈 媛먯꽦 ?ъ쭊 留쏆쭛?댁뿀?듬땲?? 而ㅽ뵾 ?κ낵 ?④퍡 議곗슜?섍퀬 ??쭔?곸씤 ?ㅽ썑???쇳몴瑜?李띻퀬 ?띠? 遺꾨뱾猿??곴레 沅뚰빀?덈떎.</p>
            `;
            break;
          case 'travel':
            title = `[?ы뻾] ?꾩옣媛?諛깊띁?쇳듃! ${subject} ?뺣났 肄붿뒪 諛??ㅼ쟾 媛?대뱶`;
            categoryContentHtml = `
              <h2>?앹깮???꾩옣 臾섏궗? 理쒖쟻???먮갑 ?숈꽑</h2>
              <p>諛쒓만 ?용뒗 怨노쭏???덈줈???ㅻ젞??二쇰뒗 <strong>${subject}</strong> ?꾩옣 ?뚯떇?낅땲?? ${desc ? desc : '寃쎈줈 ?덈궡媛 吏곴??곸씠怨?援ш꼍嫄곕━媛 ?ㅼ뼇?섏뿬 ?ы뻾??臾섎?瑜??⑥쟾???대젮二쇱뿀?듬땲??'}</p>
              <h2>?ы뻾?먮? ?꾪븳 ?꾩닔 ?숈꽑 & 援먰넻 ?뺣낫</h2>
              <p>?꾩갑 ??二쇰? ?덈궡 ?붾졊?대굹 ?대룞 ?곸쓣 ?ъ쟾???뚯븙???먯떆硫??⑥뵮 ?섏썡?⑸땲?? ?ъ쭊 ?띿뿉 ?④꺼吏??꾨쫫?ㅼ슫 ?띻킅怨?異붿쿇 ?ㅽ뙚?ㅼ? 瑗??ㅻ윭蹂댁븘?????꾩닔 踰꾪궥由ъ뒪?몃줈 媛뺤텛?⑸땲??</p>
            `;
            break;
          case 'tech':
            title = `[?뚰겕] ?ъ뼇 鍮꾧탳 遺꾩꽍: ${subject} ?ъ슜 ?꾧린 諛??듭떖 ?깅뒫 媛?대뱶`;
            categoryContentHtml = `
              <h2>?뺣? ?ъ뼇 寃??諛??섎뱶?⑥뼱 ?깅뒫 ?됯?</h2>
              <p>?대쾲 由ы룷?몄뿉?쒕뒗 <strong>${subject}</strong>???듭떖 湲곗닠 ?깅뒫怨??ъ슜???몄쓽?깆쓣 ?ㅺ컖?꾨줈 吏싳뼱遊낅땲?? ${desc ? desc : '?쒗뭹???꾩껜?곸씤 議곗옉 ?몄쓽?깃낵 ?낅젰 諛섏쓳 ?띾룄媛 湲곗〈 洹쒓꺽???곹쉶?섎뒗 ?깅뒫??蹂댁뿬二쇱뿀?듬땲??'}</p>
              <h2>?ㅼ궗???λ떒??& ?뚰겕 ?ㅽ럺 寃利?/h2>
              <p>?묒옱???꾨줈?몄꽌 諛??ㅺ퀎 ?쇳뙥?곕뒗 ?닿뎄?깃낵 ?덉젙?깆쓣 ?뚮???留뚯”?쒗궢?덈떎. 遺꾩꽍 寃곌낵, 媛?깅퉬? 媛?щ퉬瑜?紐⑤몢 媛뽰텣 理쒖쟻???뚰겕?⑥뼱 ?꾩씠?쒖쑝濡??뺤쓽?????덉뒿?덈떎.</p>
            `;
            break;
          case 'fashion':
            title = `[?⑥뀡] ?륁씠 ?덉닠! ${subject} ?ㅽ??쇰쭅 ?쒖븞 諛??곗씪由?猷⑸턿`;
            categoryContentHtml = `
              <h2>?몃젋?뷀븳 ?됯컧 ?곗텧怨??몄븞???륁쓽 議고솕</h2>
              <p>?ㅽ??쇰━?쒗븳 臾대뱶瑜??대젮以?<strong>${subject}</strong> 李⑹슜 ??肄붾뵒 媛?대뱶瑜?怨듭쑀?⑸땲?? ${desc ? desc : '?먯뿰?ㅻ윭???쒗삎?대굹 ?뚯옱??寃곗씠 ?댁븘???숉븯硫댁꽌???쇱긽 ?곗씪由?猷⑹쑝濡??곗텧?섍린?????뚮쭪?섏뒿?덈떎.'}</p>
              <h2>吏곴??곸씤 李⑹슜媛?& 酉고떚 ??/h2>
              <p>?낆뿀?????섎윭?대━???ㅻ（?ｊ낵 怨좉툒?ㅻ윭??珥됯컧???뷀뀒?쇳븯寃??댁븘 ???쎈땲?? ?ㅺ??ㅻ뒗 ?쒖쫵 ?몃젋?쒕? ?욎꽌媛??몃젴???쇱뒪瑜??댁븘?닿퀬 ?띠? 遺꾨뱾猿?沅뚰빐?쒕┰?덈떎.</p>
            `;
            break;
          case 'living':
            title = `[由щ튃] 怨듦컙???щ컻寃? ${subject} ?쒖슜 ?덉뒪??쇰쭅 ?덉씠?꾩썐 ?쒖븞`;
            categoryContentHtml = `
              <h2>怨듦컙 ?⑥쑉??諛??ㅼ븻臾대뱶 ?명뀒由ъ뼱 議곗쑉</h2>
              <p>?꾨뒔?섍퀬 議고솕濡쒖슫 怨듦컙 ?붿옄?몄쓣 ?좎궗?섎뒗 <strong>${subject}</strong> 諛곗튂 ?곸엯?덈떎. ${desc ? desc : '媛援ъ쓽 ?ш린 洹좏삎怨?踰쎌?, 留덈（ ?됱긽????議곗쑉???쒓컖?곸씤 ?덉젙媛먯쓣 ?뺤떎???ъ뼱以띾땲??'}</p>
              <h2>?섎궔 ?ㅺ퀎 & ?덉씠?꾩썐 ?뷀뀒??/h2>
              <p>?뺣룉??媛援??숈꽑???곕씪媛硫?源붾걫?섎㈃?쒕룄 ?꾧린?먭린??吏?袁몃?湲?媛먯꽦???꾩꽦?⑸땲?? ?꾨궇濡쒓렇?곸씤 ?뺤랬? ?⑥쑉?깆쓣 ?숈떆???먰븯???덈윭踰꾨뱾???붽뎄瑜????섎졃?덉뒿?덈떎.</p>
            `;
            break;
          case 'parenting':
            title = `[?≪븘] ?꾨쭏?꾨튌 怨듦컧 諛깊봽濡? ${subject} ?꾩씠? ?④퍡???덉떖 泥댄뿕湲?`;
            categoryContentHtml = `
              <h2>?꾩씠???덉쟾怨?援먯쑁???④낵??怨듭〈</h2>
              <p>?곕━ ?꾩씠? ?뚯쨷??異붿뼲??留뚮뱾?댁? <strong>${subject}</strong> ?댁슜 ?꾧린?낅땲?? ${desc ? desc : '???怨듦컙 諛??몄쓽 ?쒖꽕 ?ㅺ퀎媛 ?꾨룞???덉쟾 ?섏튃????以?섑븯怨??덉뼱 遺紐??낆옣?먯꽌 ?덉떖???섏뿀?듬땲??'}</p>
              <h2>?ㅼ젙??泥댄뿕 ?쇨린 & 轅??/h2>
              <p>?꾩씠媛 ?대쭛寃??껋쑝硫??곕せ??臾쇨퀬湲곕굹 湲곌뎄?ㅼ쓣 ?좉린?댄븯??紐⑥뒿???댁? ?ъ쭊? ?몄깮 而룹씠?덉뒿?덈떎. 援먯쑁?곸씤 ?숈뒿 援먭뎄 諛?移쒗솚寃??먯옱?ㅼ씠 媛?앺빐????媛議깆씠 ?먮쭅?섍린??理쒖쟻?낅땲??</p>
            `;
            break;
          case 'review':
            title = `[由щ럭] 源딆씠 ?덈뒗 遺꾩꽍: ${subject} 愿??遺꾩꽍 諛??됱젏`;
            categoryContentHtml = `
              <h2>?묓뭹 ?대㈃???⑥쓽? 以꾧굅由??ъ링 遺꾩꽍</h2>
              <p>臾명솕?덉닠??愿?먯뿉???щ룄 ?덇쾶 吏싳뼱蹂?<strong>${subject}</strong> ?됰줎?낅땲?? ${desc ? desc : '?댁빞湲곗쓽 ?꾪깂??媛쒖뿰?깃낵 ?몃Ъ 媛꾩쓽 愿怨꾨룄媛 吏쒖엫???덇쾶 ?곌껐?섏뼱 ?믪? 吏??留뚯”??二쇱뿀?듬땲??'}</p>
              <h2>?몄긽?곸씤 ???紐낆옣硫?& ?됱젏 ?섍껄</h2>
              <p>?묎????쒓컖???뗫낫?대뒗 ?곗텧怨??ㅽ넗由щ씪?몄씠 臾듭쭅??媛먮룞???좎궗?⑸땲?? ?띠쓽 諛⑺뼢?깆쓣 ?섎룎?꾨낫寃??댁? 臾듭쭅??留덉뒪?고뵾?ㅻ줈 ?됯??섎ŉ 醫낇빀 蹂꾩젏 4.5?먯쓣 遺?ы빀?덈떎.</p>
            `;
            break;
          case 'health':
            title = `[?ъ뒪] ?ㅼ슫?? ${subject} ?먯꽭 援먯젙 諛?洹쇱꽦??猷⑦떞 媛?대뱶`;
            categoryContentHtml = `
              <h2>洹쇱쑁 ?먭레 洹밸???諛??덉쟾???대룞 ?먯꽭</h2>
              <p>?대룞 ?⑥쑉??鍮꾩빟?곸쑝濡??뚯뼱?щ젮 以?<strong>${subject}</strong> ?몃젅?대떇 猷⑦떞?낅땲?? ${desc ? desc : '?뺣???媛??踰붿쐞 泥댄겕? ?명듃 ??議곗젅??泥닿퀎?곸쑝濡?洹쇱쑁 ?섏텞怨??댁셿???대걣?대궡 二쇱뿀?듬땲??'}</p>
              <h2>?앸떒 愿由?轅??& 泥대젰 利앹쭊 ?꾧린</h2>
              <p>?숈옉 ?섎굹?섎굹??吏묒쨷?섏뿬 遺??諛⑹? ?곴낵 洹쇱쑁 ?쒖꽦?붾? 瑗쇨세??泥댄겕??蹂댁떆湲?沅뚯옣?⑸땲?? 留ㅼ씪 袁몄???猷⑦떞 ?섑뻾?쇰줈 ??嫄닿컯?섍퀬 ?먮꼫吏 ?섏튂???띠쓣 ?묒썝?⑸땲??</p>
            `;
            break;
          case 'finance':
            title = `[寃쎌젣] ?ы뀒??轅?뺣낫: ${subject} ?ъ옄媛移?遺꾩꽍 諛??먯궛 ?ы듃?대━??`;
            categoryContentHtml = `
              <h2>?쒖옣 ?몃젋??遺꾩꽍 諛?寃쎌젣??媛移??됯?</h2>
              <p>湲덉쑖 諛?遺?숈궛, 洹몃━怨??먯궛 ?ы듃?대━??痢〓㈃?먯꽌 遺꾩꽍?대낯 <strong>${subject}</strong> ?꾪솴?낅땲?? ${desc ? desc : '理쒖떊 ?붿쑉 ?듦퀎? ?ㅻЪ ?먯궛 ?좊룞???먮쫫???議고뻽?????덉젙?곸씤 ?먯궛 利앹떇 ?섎떒?쇰줈 ?묒슜???ъ?媛 ?덉뒿?덈떎.'}</p>
              <h2>由ъ뒪??愿由?& 遺?섏엯 ?뚯씠?꾨씪???뺤꽦</h2>
              <p>蹂듭옟???섏튂? 踰뺣쪧 ?붽굔???쇰ぉ?붿뿰?섍쾶 ?꾪몴?뷀븯???섏궗寃곗젙 ?띾룄瑜??믪뿬以띾땲?? 寃쎌젣???먯쑀瑜?吏?ν븯???ъ옄?먮뱾???꾪븳 ?좎슜???쒖옣 吏??遺꾩꽍?쇰줈 ?쒖슜?섏떆湲?諛붾엻?덈떎.</p>
            `;
            break;
          case 'news':
            title = `[?쒖궗] ?쇳룊: ${subject}???ы쉶???곸젏怨??ν썑 ?꾨쭩 遺꾩꽍`;
            categoryContentHtml = `
              <h2>?쒖궗 ?댁뒋 ?⑺듃 泥댄겕 諛?以묐┰???됰줎</h2>
              <p>理쒓렐 ?ы쉶??愿?ъ궗濡???먮맂 <strong>${subject}</strong>???낆껜?곸씤 留λ씫怨??꾩븞???쇳룊?⑸땲?? ${desc ? desc : '二쇱슂 二쇱껜 媛꾩쓽 ?由?援щ룄? ?ы쉶???곸젏??媛앷??곸씤 ?⑺듃 以묒떖?쇰줈 瑗쇨세?섍쾶 ?ㅻ（?덉뒿?덈떎.'}</p>
              <h2>二쇱슂 ?곸젏 遺꾩꽍 & ?ы쉶??諛⑺뼢??怨좎같</h2>
              <p>?ㅼ뼇???쒓컖???쇱젏??議고솕濡?쾶 ?ㅻ（硫??ъ븞??吏?덈뒗 ?⑥쓽? ?대쾿??吏?곸씠怨?遺꾩꽍?곸씤 ?ㅼ쑝濡??쇳룊?⑸땲?? ?낆옄遺꾨뱾猿섏꽌 ?꾨챸???щ줎 ?먮떒???대┫ ???덈뒗 ?좊ː???믪? 遺꾩꽍 由ы룷?멸? ?섍린瑜?湲곕??⑸땲??</p>
            `;
            break;
          default:
            title = `${subject} - ?뺣낫 由ы룷??`;
            categoryContentHtml = `<p>?곸꽭 ?댁슜???ы븿??踰붿슜 ?뺣낫 由ы룷?몄엯?덈떎.</p>`;
        }

        body = `
          ${categoryContentHtml}
          <h3>${categoryName} 遺꾩빞 ?듭떖 ?곗씠???붿빟</h3>
          <ul>
            <li><strong>移댄뀒怨좊━:</strong> ${categoryName}</li>
            <li><strong>諛⑸Ц/遺꾩꽍 湲곗???</strong> ${dateStr}</li>
            <li><strong>二쇱슂 ?源??ㅼ썙??</strong> ${kwText}</li>
            ${desc ? `<li><strong>?몃? ?뱀쭠 湲곗닠:</strong> ${desc}</li>` : ''}
            <li><strong>肄섑뀗痢??덉쭏 吏??</strong> 理쒖긽湲?(遺꾩빞蹂?留욎땄 ?붿쭊 ?곸슜)</li>
          </ul>
          
          ${chkFaq.checked ? `<h3>* ${subject} ${categoryName} FAQ</h3>
          <ul>
            <li><strong>Q: ?대떦 移댄뀒怨좊━ 遺꾩빞?먯꽌 ???ъ뒪?낅쭔??李⑤퀎?붾맂 媛移섎뒗 臾댁뾿?멸???</strong><br>A: ?낆옄??痍⑦뼢??諛섏쁺??留욎땄???댁“? 瑗쇨세???⑺듃 泥댄겕 諛?援ъ꽦?낅땲??</li>
            <li><strong>Q: ?댁슜 ??沅뚯옣 ?곸씠 ?덈굹??</strong><br>A: ?ㅼ썙??由ъ뒪?몄씤 ${kwText} 愿???숉뼢??二쇨린?곸쑝濡??쒖슜?섏뿬 ?몃젋?뷀븳 ?ъ??붾떇??痍⑦븯?쒓린 諛붾엻?덈떎.</li>
          </ul>` : ''}
        `;
      }
    }

    return { 
      title, 
      body, 
      seoTitles: [
        title, 
        '핫플레이스 감성 넘치는 요즘 탐방기',
        '사진으로 기록하는 예쁜 찰나의 순간',
        '많은 사람들이 열광하는 이유와 총평',
        '알고 보면 더 매력적인 핵심 체크리스트'
      ],
      seoKeywords: ['감성블로그', '데이트추천', '낭만여행', '분위기맛집', '사진찍기좋은곳', '핫플투어', '인생샷명소', '요즘후기', '내돈내산', '트렌드탐방']
    };
  }

  // ==========================================
  // 10. GENERATED OUTPUT RENDERER
  // ==========================================
  function renderGeneratedOutput() {
    outputContent.classList.remove('hidden');
    
    const formattedDate = inputDate.value ? `?뱟 諛⑸Ц/寃쏀뿕?? ${inputDate.value.replace(/-/g, '. ')}` : '?뱟 諛⑸Ц/寃쏀뿕?? (臾닿?/?앸왂)';
    const kwsToUse = (generatedSeoKeywords && generatedSeoKeywords.length > 0) ? generatedSeoKeywords : keywordsList;
    const tagsHtml = kwsToUse.map(k => k.startsWith('#') ? k : `#${k}`).join(' ');
    
    articleMetaInfo.innerHTML = `
      <span style="margin-right: 14px; color: #94a3b8; font-weight: 500;">${formattedDate}</span>
      <span style="color: #38bdf8; font-weight: 500;">${tagsHtml}</span>
    `;

    articleTitle.textContent = generatedTitle;
    
    if (generatedBody.includes('<h2') || generatedBody.includes('<p>') || generatedBody.includes('<ul')) {
      articleBody.innerHTML = generatedBody;
    } else {
      const formattedParagraphs = generatedBody
        .split('\n\n')
        .map(para => `<p style="margin-bottom: 14px; line-height: 1.8;">${para.replace(/\n/g, '<br>')}</p>`)
        .join('');
      articleBody.innerHTML = formattedParagraphs;
    }

    // SEO 결과 박스 (제목 5개 & 키워드 10개) 인터랙티브 렌더링
    if (seoResultsCard && seoTitleList && seoKeywordGrid) {
      if ((generatedSeoTitles && generatedSeoTitles.length > 0) || (kwsToUse && kwsToUse.length > 0)) {
        seoResultsCard.classList.remove('hidden');
        
        // 추천 제목 Top 5 렌더링
        seoTitleList.innerHTML = '';
        const titlesToUse = (generatedSeoTitles && generatedSeoTitles.length > 0) 
          ? generatedSeoTitles 
          : [generatedTitle, "감성과 낭만이 가득한 특별한 경험 후기", "사진으로 기록하는 소중한 찰나의 순간", "또 가고 싶은 최고의 핫플레이스 탐방기", "알고 가면 더 좋은 핵심 포인트 정리"];
          
        titlesToUse.slice(0, 5).forEach((tItem, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.style.cssText = 'text-align: left; padding: 10px 14px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #f8fafc; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: space-between;';
          btn.innerHTML = `<span><strong style="color:#818cf8; margin-right:8px;">Top ${idx+1}.</strong> ${tItem}</span> <span style="font-size:0.75rem; color:#64748b; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">적용 & 복사</span>`;
          btn.addEventListener('mouseover', () => btn.style.background = 'rgba(99, 102, 241, 0.25)');
          btn.addEventListener('mouseout', () => btn.style.background = 'rgba(30, 41, 59, 0.8)');
          btn.addEventListener('click', () => {
            articleTitle.textContent = tItem;
            generatedTitle = tItem;
            navigator.clipboard.writeText(tItem);
            showToast(`제목이 "${tItem}"(으)로 변경 및 복사되었습니다.`);
          });
          seoTitleList.appendChild(btn);
        });

        // 추천 키워드 10개 렌더링
        seoKeywordGrid.innerHTML = '';
        kwsToUse.slice(0, 10).forEach(kwItem => {
          const cleanKw = kwItem.replace(/^#/, '').trim();
          if (!cleanKw) return;
          const badge = document.createElement('span');
          badge.style.cssText = 'padding: 6px 12px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 20px; font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: all 0.2s;';
          badge.textContent = `#${cleanKw}`;
          badge.addEventListener('mouseover', () => badge.style.background = 'rgba(56, 189, 248, 0.35)');
          badge.addEventListener('mouseout', () => badge.style.background = 'rgba(56, 189, 248, 0.15)');
          badge.addEventListener('click', () => {
            navigator.clipboard.writeText(`#${cleanKw}`);
            showToast(`키워드 #${cleanKw} 가 복사되었습니다.`);
          });
          seoKeywordGrid.appendChild(badge);
        });
      } else {
        seoResultsCard.classList.add('hidden');
      }
    }

    // ?낅줈???ъ쭊??蹂몃Ц 臾몃떒 ?ъ씠??怨좊Ⅴ寃??쎌엯
    insertPhotosIntoArticle();

    updateOutputActionButtons();
  }

  /**
   * ?낅줈?쒕맂 ?ъ쭊?ㅼ쓣 湲 蹂몃Ц??釉붾줉 ?붿냼(p, h2, h3, ul, ol) ?ъ씠??   * 怨좊Ⅴ寃?遺꾩궛 ?쎌엯?쒕떎. ?ъ쭊??N?μ씠硫?蹂몃Ц??N+1 援ш컙?쇰줈 ?섎닠
   * 媛?援ш컙 寃쎄퀎???ъ쭊 1?μ뵫??諛곗튂?쒕떎.
   */
  function insertPhotosIntoArticle() {
    if (uploadedFiles.length === 0) return;

    const blocks = Array.from(articleBody.querySelectorAll('p, h2, h3, ul, ol'));
    if (blocks.length < 2) return; // 臾몃떒???덈Т ?곸쑝硫?留??앹뿉留??ｊ린

    const photoCount = uploadedFiles.length;
    // ?ъ쭊 ?쎌엯 ?꾩튂 ?몃뜳?ㅻ? 洹좊벑 怨꾩궛 (泥?臾몃떒 吏곹썑 ~ 留덉?留?臾몃떒 吏곸쟾)
    const insertIndices = [];
    const gap = blocks.length / (photoCount + 1);
    for (let i = 0; i < photoCount; i++) {
      // gap*(i+1) ?꾩튂??釉붾줉 吏곹썑???쎌엯 (理쒖냼 1踰덉㎏ 臾몃떒 ?ㅻ???
      const idx = Math.min(Math.round(gap * (i + 1)), blocks.length - 1);
      if (!insertIndices.includes(idx)) {
        insertIndices.push(idx);
      }
    }

    // ?ㅼ뿉?쒕????쎌엯?댁빞 ?몃뜳?ㅺ? 瑗ъ씠吏 ?딆쓬
    const sorted = [...insertIndices].sort((a, b) => b - a);
    sorted.forEach((blockIdx, reverseI) => {
      const photoIdx = insertIndices.indexOf(sorted[reverseI]);
      if (photoIdx >= uploadedFiles.length) return;

      const file = uploadedFiles[photoIdx];
      const imgContainer = document.createElement('div');
      imgContainer.className = 'article-inline-photo';
      imgContainer.innerHTML = `
        <img src="${file.previewUrl}" alt="${file.name}" loading="lazy">
        <span class="article-photo-caption">📷 ${file.name} <span class="article-photo-badge">WebP</span></span>
      `;

      const targetBlock = blocks[blockIdx];
      targetBlock.parentNode.insertBefore(imgContainer, targetBlock.nextSibling);
    });
  }

  // ==========================================
  // 11. VIRTUAL SMART EDITOR ONE INJECTION
  // ==========================================
  btnSendToNaver.addEventListener('click', () => {
    naverTitleInput.value = '';
    naverBodyArea.innerHTML = `<p class="naver-placeholder-text" id="naverEditorPlaceholder">湲곗궗 ?섍린湲?踰꾪듉???꾨Ⅴ硫????곸뿭???ъ쭊怨?湲???먮룞?쇰줈 二쇱엯?⑸땲??</p>`;
    btnStartInject.disabled = false;
    btnStartInject.innerHTML = '?뱾 湲곗궗 ?섍린湲?(Auto-inject)';
    
    openModal(naverEditorModal);
  });

  btnCloseNaverEditor.addEventListener('click', () => closeModal(naverEditorModal));

  btnStartInject.addEventListener('click', () => {
    btnStartInject.disabled = true;
    btnStartInject.innerHTML = '??二쇱엯 吏꾪뻾 以?..';
    
    const placeholder = document.getElementById('naverEditorPlaceholder');
    if (placeholder) placeholder.remove();

    let titleCharIdx = 0;
    const titleText = generatedTitle;
    naverTitleInput.value = '';
    
    const titleInterval = setInterval(() => {
      if (titleCharIdx < titleText.length) {
        naverTitleInput.value += titleText[titleCharIdx];
        titleCharIdx++;
      } else {
        clearInterval(titleInterval);
        injectBodyParagraphs();
      }
    }, 40);
  });

  function injectBodyParagraphs() {
    // .article-inline-photo ? JS媛 ?쎌엯???ъ쭊 釉붾줉?대?濡??쒖쇅?섍퀬 ?띿뒪??釉붾줉留??섏쭛
    const paragraphs = Array.from(
      articleBody.querySelectorAll('p, h2, h3, ul, ol')
    ).filter(el => !el.closest('.article-inline-photo'));
    let pIdx = 0;

    // ?ъ쭊 ?쎌엯 ?꾩튂 留ㅽ븨: ?ъ쭊 N?μ쓣 蹂몃Ц 釉붾줉 ?ъ씠??洹좊벑 遺꾩궛
    const photoInsertMap = new Map(); // blockIndex -> photoFileIndex
    if (uploadedFiles.length > 0 && paragraphs.length >= 2) {
      const gap = paragraphs.length / (uploadedFiles.length + 1);
      for (let i = 0; i < uploadedFiles.length; i++) {
        const insertAfter = Math.min(Math.round(gap * (i + 1)), paragraphs.length - 1);
        if (!photoInsertMap.has(insertAfter)) {
          photoInsertMap.set(insertAfter, i);
        }
      }
    } else if (uploadedFiles.length > 0) {
      // 臾몃떒 ?곸쑝硫?泥?臾몃떒 ?ㅼ뿉 1?λ쭔
      photoInsertMap.set(1, 0);
    }
    
    function injectNext() {
      if (pIdx < paragraphs.length) {
        const block = document.createElement('div');
        block.className = 'naver-paragraph';
        
        const sourceNode = paragraphs[pIdx];
        
        if (sourceNode.tagName === 'P') {
          block.innerHTML = sourceNode.innerHTML;
        } else if (sourceNode.tagName.startsWith('H')) {
          const h = document.createElement('h3');
          h.style.fontWeight = 'bold';
          h.style.marginTop = '20px';
          h.style.fontSize = '1.1rem';
          h.innerHTML = sourceNode.innerHTML;
          block.appendChild(h);
        } else {
          block.innerHTML = sourceNode.outerHTML;
        }
        
        naverBodyArea.appendChild(block);
        naverBodyArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
        
        pIdx++;

        // ?꾩옱 pIdx???쎌엯???ъ쭊???덉쑝硫??ъ쭊 二쇱엯 ???ㅼ쓬 臾몃떒 吏꾪뻾
        if (photoInsertMap.has(pIdx)) {
          const photoIdx = photoInsertMap.get(pIdx);
          const file = uploadedFiles[photoIdx];
          setTimeout(() => {
            const imgBox = document.createElement('div');
            imgBox.className = 'naver-img-box';
            imgBox.innerHTML = `
              <img src="${file.previewUrl}" alt="${file.name}">
              <span class="naver-img-caption">📷 ${file.name} [WebP ${file.webpSize ? formatFileSize(file.webpSize) : ''}]</span>
            `;
            naverBodyArea.appendChild(imgBox);
            naverBodyArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
            
            setTimeout(injectNext, 800);
          }, 600);
        } else {
          setTimeout(injectNext, 500);
        }
      } else {
        btnStartInject.innerHTML = '???꾩넚 ?꾨즺';
        showToast('?ㅼ씠踰??먮뵒??蹂몃Ц ?먮룞 二쇱엯 ?꾨즺!');
      }
    }
    
    injectNext();
  }

  btnNaverPublish.addEventListener('click', () => {
    closeModal(naverEditorModal);
    showToast('?럦 異뺥븯?⑸땲?? ?ㅼ씠踰?釉붾줈洹몄뿉 ?ъ뒪?낆씠 諛쒗뻾?섏뿀?듬땲?? (泥댄뿕 ?꾨즺)');
  });

  btnNaverSave.addEventListener('click', () => {
    showToast('?ㅼ씠踰??먮뵒???꾩떆??ν븿???ъ뒪?멸? ?덉쟾?섍쾶 ??λ릺?덉뒿?덈떎.');
  });

  // ==========================================
  // 12. COPY ACTIONS (蹂몃Ц 蹂듭궗 & HTML 蹂듭궗)
  // ==========================================
  
  // Plain text copy with title and tags
  btnCopyText.addEventListener('click', () => {
    const rawText = articleBody.innerHTML;
    // Format paragraph breaks and remove HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawText;
    
    // Replace divs/paragraphs with newlines for clean copying
    tempDiv.querySelectorAll('p, h2, h3, li').forEach(el => {
      el.innerHTML = el.innerHTML + '\n';
    });
    
    const plainBody = tempDiv.textContent.trim();
    const tagsText = keywordsList.map(k => `#${k}`).join(' ');

    const fullText = `[?쒕ぉ]
${generatedTitle}

[蹂몃Ц]
${plainBody}

[?쒓렇]
${tagsText}`;

    navigator.clipboard.writeText(fullText).then(() => {
      showToast('?ъ뒪???꾩껜 ?띿뒪?멸? ?대┰蹂대뱶??蹂듭궗?섏뿀?듬땲?? 留덉슦???쒕옒洹??놁씠 諛붾줈 蹂듭궗 ?꾨즺!');
    }).catch(err => {
      console.error(err);
      showToast('蹂듭궗 ?ㅽ뙣. 蹂몃Ц??吏곸젒 ?쒕옒洹명븯??蹂듭궗??二쇱꽭??');
    });
  });

  // HTML Source code copy
  btnCopyHtml.addEventListener('click', () => {
    const tagsHtml = keywordsList.map(k => `<span>#${k}</span>`).join(' ');
    const fullHtml = `<!-- photoBlog V2 Generated Post -->
<div class="photoblog-post">
  <div class="photoblog-meta">
    <p>諛⑸Ц?? ${inputDate.value.replace(/-/g, '. ')}</p>
    <p class="photoblog-tags">${tagsHtml}</p>
  </div>
  <h1 class="photoblog-title">${generatedTitle}</h1>
  <div class="photoblog-body">
    ${generatedBody}
  </div>
</div>`;

    navigator.clipboard.writeText(fullHtml).then(() => {
      showToast('HTML 肄붾뱶媛 蹂듭궗?섏뿀?듬땲?? 釉붾줈洹?HTML ?몄쭛李쎌뿉 遺숈뿬?ｊ린 ?섏꽭??');
    }).catch(err => {
      console.error(err);
      showToast('?대┰蹂대뱶 蹂듭궗 ?ㅽ뙣. 吏곸젒 ?쒕옒洹명븯??蹂듭궗?댁＜?쒓린 諛붾엻?덈떎.');
    });
  });

});



// ======== Added by Antigravity ========
if (document.getElementById('mainApiKey')) {
  document.getElementById('mainApiKey').value = apiKey;
  document.getElementById('mainApiKey').addEventListener('input', (e) => {
    apiKey = e.target.value.trim();
    localStorage.setItem('photoblog_api_key', apiKey);
    if (document.getElementById('settingsApiKey')) document.getElementById('settingsApiKey').value = apiKey;
    if (typeof updateSettingsStatus === 'function') updateSettingsStatus();
  });
}

window.setQuickDate = function(days) {
  const input = document.getElementById('inputDate');
  if (!input) return;
  if (days === '') {
    input.value = '';
    return;
  }
  const d = new Date();
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset() * 60000;
  input.value = (new Date(d - offset)).toISOString().slice(0, 10);
};
// ======================================
