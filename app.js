/* ── app.js — photoBlog Core Controller (Gemini API & WebP Converter) ── */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. 상태 및 전역 변수 초기화
  // ==========================================
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

  // Set default date to today
  const today = new Date().toISOString().substring(0, 10);
  inputDate.value = today;

  // ==========================================
  // 2. CURSOR GLOW EFFECT (마우스 광원 애니메이션)
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
    showToast('Gemini API 설정이 저장되었습니다.');
  });

  btnResetSettings.addEventListener('click', () => {
    settingsApiKey.value = '';
    settingsModel.value = 'gemini-3.1-pro-preview';
    apiKey = '';
    selectedModel = 'gemini-3.1-pro-preview';
    localStorage.removeItem('photoblog_api_key');
    localStorage.removeItem('photoblog_model');
    updateSettingsStatus();
    showToast('설정이 초기화되었습니다.');
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
      text.textContent = 'API 온라인 연결 상태';
    } else {
      dot.className = 'status-dot status-offline';
      text.textContent = '로컬 데모(체험) 모드로 활성화 상태';
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
          showToast('.env 파일에서 Gemini API Key를 로드했습니다.', 3000);
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
      const originalSize = file.size; // 원본 파일 바이트 크기 저장
      const reader = new FileReader();
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
          
          // WebP base64 데이터의 실제 바이트 크기 계산
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

  // 바이트를 사람이 읽기 쉬운 문자열로 변환
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

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  async function handleFiles(files) {
    if (files.length === 0) return;
    activeDemoPreset = null; // Clear preset state on manual upload

    const fileArray = Array.from(files);
    const totalCount = fileArray.length;
    let processedCount = 0;

    showToast(`${totalCount}장의 이미지를 WebP로 변환 중...`);

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드 가능합니다.');
        continue;
      }
      if (uploadedFiles.length >= 10) {
        showToast('사진은 최대 10장까지만 업로드할 수 있습니다.');
        break;
      }

      try {
        const webpFile = await convertToWebp(file);
        uploadedFiles.push(webpFile);
        processedCount++;
        renderPreviews();
        showToast(`(${processedCount}/${totalCount}) '${webpFile.name}' 변환 완료! (${formatFileSize(webpFile.originalSize)} → ${formatFileSize(webpFile.webpSize)}, -${webpFile.compressionRate}%)`);
      } catch (err) {
        console.error(err);
        showToast(`'${file.name}' 변환 중 오류가 발생했습니다.`);
      }
    }
  }

  function renderPreviews() {
    previewGrid.innerHTML = '';
    if (uploadedFiles.length > 0) {
      previewContainer.classList.remove('hidden');

      // 전체 용량 요약 표시
      const totalOriginal = uploadedFiles.reduce((sum, f) => sum + (f.originalSize || 0), 0);
      const totalWebp = uploadedFiles.reduce((sum, f) => sum + (f.webpSize || 0), 0);
      const totalRate = totalOriginal > 0 ? Math.max(0, Math.round((1 - totalWebp / totalOriginal) * 100)) : 0;

      // 요약 배너 생성 (기존 요소가 있으면 재생성)
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
        const sizeInfo = file.originalSize
          ? `${formatFileSize(file.webpSize)}`
          : '';
        item.innerHTML = `
          <img src="${file.previewUrl}" alt="${file.name}">
          <button class="preview-remove" data-index="${index}">&times;</button>
          <div class="preview-badges">
            <span class="webp-badge">WebP</span>
            ${sizeInfo ? `<span class="size-badge">${sizeInfo}</span>` : ''}
          </div>
        `;
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
    showToast('사진이 모두 삭제되었습니다.');
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
      showToast('분석할 사진을 최소 1장 업로드하거나 데모 시나리오를 선택해주세요.');
      return;
    }

    btnExtractKeywords.disabled = true;
    btnExtractKeywords.textContent = '추출 중...';

    const parisKeywords = ['파리여행', '에펠탑야경', '프랑스감성여행', '에펠탑카페', '유럽자유여행'];
    const orangeryKeywords = ['파리오랑주리', '식물원카페추천', '파주드라이브코스', '파주카페추천', '온실카페'];
    const genericKeywords = ['일상블로그', '데이트코스추천', '감성스토리', '주말나들이', '분위기좋은곳'];

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
        showToast('API 오류로 인해 기본 키워드를 로드합니다.');
        keywordsList = [...new Set([...keywordsList, ...genericKeywords])];
      }
    } else {
      // Demo mock delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      let demoKws = genericKeywords;
      if (activeDemoPreset === 'paris' || inputSubject.value.includes('파리') || inputSubject.value.includes('에펠')) {
        demoKws = parisKeywords;
      } else if (activeDemoPreset === 'orangery' || inputSubject.value.includes('오랑주리') || inputSubject.value.includes('파주')) {
        demoKws = orangeryKeywords;
      }
      keywordsList = [...new Set([...keywordsList, ...demoKws])];
    }

    renderKeywordTags();
    btnExtractKeywords.disabled = false;
    btnExtractKeywords.textContent = 'AI 키워드 추출';
    showToast('AI 키워드 추출이 완료되었습니다.');
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
    
    inputSubject.value = '프랑스 파리 에펠탑 감성 여행';
    inputDate.value = '2026-06-15';
    inputDesc.value = '에펠탑 근처 골목 카페에서 맛있는 에스프레소 한 잔. 노을이 질 무렵 붉게 물들어가는 에펠탑 전망이 가슴 깊이 남는 감동과 낭만적인 밤이었음.';
    keywordsList = ['파리여행', '에펠탑야경', '프랑스감성'];
    renderKeywordTags();

    uploadedFiles = [];
    renderPreviews();
    
    showToast('파리 에펠탑 프리셋 이미지 로딩 및 WebP 변환 중...');
    const fileObj = await loadPresetImageToBase64('assets/paris_travel.png', 'paris_travel.png');
    uploadedFiles.push(fileObj);
    renderPreviews();
    showToast('파리 에펠탑 WebP 변환 및 프리셋 데이터 로드 완료!');
  });

  presetOrangery.addEventListener('click', async () => {
    activeDemoPreset = 'orangery';
    presetOrangery.classList.add('active');
    presetParis.classList.remove('active');

    inputSubject.value = '파주 오랑주리 식물원 카페';
    inputDate.value = '2026-07-10';
    inputDesc.value = '온실을 그대로 통째로 옮겨놓은 듯한 거대한 식물원 카페. 내부의 우거진 초록 식물들과 졸졸 흐르는 연못, 그리고 시그니처 오렌지 에이드가 청량하고 힐링 가득했음.';
    keywordsList = ['파주오랑주리', '식물원카페추천', '파주데이트코스'];
    renderKeywordTags();

    uploadedFiles = [];
    renderPreviews();

    showToast('오랑주리 카페 프리셋 이미지 로딩 및 WebP 변환 중...');
    const fileObj = await loadPresetImageToBase64('assets/orangery_cafe.png', 'orangery_cafe.png');
    uploadedFiles.push(fileObj);
    renderPreviews();
    showToast('오랑주리 카페 WebP 변환 및 프리셋 데이터 로드 완료!');
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
        showToast(`'${file.name}' 참고 문서 내용이 텍스트 영역에 자동 붙여넣기 되었습니다.`);
      };
      reader.onerror = () => {
        showToast('문서 파일을 읽는 중 오류가 발생했습니다.');
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
      
      // 카테고리별 저장된 모델이 있으면 동기화, 없으면 기본 모델 적용
      if (categoryEngineMap[currentCategory]) {
        selectCategoryEngine.value = categoryEngineMap[currentCategory];
      } else {
        selectCategoryEngine.value = selectedModel || 'gemini-3.1-pro-preview';
      }
      showToast(`[${tab.textContent.trim()}] 카테고리 및 맞춤 AI 엔진이 선택되었습니다.`);
    });
  });

  if (selectCategoryEngine) {
    selectCategoryEngine.addEventListener('change', () => {
      categoryEngineMap[currentCategory] = selectCategoryEngine.value;
      localStorage.setItem('photoblog_cat_engines', JSON.stringify(categoryEngineMap));
      showToast(`[${currentCategory}] 카테고리 엔진이 '${selectCategoryEngine.value}'(으)로 지정되었습니다.`);
    });
  }

  function updateOutputActionButtons() {
    if (outputContent.classList.contains('hidden')) return;
    // 모든 액션 버튼(텍스트 복사, HTML 복사, 네이버 에디터 전송)을 항상 유연하게 제공
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
            { text: `다음 블로그 글 정보와 첨부된 사진들을 기반으로, 검색 엔진 최적화(SEO) 및 네이버 연관 검색에 잘 잡힐 수 있는 단어 위주의 핵심 태그(키워드)를 5개만 골라 한글 단어 형태로 쉼표로 구분해 출력해줘. 예시: 파주카페,식물원카페,데이트코스
주제: ${inputSubject.value}
추가 묘사: ${inputDesc.value}` },
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
      throw new Error(`[구글 API 에러] ${response.status}: ${errMsg}`);
    }
    
    const data = await response.json();
    const txt = data.candidates[0].content.parts[0].text.trim();
    return txt.split(',').map(s => s.trim().replace(/#/g, '')).filter(Boolean);
  }

  btnGenerate.addEventListener('click', async () => {
    if (uploadedFiles.length === 0 && !activeDemoPreset) {
      showToast('블로그 글을 작성하려면 최소 1장의 사진을 업로드해주세요.');
      return;
    }
    if (!inputSubject.value.trim()) {
      showToast('블로그 글의 주제 또는 장소명을 입력해주세요.');
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
        loadingStatus.textContent = '사진 속 매장 레이아웃, 조명, 색상 요소를 추출하고 있습니다...';
      } else if (progress < 85) {
        loadingStatus.textContent = '선택한 블로그 최적화 템플릿과 프롬프트를 융합하여 원고를 설계하고 있습니다...';
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
        showToast('블로그 포스트가 성공적으로 생성되었습니다!');
      }, 500);

    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      outputLoading.classList.add('hidden');
      outputPlaceholder.classList.remove('hidden');
      btnGenerate.disabled = false;
      showToast(`글 생성 에러: ${error.message}`, 6000);
    }
  });

  async function generateBlogWithGemini() {
    // 카테고리 한글명 매핑
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

    // 카테고리별 특화 어조
    let categoryToneInstruction = '';
    switch (currentCategory) {
      case 'restaurant':
        categoryToneInstruction = '맛집/푸드 분야: 시각과 미각을 돋우는 군침 도는 묘사를 가득 담    const humanizeRule = `[★ 휴먼 페르소나 필수]: 인위적인 AI 말투(~것으로 추정됩니다, ~합니다 등 기계적 어투)를 완벽히 버리세요. 실제 사람이 현장에서 오감을 통해 느낀 감정, 실수담, 놀라움, 진짜 만족했던 부분 등 '휴먼 페르소나'를 200% 담아내어 진짜 사람이 쓴 것 같은 생명력을 불어넣으세요.`;

    const dateRule = inputDate.value 
      ? `[★ 방문/경험 날짜 처리]: 입력된 날짜는 '${inputDate.value}'입니다. 단, 글의 흐름 상 날짜가 크게 중요하지 않거나 굳이 언급할 필요가 없는 주제라면 억지로 날짜를 쓰지 말고 자연스럽게 생략하세요.`
      : `[★ 방문/경험 날짜 처리]: 날짜가 입력되지 않았으므로 날짜 언급 없이 자연스럽게 구성하세요.`;

    const descRule = inputDesc.value
      ? `[★ 직접 경험 / 휴먼 페르소나 디테일 (최우선 반영)]: """${inputDesc.value}"""\n이 사용자의 생생한 직접 경험과 감상 디테일을 본문 곳곳에 가장 자연스럽고 비중 있게 녹여내어 리얼 후기로 완성하세요.`
      : '';

    const articleRule = inputArticle && inputArticle.value
      ? `[★ 참고 기사 원문 / 참조 문서 팩트 기반 작성 (최우선 반영)]: """${inputArticle.value}"""\n위 참고 기사 또는 문서의 팩트와 핵심 정보를 정확히 참조하고 인용하여 전문적이고 심도 있는 글로 작성하세요. 절대 사실을 왜곡하거나 지어내지 마세요.`
      : '';

    const prompt = `당신은 국내 탑티어 블로그 인플루언서이자 SEO 콘텐츠 전문가입니다. 첨부된 이미지들과 참고 자료, 그리고 다음 설정값들에 맞추어 포스팅을 작성하세요.

[기본 설정]
- 카테고리 분야: ${categoryName} (${categoryToneInstruction})
- 공통 톤&매너 (말투): ${toneInstruction}
- 핵심 주제 / 장소 / 대상: ${inputSubject.value || '첨부 사진 기반 자연스러운 주제'}

[작성 지침 및 지시사항]
1. 첨부된 이미지들을 정밀하게 분석(Vision)하여 피사체의 색감, 질감, 분위기, 디테일을 본문 중간중간에 생생하게 묘사하세요.
2. ${dateRule}
3. ${descRule}
4. ${articleRule}
5. ${humanizeRule}
6. 본문 내용과 카테고리에 완벽히 부합하는 핵심 검색 키워드 10개를 스스로 추출하고, 본문 중간중간에 자연스럽게 녹여내어 검색 엔진 노출 점수를 극대화하세요.`;��극 포인트를 설명하는 동기부여 어조';
        break;
      case 'finance':
        categoryToneInstruction = '경제/재테크/비즈니스 분야: 냉철하고 정보 집약적이며 수치와 인사이트를 명확히 정리하는 신뢰의 어조';
        break;
      case 'news':
        categoryToneInstruction = '시사/경제/정치 분야: 중립적이고 팩트 중심적인 정중한 평론 및 뉴스 평론가 어조';
        break;
      default:
        categoryToneInstruction = '전문적이고 정갈한 블로그 인플루언서 어조';
    }

    // 전 카테고리 공통 톤/매너 (블로그 말투) 100% 반영
    let toneInstruction = '';
    const toneVal = selectBlogTone.value;
    switch (toneVal) {
      case 'emotional':
        toneInstruction = '인스타 감성의 따뜻하고 감성적인 존댓말 일상체 (~했답니다, ~인 것 같아요 등 따스한 어조)';
        break;
      case 'seo':
        toneInstruction = '정확한 정보 중심 및 검색어 노출 가중치를 높이는 객관적 전문 정보체 (소제목 및 불릿 리스트 적극 활용)';
        break;
      case 'friendly':
        toneInstruction = '이웃 블로거들과 대화하듯 소소하고 다정다감한 이웃 소통체 (~추천해 드려요!, ~했나요? 등)';
        break;
      case 'formal':
        toneInstruction = '깔끔하고 신뢰감을 주는 정중한 격식 리뷰체 (~합니다, ~로 판단됩니다 등 진중한 어조)';
        break;
      case 'humorous':
        toneInstruction = '유쾌한 유머와 재치 넘치는 구어체 (적절한 밈과 풍부한 이모지 가득 스타일)';
        break;
      case 'casual_informal':
        toneInstruction = '일기장 쓰듯 솔직하고 자연스러운 내돈내산 일기체 (~했다, ~였다 등 가벼운 반말/존댓말 혼용 독백체)';
        break;
      default:
        toneInstruction = '정갈하고 편안한 블로그 어조';
    }

    let humanizeRule = '';
    if (chkHumanize.checked) {
      humanizeRule = `[★ 휴먼 페르소나 필수]: 인위적인 AI 말투(~것으로 추정됩니다, ~합니다 등 기계적 어투)를 완벽히 버리세요. 실제 사람이 현장에서 오감을 통해 느낀 감정, 실수담, 놀라움, 진짜 만족했던 부분 등 '휴먼 페르소나'를 200% 담아내어 진짜 사람이 쓴 것 같은 생명력을 불어넣으세요.`;
    }

    const dateRule = inputDate.value 
      ? `[★ 방문/경험 날짜 처리]: 입력된 날짜는 '${inputDate.value}'입니다. 단, 글의 흐름 상 날짜가 크게 중요하지 않거나 굳이 언급할 필요가 없는 주제라면 억지로 날짜를 쓰지 말고 자연스럽게 생략하세요.`
      : `[★ 방문/경험 날짜 처리]: 날짜가 입력되지 않았으므로 날짜 언급 없이 자연스럽게 구성하세요.`;

    const descRule = inputDesc.value
      ? `[★ 직접 경험 / 휴먼 페르소나 디테일 (최우선 반영)]: """${inputDesc.value}"""\n이 사용자의 생생한 직접 경험과 감상 디테일을 본문 곳곳에 가장 자연스럽고 비중 있게 녹여내어 리얼 후기로 완성하세요.`
      : '';

    const articleRule = inputArticle && inputArticle.value
      ? `[★ 참고 기사 원문 / 참조 문서 팩트 기반 작성 (최우선 반영)]: """${inputArticle.value}"""\n위 참고 기사 또는 문서의 팩트와 핵심 정보를 정확히 참조하고 인용하여 전문적이고 심도 있는 글로 작성하세요. 절대 사실을 왜곡하거나 지어내지 마세요.`
      : '';

    const faqRule = chkFaq.checked 
      ? `글 하단에는 방문자나 독자들에게 실질적으로 도움이 될 만한 꿀팁성 FAQ 코너(Q1, Q2, Q3 형식)를 3개 작성해 주세요.` 
      : '';

    const prompt = `당신은 국내 탑티어 블로그 인플루언서이자 SEO 콘텐츠 전문가입니다. 첨부된 이미지들과 참고 자료, 그리고 다음 설정값들에 맞추어 포스팅을 작성하세요.

[기본 설정]
- 카테고리 분야: ${categoryName} (${categoryToneInstruction})
- 공통 톤&매너 (말투): ${toneInstruction}
- 핵심 주제 / 장소 / 대상: ${inputSubject.value || '첨부 사진 기반 자연스러운 주제'}
- 타겟 키워드: ${keywordsList.join(', ')}

[작성 지침 및 지시사항]
1. 첨부된 이미지들을 정밀하게 분석(Vision)하여 피사체의 색감, 질감, 분위기, 디테일을 본문 중간중간에 생생하게 묘사하세요.
2. ${dateRule}
3. ${descRule}
4. ${articleRule}
5. ${humanizeRule}
6. 타겟 키워드가 본문에 자연스럽게 4~6회 흩뿌려지도록 설계하여 검색 엔진 노출 점수를 높이세요.
7. ${faqRule}

[★ 최종 출력 포맷 필수 규칙 (정확히 지켜주세요)]:
출력은 반드시 다음 3개 섹션 태그로 명확히 나누어 출력해야 합니다.

[SEO_TITLES]
1. (SEO 검색에 최적화되고 클릭을 유도하는 매력적인 제목 1)
2. (제목 2)
3. (제목 3)
4. (제목 4)
5. (제목 5)

[SEO_KEYWORDS]
#키워드1, #키워드2, #키워드3, #키워드4, #키워드5, #키워드6, #키워드7, #키워드8, #키워드9, #키워드10

[MAIN_CONTENT]
[TITLE]: (위 5개 제목 중 가장 완벽하고 훌륭한 최종 대표 제목 1개)
(여기서부터 블로그 본문 작성. 티스토리/워드프레스/네이버에 바로 쓰기 좋도록 H2, H3, P, UL, LI 등 마크업 태그를 적절히 활용하고, 중간중간 사진이 들어갈 위치에 <img src="assets/대표이미지.png" alt="사진 묘사"> 태그를 적어도 1~3개 삽입해주세요.)`;

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
      throw new Error(`[구글 API 에러] ${response.status}: ${errMsg}`);
    }
    
    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text.trim();
    
    let seoTitles = [];
    let seoKeywords = [];
    let title = '인증된 포스트 제목';
    let body = rawText;
    
    // 파싱 로직
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
    } else if (body.includes('\n') && title === '인증된 포스트 제목') {
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

    // ── 프리셋: 파리 에펠탑 ──
    if (isParis) {
      if (isSnap) {
        if (isEmotional) {
          title = "주황빛 노을과 낭만 한 잔, 프랑스 파리 에펠탑 감성 여행 후기 🇫🇷";
          body = `솔직히 고백하자면, 저는 파리에 로망이 그렇게 크지 않은 사람이었어요. 하지만 노을 지는 해질녘, 에펠탑을 눈앞에 마주한 그 찰나의 순간 모든 생각이 뒤바뀌었답니다. 하늘이 마치 주황빛 물감을 풀어놓은 것처럼 붉게 물들어가는 가운데 웅장하게 서 있는 에펠탑의 모습은 그 자체로 거대한 감동이었어요.

에펠탑 주변의 아기자기한 골목길들을 따라 걷다 보니, 작은 파리 노천 카페가 눈에 들어오더라고요. 테라스에 자리를 잡고 에스프레소 한 잔을 시켜서 홀짝이는데, 쌉싸름한 커피 향 위로 스치는 가을바람과 이국적인 거리가 너무나 낭만적이었답니다.

어스름이 짙어지고 드디어 에펠탑에 노란 전구 조명들이 반짝반짝 켜지는 순간에는 정말 심장이 쿵 하고 내려앉는 줄 알았어요. 화려하게 반짝이는 금빛 타워 아래에서 걷는 밤길은 마치 영화 속 주인공이 된 듯한 착각을 주기에 충분했답니다.

${chkFaq.checked ? `<h3>❓ 파리 에펠탑 여행 FAQ</h3>
<p><strong>Q1. 에펠탑 노을 감상 베스트 스팟은?</strong><br>샤요 궁 광장에서 정면 뷰를 추천합니다.<br><br><strong>Q2. 골목 카페 추천 메뉴가 있나요?</strong><br>에스프레소와 크루아상 조합을 강추해요!<br><br><strong>Q3. 소매치기 예방 꿀팁?</strong><br>가방을 앞으로 메고, 스마트폰에 손목 스트랩을 연결하세요.</p>` : ''}`;
        } else {
          title = "파리 에펠탑 명당 뷰 & 주변 골목 카페 코스 총정리";
          body = `프랑스 파리 자유여행의 핵심 코스, **파리 에펠탑**과 주변 골목 카페 탐방 정보를 정리합니다.

**1. 에펠탑 노을 스팟 및 시간대**
일몰 30분 전 샤요 궁 도착을 권장합니다. 주황빛 선셋과 골목길 조명이 어우러지는 골든타임입니다.

**2. 에펠탑 근처 로컬 카페 추천**
- 위치: 에펠탑 도보 7분 거리 골목
- 대표 메뉴: 에스프레소, 프렌치 크루아상

${chkFaq.checked ? `<h3>❓ 프랑스 파리 여행 FAQ</h3>
<p><strong>Q1. 라이트업 조명쇼 시간은?</strong><br>매일 일몰 후 정각부터 5분간 운영.<br><br><strong>Q2. 카페 예산은?</strong><br>에스프레소 기준 3~5유로 선.<br><br><strong>Q3. 카드 결제 편리한가요?</strong><br>대부분 해외 체크카드 결제 가능합니다.</p>` : ''}`;
        }
      } else {
        title = "낭만이 가득한 도시 파리 여행, 에펠탑 노을과 골목 카페 감성";
        body = `<h2>붉게 물든 하늘 아래, 에펠탑을 마주하다</h2>
<p>해가 저물어갈 즈음 파리의 스카이라인을 배경으로 웅장하게 서 있는 에펠탑은 넋을 놓게 만드는 매력이 있습니다.</p>

<h2>골목길 카페에서 만난 에스프레소 한 잔</h2>
<p>에펠탑 구경 후 골목 안쪽의 노천 카페에서 진한 에스프레소를 즐겨보세요.</p>

<h3>파리 여행 코스 꿀팁</h3>
<ul>
  <li><strong>추천 시간대:</strong> 일몰 직전 (오후 6시~8시)</li>
  <li><strong>추천 스팟:</strong> 샤요 궁전 테라스</li>
</ul>

${chkFaq.checked ? `<h3>❓ 파리 자유여행 FAQ</h3>
<ul>
  <li><strong>Q: 전망대 예약 필수?</strong><br>A: 성수기에는 사전 예매가 유리합니다.</li>
</ul>` : ''}`;
      }

    // ── 프리셋: 파주 오랑주리 ──
    } else if (isOrangery) {
      if (isSnap) {
        if (isEmotional) {
          title = "거대한 온실 속 초록빛 힐링 공간, 파주 오랑주리 식물원 카페 🌿";
          body = `바쁜 일상 속에서 숨이 탁 막힐 때, 저는 지난 주말 초록 가득한 **파주 오랑주리**에 다녀왔어요. 문을 열고 들어서는 순간, 울창한 열대림 속에 들어온 것처럼 맑은 공기와 풀 냄새가 온몸을 감싸더라고요.

카페 천장이 거대한 유리 온실 돔으로 되어 있어서 화사한 햇살이 쏟아져 내렸어요. 파릇파릇한 초록 식물들과 키 큰 야자수, 그리고 실내 중앙의 조그만 연못까지!

시그니처 **오렌지 에이드**는 청량함의 끝판왕이었어요! 머무는 내내 힐링 가득 행복한 주말이었답니다.

${chkFaq.checked ? `<h3>❓ 파주 오랑주리 카페 FAQ</h3>
<p><strong>Q1. 주차 편한가요?</strong><br>매장 앞 전용 주차장 있고, 음료 주문 시 3시간 무료.<br><br><strong>Q2. 반려동물 가능?</strong><br>목줄 착용 시 일부 구역 동반 가능.<br><br><strong>Q3. 베스트 촬영 스팟?</strong><br>실내 중앙 나무 흔들다리 위가 인생 샷 포인트!</p>` : ''}`;
        } else {
          title = "파주 식물원 카페 [오랑주리] 솔직 후기 - 주차, 메뉴, 온실 정보";
          body = `경기도 파주 드라이브 코스 대형 온실형 카페, **오랑주리**에 다녀왔습니다.

**1. 찾아가는 길 및 주차 정보**
- 주소: 경기 파주시 광탄면 기산로 329
- 주차: 매장 앞 대규모 주차 구역 (카페 이용 시 3시간 무료)

**2. 실내 정원 스케일**
높은 층고의 유리 천장, 관엽식물, 연못과 시냇물 소리가 어우러진 공간입니다.

**3. 시그니처 메뉴**
- 대표: 오렌지 에이드 — 생과일 슬라이스가 듬뿍

${chkFaq.checked ? `<h3>❓ 오랑주리 FAQ</h3>
<p><strong>Q1. 주말 대기 시간?</strong><br>피크 타임(14~16시) 피하고 오전 11시 추천.<br><br><strong>Q2. 비 오는 날도 괜찮나요?</strong><br>실내 온실이라 사계절 쾌적합니다.<br><br><strong>Q3. 아이 동반?</strong><br>연못과 물고기가 있어 아이들이 좋아합니다.</p>` : ''}`;
        }
      } else {
        title = "파주 식물원 카페 오랑주리, 도심 속 온실 정원에서 즐기는 주말 힐링";
        body = `<h2>자연을 품은 거대한 실내 온실형 정원 카페</h2>
<p>경기도 파주의 랜드마크, 식물원 카페 **오랑주리**에 다녀왔습니다. 높은 천장을 가득 채운 열대 야자수, 흐르는 연못까지 싱그러운 자연 속에 들어온 듯합니다.</p>

<h2>숲속 공간에서의 상큼한 오렌지 에이드 한 잔</h2>
<p>시그니처 오렌지 에이드를 들이켜니 가슴속까지 청량한 기운이 채워졌습니다.</p>

<h3>핵심 체크포인트</h3>
<ul>
  <li><strong>주차:</strong> 전용 주차장 (영수증 인증 시 3시간 무료)</li>
  <li><strong>포토존:</strong> 실내 중앙 연못 다리 위</li>
</ul>

${chkFaq.checked ? `<h3>❓ 오랑주리 카페 FAQ</h3>
<ul>
  <li><strong>Q: 음료 가격대?</strong><br>A: 아메리카노 8천 원대. 정원 유지비 포함이라 납득 가능합니다.</li>
</ul>` : ''}`;
      }

    // ── 범용: 사용자가 직접 입력한 주제/설명 기반 동적 생성 ──
    } else {
      const subject = inputSubject.value.trim() || '나의 특별한 경험';
      const desc = inputDesc.value.trim();
      const dateStr = inputDate.value ? inputDate.value.replace(/-/g, '. ') : '오늘';
      const kwText = keywordsList.length > 0 ? keywordsList.join(', ') : subject;
      const photoCount = uploadedFiles.length;
      const photoText = photoCount > 0 ? `(업로드된 ${photoCount}장의 사진 기반)` : '';

      if (isSnap) {
        switch (toneVal) {
          case 'emotional':
            title = `[감성일상] ${subject}에 머물다, 소소하고 소중했던 순간의 기록`;
            body = `따사로운 햇살을 받으며 다녀온 ${subject}에서의 하루를 조심스레 남깁니다. ${photoText}
            
${desc ? `이곳에서 경험한 "${desc}"의 기억은 일상에서 큰 환기가 되었습니다. 사진으로 다시 꺼내보아도 참 기분이 좋아집니다.` : '첫 걸음을 디디는 순간 공간 전체에 은은하게 풍기는 특유의 아늑한 조명과 분위기가 매력적이었습니다.'}
            
소중한 힐링을 한 기분이어서 카메라 셔터를 쉴 새 없이 눌렀습니다. 바쁜 매일 속에서 작은 쉼표를 찾고 계신다면 가볍게 권해 드립니다.

${chkFaq.checked ? `<h3>* ${subject} 감성 FAQ</h3>
<p><strong>Q1. 언제 방문하는 것이 분위기가 좋나요?</strong><br>햇살이 부드럽게 내리쬐는 늦은 오후 시간대를 적극 추천합니다.<br><br><strong>Q2. 방문 전 알아둘 팁이 있나요?</strong><br>여유롭게 공간의 아늑한 소리와 정취에 집중해보시기 바랍니다.<br><br><strong>Q3. 사진이 잘 나오는 감성 스팟은요?</strong><br>자연광이 살짝 들어오는 창가 근처나 소품이 예쁘게 모여있는 벽면이 좋습니다.</p>` : ''}`;
            break;

          case 'seo':
            title = `[정보] ${subject} 솔직 후기 - 위치, 주차, 이용 꿀팁 총정리`;
            body = `방문객 분들을 위해 ${dateStr}에 직접 경험한 ${subject} 핵심 정보를 가독성 높은 정리글로 전달합니다. ${photoText}

1. ${subject} 기본 분석
- 방문 일자: ${dateStr}
- 주요 키워드: ${kwText}
${desc ? `- 현장 실사용 상세 내용: ${desc}` : '- 상세 특징: 깔끔하고 현대적인 시설 관리'}

2. 추천 활용도
데이트 코스나 드라이브 연계 코스로 활용하기에 아주 용이한 구성을 취하고 있습니다. 피크 타임에는 대기열이 있을 수 있으니 정오 이전에 방문하시는 편을 권장합니다.

${chkFaq.checked ? `<h3>* ${subject} 안내 FAQ</h3>
<p><strong>Q1. 이용 시 요금이나 예산 수준은 어떠한가요?</strong><br>공간 인프라와 콘텐츠 대비 충분히 합리적이며 지출할 만한 예산 범위입니다.<br><br><strong>Q2. 대기줄이나 혼잡 시간대는 언제인가요?</strong><br>오후 2시 전후가 가장 혼잡하므로 오전 시간대를 활용하시면 쾌적하게 이용하실 수 있습니다.<br><br><strong>Q3. 차량 주차가 원활한 편인가요?</strong><br>연계된 전용 주차 공간이나 주변 공용 주차장이 완비되어 수월합니다.</p>` : ''}`;
            break;

          case 'friendly':
            title = `[이웃추천] 대박 만족! 완전 대만족했던 ${subject} 소개해요!`;
            body = `이웃님들 안녕하셔요! 지난 ${dateStr}에 드디어 벼르던 ${subject}에 방문했답니다! 완전 제 스타일인 거 있죠? ${photoText}

${desc ? `특히 대박 추천하고 싶었던 부분은 바로 "${desc}" 이 내용인데요! 직접 보니까 이웃님들이 왜 그렇게 강추하셨는지 다 알겠더라고요.` : '처음 들어설 때부터 따뜻하고 친숙하게 맞아주는 분위기에 긴장감이 싹 녹아내렸답니다.'}

사진 찍는 족족 청량하고 이쁘게 나와서 카톡 프사도 바로 바꿨어요. 이웃님들도 시간 내서 꼭 한번 가보시길 강추합니다!

${chkFaq.checked ? `<h3>* 친절한 ${subject} Q&A</h3>
<p><strong>Q1. 혼자 가기에도 괜찮은 무드인가요?</strong><br>네! 아늑하게 한 구석에 자리 잡고 책을 보거나 생각하기에도 참 좋답니다.<br><br><strong>Q2. 반려동물 동반이 가능할까요?</strong><br>구역이나 조건에 따라 상이하므로 방문 전에 매장 유선 확인을 추천해요.<br><br><strong>Q3. 사장님이 추천하시는 시그니처 꿀조합은?</strong><br>기본에 충실하며 재료 본연의 맛이나 멋을 살린 대표적인 선택을 추천합니다.</p>` : ''}`;
            break;

          case 'formal':
            title = `${subject}에 대한 공간적 특성 및 접객 만족도 상세 보고서`;
            body = `${dateStr} 방문 조사를 기반으로 작성한 ${subject}의 이용 편의성과 인프라 가치 보고서입니다. ${photoText}

1. 기획 동선 및 내부 조형
본 시설은 이용자의 이동 동선을 배려한 유기적인 평면 설계가 돋보입니다.
${desc ? `특히 실사용 측면의 특이사항인 "${desc}" 부분은 공간의 고유한 테마를 굳건히 다져주는 주요 성공 요인으로 보입니다.` : '기구물 배치와 내부 채광 상태가 우수하여 쾌적한 비주얼적 조건을 만족시키고 있습니다.'}

2. 종합 평가 의견
종합적인 관점에서 볼 때 ${subject}은(는) 동급 카테고리 내에서 우수한 품질 유지를 제공하는 모범적 모델로 사료됩니다.

${chkFaq.checked ? `<h3>* ${subject} 운영 가이드 FAQ</h3>
<p><strong>Q1. 단체 고객 수용 능력이 충분한가요?</strong><br>사전 협의를 마칠 경우 충분한 여유 공간 배정이 가능한 규모입니다.<br><br><strong>Q2. 약자 배려 편의 시설이 도입되었나요?</strong><br>진입로 경사 시설 및 엘리베이터 동선이 기본 구조에 반영되어 있습니다.<br><br><strong>Q3. 정보 획득에 유용한 공식 경로를 제안바랍니다.</strong><br>공식 디지털 채널 및 주기적인 예약 동향을 상시 교차 체크해주시기 바랍니다.</p>` : ''}`;
            break;

          case 'humorous':
            title = `[경고] 지갑 루팡 당하고 온 ${subject} 찐 텐션 후기 ㅋㅋㅋ`;
            body = `님들 진짜 ㅋㅋㅋ 여기 안 가본 사람 없게 해주세요. ${dateStr}에 다녀온 ${subject}인데 완전 매력 폭발입니다! ${photoText}

${desc ? `특히 제 심장을 사정없이 저격했던 건 바로 "${desc}" 이 부분! 보자마자 헉 소리가 육성으로 튀어나와서 폰카 셔터 엄청나게 때렸습니다.` : '문 열고 들어가자마자 펼쳐지는 힙한 텐션 덕분에 갤러리 용량 터질 뻔했습니다.'}

감성이 미쳐서 재방문 의사 백만퍼센트입니다. 머리 식히고 싶으신 분들 바로 출발 좌표 찍으셔요!

${chkFaq.checked ? `<h3>* ${subject} 드립 FAQ</h3>
<p><strong>Q1. 주머니 사정이 얇은데 감당 가능할까요?</strong><br>순간적인 텅장이 되더라도 평화와 힐링을 사올 수 있어 완전 이득입니다!<br><br><strong>Q2. 누구랑 갈 때 뽕을 뽑을 수 있나요?</strong><br>사진 구도 기막히게 잡고 호응 잘해주는 리액션 장인 친구 동반을 강추합니다.<br><br><strong>Q3. 웨이팅 헬게이트를 피하는 꿀팀은?</strong><br>눈치게임 대성공을 기원하며 오픈 시간 10분 전에 슬그머니 가있기 권장합니다.</p>` : ''}`;
            break;

          case 'casual_informal':
            title = `가벼운 마음으로 들른 ${subject} 기록, 꽤나 괜찮았음.`;
            body = `${dateStr}에 가볍게 다녀왔던 ${subject}. 계속 리스트에만 뒀었는데 가보니 꽤 매력 있다. ${photoText}

${desc ? `특히 "${desc}" 이 부분이 내 취향에 맞았는데 왜 다들 평이 괜찮은지 가보니까 알 것 같다.` : '인테리어도 과하지 않고 담백해서 머리 식히기엔 참 편안한 인프라 구조였다.'}

대충 몇 장 툭툭 찍어봤는데도 채광이 좋아 사진 결과물도 제법 이쁘게 나와서 뿌듯하다. 다음에도 조용히 멍 때리고 싶을 때 혼자 슬쩍 다녀와야겠다.

${chkFaq.checked ? `<h3>* ${subject} 일기 FAQ</h3>
<p><strong>Q1. 주차 공간은 여유로운 편인가?</strong><br>주말 오후였는데도 주차장 공간 넉넉해서 문제 없었음.<br><br><strong>Q2. 혼자 가기에도 적합한가?</strong><br>조용히 작업하거나 멍 때리기 최적이라 혼가족분들 적극 권장함.<br><br><strong>Q3. 추천 포인트 하나만 준다면?</strong><br>구석구석 녹아있는 소소한 포인트들 덕분에 편하게 충전할 수 있음.</p>` : ''}`;
            break;
        }
      } else {
        // Multi-Platform 모드 (HTML 형식)
        let categoryContentHtml = '';
        
        switch (currentCategory) {
          case 'restaurant':
            title = `[맛집] 입안 가득 감동! ${subject} 숨겨진 꿀맛 솔직 리뷰`;
            categoryContentHtml = `
              <h2>시각과 미각을 사로잡은 맛의 현장</h2>
              <p>직접 맛보고 온 <strong>${subject}</strong>은 그야말로 군침 도는 미식의 세계였습니다. ${desc ? desc : '신선한 식재료와 절묘한 소스 배치가 기가 막힌 맛의 조화를 보여주었습니다.'}</p>
              <h2>대표 메뉴와 맛있는 묘사</h2>
              <p>한 입 베어 물자마자 입안 가득 팡 터지는 풍부한 맛과 쫄깃하고 부드러운 식감이 정말 일품이었습니다. 사진만 봐도 다시 가고 싶어질 만큼 미각을 사로잡는 비주얼과 서비스가 대만족스러웠습니다.</p>
            `;
            break;
          case 'cafe':
            title = `[카페] 감성 한 잔과 아늑함, 인스타 핫플 ${subject} 다녀온 날`;
            categoryContentHtml = `
              <h2>햇살과 감성이 머무는 따뜻한 공간</h2>
              <p>공간 기획이 돋보이는 <strong>${subject}</strong>에 머물다 왔습니다. ${desc ? desc : '부드러운 조광과 감각적인 가구 배치, 예쁜 색감이 조화를 이룬 힐링 스팟이었습니다.'}</p>
              <h2>인테리어 및 뷰 포인트</h2>
              <p>모퉁이 테이블에 앉아 찍은 사진마다 채광이 잘 스며서 그야말로 감성 사진 맛집이었습니다. 커피 향과 함께 조용하고 낭만적인 오후의 쉼표를 찍고 싶은 분들께 적극 권합니다.</p>
            `;
            break;
          case 'travel':
            title = `[여행] 현장감 백퍼센트! ${subject} 정복 코스 및 실전 가이드`;
            categoryContentHtml = `
              <h2>생생한 현장 묘사와 최적의 탐방 동선</h2>
              <p>발길 닿는 곳마다 새로운 설렘을 주는 <strong>${subject}</strong> 현장 소식입니다. ${desc ? desc : '경로 안내가 직관적이고 구경거리가 다양하여 여행의 묘미를 온전히 살려주었습니다.'}</p>
              <h2>여행자를 위한 필수 동선 & 교통 정보</h2>
              <p>도착 시 주변 안내 요령이나 이동 팁을 사전에 파악해 두시면 훨씬 수월합니다. 사진 속에 남겨진 아름다운 풍광과 추천 스팟들은 꼭 들러보아야 할 필수 버킷리스트로 강추합니다.</p>
            `;
            break;
          case 'tech':
            title = `[테크] 사양 비교 분석: ${subject} 사용 후기 및 핵심 성능 가이드`;
            categoryContentHtml = `
              <h2>정밀 사양 검토 및 하드웨어 성능 평가</h2>
              <p>이번 리포트에서는 <strong>${subject}</strong>의 핵심 기술 성능과 사용자 편의성을 다각도로 짚어봅니다. ${desc ? desc : '제품의 전체적인 조작 편의성과 입력 반응 속도가 기존 규격을 상회하는 성능을 보여주었습니다.'}</p>
              <h2>실사용 장단점 & 테크 스펙 검증</h2>
              <p>탑재된 프로세서 및 설계 폼팩터는 내구성과 안정성을 훌륭히 만족시킵니다. 분석 결과, 가성비와 가심비를 모두 갖춘 최적의 테크웨어 아이템으로 정의할 수 있습니다.</p>
            `;
            break;
          case 'fashion':
            title = `[패션] 핏이 예술! ${subject} 스타일링 제안 및 데일리 룩북`;
            categoryContentHtml = `
              <h2>트렌디한 색감 연출과 편안한 핏의 조화</h2>
              <p>스타일리시한 무드를 살려줄 <strong>${subject}</strong> 착용 후 코디 가이드를 공유합니다. ${desc ? desc : '자연스러운 제형이나 소재의 결이 살아나 힙하면서도 일상 데일리 룩으로 연출하기에 딱 알맞았습니다.'}</p>
              <h2>직관적인 착용감 & 뷰티 팁</h2>
              <p>입었을 때 흘러내리는 실루엣과 고급스러운 촉감이 디테일하게 살아 숨 쉽니다. 다가오는 시즌 트렌드를 앞서갈 세련된 센스를 담아내고 싶은 분들께 권해드립니다.</p>
            `;
            break;
          case 'living':
            title = `[리빙] 공간의 재발견: ${subject} 활용 홈스타일링 레이아웃 제안`;
            categoryContentHtml = `
              <h2>공간 효율성 및 톤앤무드 인테리어 조율</h2>
              <p>아늑하고 조화로운 공간 디자인을 선사하는 <strong>${subject}</strong> 배치 팁입니다. ${desc ? desc : '가구의 크기 균형과 벽지, 마루 색상의 톤 조율이 시각적인 안정감을 확실히 심어줍니다.'}</p>
              <h2>수납 설계 & 레이아웃 디테일</h2>
              <p>정돈된 가구 동선을 따라가면 깔끔하면서도 아기자기한 집 꾸미기 감성이 완성됩니다. 아날로그적인 정취와 효율성을 동시에 원하는 홈러버들의 요구를 잘 수렴했습니다.</p>
            `;
            break;
          case 'parenting':
            title = `[육아] 엄마아빠 공감 백프로, ${subject} 아이와 함께한 안심 체험기`;
            categoryContentHtml = `
              <h2>아이의 안전과 교육적 효과의 공존</h2>
              <p>우리 아이와 소중한 추억을 만들어준 <strong>${subject}</strong> 이용 후기입니다. ${desc ? desc : '놀이 공간 및 편의 시설 설계가 아동의 안전 수칙을 잘 준수하고 있어 부모 입장에서 안심이 되었습니다.'}</p>
              <h2>다정한 체험 일기 & 꿀팁</h2>
              <p>아이가 해맑게 웃으며 연못의 물고기나 기구들을 신기해하는 모습을 담은 사진은 인생 컷이었습니다. 교육적인 학습 교구 및 친환경 자재들이 가득해서 온 가족이 힐링하기에 최적입니다.</p>
            `;
            break;
          case 'review':
            title = `[리뷰] 깊이 있는 분석: ${subject} 관점 분석 및 평점`;
            categoryContentHtml = `
              <h2>작품 내면의 함의와 줄거리 심층 분석</h2>
              <p>문화예술적 관점에서 심도 있게 짚어본 <strong>${subject}</strong> 평론입니다. ${desc ? desc : '이야기의 탄탄한 개연성과 인물 간의 관계도가 짜임새 있게 연결되어 높은 지적 만족을 주었습니다.'}</p>
              <h2>인상적인 대사/명장면 & 평점 의견</h2>
              <p>작가의 시각이 돋보이는 연출과 스토리라인이 묵직한 감동을 선사합니다. 삶의 방향성을 되돌아보게 해준 묵직한 마스터피스로 평가하며 종합 별점 4.5점을 부여합니다.</p>
            `;
            break;
          case 'health':
            title = `[헬스] 오운완! ${subject} 자세 교정 및 근성장 루틴 가이드`;
            categoryContentHtml = `
              <h2>근육 자극 극대화 및 안전한 운동 자세</h2>
              <p>운동 효율을 비약적으로 끌어올려 줄 <strong>${subject}</strong> 트레이닝 루틴입니다. ${desc ? desc : '정밀한 가동 범위 체크와 세트 수 조절이 체계적으로 근육 수축과 이완을 이끌어내 주었습니다.'}</p>
              <h2>식단 관리 꿀팁 & 체력 증진 후기</h2>
              <p>동작 하나하나에 집중하여 부상 방지 팁과 근육 활성화를 꼼꼼히 체크해 보시길 권장합니다. 매일 꾸준한 루틴 수행으로 더 건강하고 에너지 넘치는 삶을 응원합니다.</p>
            `;
            break;
          case 'finance':
            title = `[경제] 재테크 꿀정보: ${subject} 투자가치 분석 및 자산 포트폴리오`;
            categoryContentHtml = `
              <h2>시장 트렌드 분석 및 경제적 가치 평가</h2>
              <p>금융 및 부동산, 그리고 자산 포트폴리오 측면에서 분석해본 <strong>${subject}</strong> 현황입니다. ${desc ? desc : '최신 요율 통계와 실물 자산 유동성 흐름을 대조했을 때 안정적인 자산 증식 수단으로 작용할 여지가 있습니다.'}</p>
              <h2>리스크 관리 & 부수입 파이프라인 형성</h2>
              <p>복잡한 수치와 법률 요건을 일목요연하게 도표화하여 의사결정 속도를 높여줍니다. 경제적 자유를 지향하는 투자자들을 위한 유용한 시장 지표 분석으로 활용하시기 바랍니다.</p>
            `;
            break;
          case 'news':
            title = `[시사] 논평: ${subject}의 사회적 쟁점과 향후 전망 분석`;
            categoryContentHtml = `
              <h2>시사 이슈 팩트 체크 및 중립적 평론</h2>
              <p>최근 사회적 관심사로 대두된 <strong>${subject}</strong>의 입체적인 맥락과 현안을 논평합니다. ${desc ? desc : '주요 주체 간의 대립 구도와 사회적 쟁점을 객관적인 팩트 중심으로 꼼꼼하게 다루었습니다.'}</p>
              <h2>주요 쟁점 분석 & 사회적 방향성 고찰</h2>
              <p>다양한 시각의 논점을 조화롭게 다루며 사안이 지니는 함의와 해법을 지적이고 분석적인 톤으로 논평합니다. 독자분들께서 현명한 여론 판단을 내릴 수 있는 신뢰도 높은 분석 리포트가 되기를 기대합니다.</p>
            `;
            break;
          default:
            title = `${subject} - 정보 리포트`;
            categoryContentHtml = `<p>상세 내용이 포함된 범용 정보 리포트입니다.</p>`;
        }

        body = `
          ${categoryContentHtml}
          <h3>${categoryName} 분야 핵심 데이터 요약</h3>
          <ul>
            <li><strong>카테고리:</strong> ${categoryName}</li>
            <li><strong>방문/분석 기준일:</strong> ${dateStr}</li>
            <li><strong>주요 타깃 키워드:</strong> ${kwText}</li>
            ${desc ? `<li><strong>세부 특징 기술:</strong> ${desc}</li>` : ''}
            <li><strong>콘텐츠 품질 지표:</strong> 최상급 (분야별 맞춤 엔진 적용)</li>
          </ul>
          
          ${chkFaq.checked ? `<h3>* ${subject} ${categoryName} FAQ</h3>
          <ul>
            <li><strong>Q: 해당 카테고리 분야에서 이 포스팅만의 차별화된 가치는 무엇인가요?</strong><br>A: 독자의 취향을 반영한 맞춤형 어조와 꼼꼼한 팩트 체크 및 구성입니다.</li>
            <li><strong>Q: 이용 시 권장 팁이 있나요?</strong><br>A: 키워드 리스트인 ${kwText} 관련 동향을 주기적으로 활용하여 트렌디한 포지셔닝을 취하시기 바랍니다.</li>
          </ul>` : ''}
        `;
      }
    }

    return { 
      title, 
      body, 
      seoTitles: [
        title, 
        "핫플레이스 감성 넘치는 솔직 탐방기", 
        "사진으로 기록하는 눈부신 찰나의 시간", 
        "많은 사람들이 열광하는 이유와 총평", 
        "알고 보면 더 매력적인 핵심 체크리스트"
      ], 
      seoKeywords: ['감성블로그', '데이트추천', '힐링여행', '분위기맛집', '사진찍기좋은곳', '핫플투어', '인생샷명소', '솔직후기', '내돈내산', '트렌드탐험'] 
    };
  }

  // ==========================================
  // 10. GENERATED OUTPUT RENDERER
  // ==========================================
  function renderGeneratedOutput() {
    outputContent.classList.remove('hidden');
    
    const formattedDate = inputDate.value ? `📅 방문/경험일: ${inputDate.value.replace(/-/g, '. ')}` : '📅 방문/경험일: (무관/생략)';
    const kwsToUse = (generatedSeoKeywords && generatedSeoKeywords.length > 0) ? generatedSeoKeywords : keywordsList;
    const tagsHtml = kwsToUse.map(k => k.startsWith('#') ? k : `#${k}`).join(' ');
    
    articleMetaInfo.innerHTML = `
      <span style="margin-right: 14px; color: #94a3b8; font-weight: 500;">${formattedDate}</span>
      <span style="color: #38bdf8; font-weight: 500;">🏷️ ${tagsHtml}</span>
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
          : [generatedTitle, "감성과 힐링이 가득한 특별한 경험 후기", "사진으로 기록하는 소중한 찰나의 순간", "또 가고 싶은 최고의 핫플레이스 탐방기", "알고 가면 더 좋은 핵심 포인트 정리"];
          
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
            showToast(`제목이 "${tItem}"(으)로 변경 및 클립보드에 복사되었습니다!`);
          });
          seoTitleList.appendChild(btn);
        });

        // 추천 키워드 10선 렌더링
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
            showToast(`키워드 #${cleanKw} 가 클립보드에 복사되었습니다!`);
          });
          seoKeywordGrid.appendChild(badge);
        });
      } else {
        seoResultsCard.classList.add('hidden');
      }
    }

    // 업로드 사진을 본문 문단 사이에 고르게 삽입
    insertPhotosIntoArticle();

    updateOutputActionButtons();
  }

  /**
   * 업로드된 사진들을 글 본문의 블록 요소(p, h2, h3, ul, ol) 사이에
   * 고르게 분산 삽입한다. 사진이 N장이면 본문을 N+1 구간으로 나눠
   * 각 구간 경계에 사진 1장씩을 배치한다.
   */
  function insertPhotosIntoArticle() {
    if (uploadedFiles.length === 0) return;

    const blocks = Array.from(articleBody.querySelectorAll('p, h2, h3, ul, ol'));
    if (blocks.length < 2) return; // 문단이 너무 적으면 맨 끝에만 넣기

    const photoCount = uploadedFiles.length;
    // 사진 삽입 위치 인덱스를 균등 계산 (첫 문단 직후 ~ 마지막 문단 직전)
    const insertIndices = [];
    const gap = blocks.length / (photoCount + 1);
    for (let i = 0; i < photoCount; i++) {
      // gap*(i+1) 위치의 블록 직후에 삽입 (최소 1번째 문단 뒤부터)
      const idx = Math.min(Math.round(gap * (i + 1)), blocks.length - 1);
      if (!insertIndices.includes(idx)) {
        insertIndices.push(idx);
      }
    }

    // 뒤에서부터 삽입해야 인덱스가 꼬이지 않음
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
    naverBodyArea.innerHTML = `<p class="naver-placeholder-text" id="naverEditorPlaceholder">기사 넘기기 버튼을 누르면 이 영역에 사진과 글이 자동으로 주입됩니다.</p>`;
    btnStartInject.disabled = false;
    btnStartInject.innerHTML = '📤 기사 넘기기 (Auto-inject)';
    
    openModal(naverEditorModal);
  });

  btnCloseNaverEditor.addEventListener('click', () => closeModal(naverEditorModal));

  btnStartInject.addEventListener('click', () => {
    btnStartInject.disabled = true;
    btnStartInject.innerHTML = '⚡ 주입 진행 중...';
    
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
    // .article-inline-photo 은 JS가 삽입한 사진 블록이므로 제외하고 텍스트 블록만 수집
    const paragraphs = Array.from(
      articleBody.querySelectorAll('p, h2, h3, ul, ol')
    ).filter(el => !el.closest('.article-inline-photo'));
    let pIdx = 0;

    // 사진 삽입 위치 매핑: 사진 N장을 본문 블록 사이에 균등 분산
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
      // 문단 적으면 첫 문단 뒤에 1장만
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

        // 현재 pIdx에 삽입할 사진이 있으면 사진 주입 후 다음 문단 진행
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
        btnStartInject.innerHTML = '✅ 전송 완료';
        showToast('네이버 에디터 본문 자동 주입 완료!');
      }
    }
    
    injectNext();
  }

  btnNaverPublish.addEventListener('click', () => {
    closeModal(naverEditorModal);
    showToast('🎉 축하합니다! 네이버 블로그에 포스팅이 발행되었습니다. (체험 완료)');
  });

  btnNaverSave.addEventListener('click', () => {
    showToast('네이버 에디터 임시저장함에 포스트가 안전하게 저장되었습니다.');
  });

  // ==========================================
  // 12. COPY ACTIONS (본문 복사 & HTML 복사)
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

    const fullText = `[제목]
${generatedTitle}

[본문]
${plainBody}

[태그]
${tagsText}`;

    navigator.clipboard.writeText(fullText).then(() => {
      showToast('포스트 전체 텍스트가 클립보드에 복사되었습니다! 마우스 드래그 없이 바로 복사 완료!');
    }).catch(err => {
      console.error(err);
      showToast('복사 실패. 본문을 직접 드래그하여 복사해 주세요.');
    });
  });

  // HTML Source code copy
  btnCopyHtml.addEventListener('click', () => {
    const tagsHtml = keywordsList.map(k => `<span>#${k}</span>`).join(' ');
    const fullHtml = `<!-- photoBlog V2 Generated Post -->
<div class="photoblog-post">
  <div class="photoblog-meta">
    <p>방문일: ${inputDate.value.replace(/-/g, '. ')}</p>
    <p class="photoblog-tags">${tagsHtml}</p>
  </div>
  <h1 class="photoblog-title">${generatedTitle}</h1>
  <div class="photoblog-body">
    ${generatedBody}
  </div>
</div>`;

    navigator.clipboard.writeText(fullHtml).then(() => {
      showToast('HTML 코드가 복사되었습니다. 블로그 HTML 편집창에 붙여넣기 하세요!');
    }).catch(err => {
      console.error(err);
      showToast('클립보드 복사 실패. 직접 드래그하여 복사해주시기 바랍니다.');
    });
  });

});
