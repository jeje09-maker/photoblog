/**
 * upload.js — 이미지 업로드 & 클라이언트 WebP 변환
 */

'use strict';

// ── WebP 변환 ────────────────────────────────────────────
PB.convertToWebp = function (file) {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width);  width  = maxDim; }
          else                { width  = Math.round(width  * maxDim / height); height = maxDim; }
        }
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl    = canvas.toDataURL('image/webp', 0.85);
        const base64Data = dataUrl.split(',')[1];
        const webpSize   = Math.round((base64Data.length * 3) / 4);
        const rate       = originalSize > 0 ? Math.round((1 - webpSize / originalSize) * 100) : 0;
        resolve({
          name: file.name.replace(/\.[^/.]+$/, '') + '.webp',
          type: 'image/webp',
          base64: base64Data,
          previewUrl: dataUrl,
          originalSize,
          webpSize,
          compressionRate: Math.max(0, rate)
        });
      };
      img.onerror = () => reject(new Error('Image load failed.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File reading failed.'));
    reader.readAsDataURL(file);
  });
};

// ── 파일 처리 ────────────────────────────────────────────
PB.handleFiles = function (files) {
  if (!files.length) return;
  PB.activeDemoPreset = null;

  const valid   = Array.from(files).filter(f => f.type.startsWith('image/'));
  const invalid = Array.from(files).filter(f => !f.type.startsWith('image/'));
  if (invalid.length) PB.showToast(`지원되지 않는 파일 ${invalid.length}개 제외됨`, 5000);
  if (!valid.length) return;

  PB.showToast(`${valid.length}장의 이미지를 WebP로 변환 중...`);
  let done = 0;

  valid.forEach(file => {
    const ph = { name: file.name, originalSize: file.size, webpSize: file.size,
                 previewUrl: URL.createObjectURL(file), isLoading: true };
    PB.uploadedFiles.push(ph);

    PB.convertToWebp(file).then(webp => {
      Object.assign(ph, webp, { isLoading: false });
      done++;
      PB.renderPreviews();
      if (done === valid.length) PB.showToast(`모든 이미지(${valid.length}장) 변환 완료!`);
    }).catch(err => {
      console.error(err);
      PB.showToast(`'${file.name}' 변환 오류`, 5000);
      PB.uploadedFiles.splice(PB.uploadedFiles.indexOf(ph), 1);
      PB.renderPreviews();
    });
  });

  PB.renderPreviews();
};

// ── 미리보기 렌더링 ──────────────────────────────────────
PB.renderPreviews = function () {
  PB.previewGrid.innerHTML = '';
  if (!PB.uploadedFiles.length) { PB.previewContainer.classList.add('hidden'); return; }

  PB.previewContainer.classList.remove('hidden');

  // 전체 용량 요약
  const totOrig = PB.uploadedFiles.reduce((s, f) => s + (f.originalSize || 0), 0);
  const totWebp = PB.uploadedFiles.reduce((s, f) => s + (f.webpSize     || 0), 0);
  const rate    = totOrig > 0 ? Math.max(0, Math.round((1 - totWebp / totOrig) * 100)) : 0;
  let sumEl = PB.previewContainer.querySelector('.preview-summary');
  if (!sumEl) {
    sumEl = document.createElement('div');
    sumEl.className = 'preview-summary';
    PB.previewContainer.insertBefore(sumEl, PB.previewGrid);
  }
  sumEl.innerHTML = totOrig > 0
    ? `<span class="summary-count">${PB.uploadedFiles.length}장 업로드</span>
       <span class="summary-size">${PB.formatFileSize(totOrig)} → ${PB.formatFileSize(totWebp)}</span>
       <span class="summary-rate">-${rate}% 절감</span>`
    : `<span class="summary-count">${PB.uploadedFiles.length}장 업로드</span>`;

  PB.uploadedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className  = 'preview-item';
    item.draggable  = true;
    const sizeInfo  = file.isLoading ? '변환 중...' : (file.originalSize ? PB.formatFileSize(file.webpSize) : '');
    item.innerHTML  = `
      <img src="${file.previewUrl}" alt="${file.name}">
      <button class="preview-remove" data-index="${index}">&times;</button>
      <div class="preview-badges">
        <span class="webp-badge">WebP</span>
        ${sizeInfo ? `<span class="size-badge">${sizeInfo}</span>` : ''}
      </div>`;

    // 드래그 앤 드롭 순서 변경
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    item.addEventListener('dragend',  () => {
      item.classList.remove('dragging');
      PB.previewGrid.querySelectorAll('.preview-item').forEach(el => el.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (from === index || isNaN(from)) return;
      let to = index;
      if (from < to) to--;
      const moved = PB.uploadedFiles.splice(from, 1)[0];
      PB.uploadedFiles.splice(to, 0, moved);
      PB.renderPreviews();
    });

    PB.previewGrid.appendChild(item);
  });

  // 삭제 버튼
  PB.previewGrid.querySelectorAll('.preview-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      PB.uploadedFiles.splice(parseInt(btn.dataset.index), 1);
      if (!PB.uploadedFiles.length) PB.activeDemoPreset = null;
      PB.renderPreviews();
    });
  });
};

// ── 이벤트 바인딩 ────────────────────────────────────────
PB.initUpload = function () {
  ['dragenter', 'dragover'].forEach(ev =>
    PB.uploadZone.addEventListener(ev, (e) => { e.preventDefault(); PB.uploadZone.classList.add('dragover'); }, false));
  ['dragleave', 'drop'].forEach(ev =>
    PB.uploadZone.addEventListener(ev, (e) => { e.preventDefault(); PB.uploadZone.classList.remove('dragover'); }, false));

  PB.uploadZone.addEventListener('drop',  (e) => PB.handleFiles(e.dataTransfer.files));
  PB.uploadZone.addEventListener('click', ()  => PB.fileInput.click());
  PB.fileInput.addEventListener('change', (e) => { PB.handleFiles(e.target.files); e.target.value = ''; });

  PB.btnClearPhotos.addEventListener('click', (e) => {
    e.preventDefault();
    PB.uploadedFiles    = [];
    PB.activeDemoPreset = null;
    PB.renderPreviews();
    PB.showToast('사진이 모두 제거되었습니다.');
  });

  // 참고 문서 TXT 로드
  if (PB.fileInputDoc) {
    PB.fileInputDoc.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload  = (ev) => { PB.inputArticle.value = ev.target.result; PB.showToast(`'${file.name}' 파일 내용을 참고 문서란에 불러왔습니다.`); };
      reader.onerror = ()   => PB.showToast('파일 읽기 오류가 발생했습니다.');
      reader.readAsText(file);
    });
  }
};
