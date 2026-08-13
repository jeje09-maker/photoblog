/**
 * @file upload.js
 * @description 사진 업로드, 드래그 앤 드롭, 및 미리보기 렌더링을 처리하는 모듈입니다.
 */
import { State, DOM } from '../state.js';
import { convertToWebp, formatFileSize } from '../utils/fileUtils.js';
import { showToast } from '../ui/modal.js';
const { uploadZone, fileInput, previewContainer, previewGrid, placeholder } = DOM;

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
    State.activeDemoPreset = null; // Clear preset state on manual upload

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
      State.uploadedFiles.push(placeholder);

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
        const idx = State.uploadedFiles.indexOf(placeholder);
        if (idx !== -1) State.uploadedFiles.splice(idx, 1);
        renderPreviews();
      });
    });

    renderPreviews();
  }

function renderPreviews() {
    previewGrid.innerHTML = '';
    if (State.uploadedFiles.length > 0) {
      previewContainer.classList.remove('hidden');

      // ?꾩껜 ?⑸웾 ?붿빟 ?쒖떆
      const totalOriginal = State.uploadedFiles.reduce((sum, f) => sum + (f.originalSize || 0), 0);
      const totalWebp = State.uploadedFiles.reduce((sum, f) => sum + (f.webpSize || 0), 0);
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
          <span class="summary-count">${State.uploadedFiles.length}장 업로드</span>
          <span class="summary-size">${formatFileSize(totalOriginal)} → ${formatFileSize(totalWebp)}</span>
          <span class="summary-rate">-${totalRate}% 절감</span>
        `;
      } else {
        summaryEl.innerHTML = `<span class="summary-count">${State.uploadedFiles.length}장 업로드</span>`;
      }

      State.uploadedFiles.forEach((file, index) => {
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
          const draggedItem = State.uploadedFiles.splice(draggedIndex, 1)[0];
          State.uploadedFiles.splice(dropIndex, 0, draggedItem);
          
          renderPreviews();
        });

        previewGrid.appendChild(item);
      });
      
      // Add remove events
      previewGrid.querySelectorAll('.preview-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          State.uploadedFiles.splice(idx, 1);
          renderPreviews();
          if (State.uploadedFiles.length === 0) {
            State.activeDemoPreset = null;
          }
        });
      });
    } else {
      previewContainer.classList.add('hidden');
    }
  }
export { handleFiles, renderPreviews };
