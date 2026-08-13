/**
 * naver.js — 네이버 스마트에디터 자동 주입 & 발행
 */

'use strict';

PB.initNaverEditor = function () {
  PB.btnSendToNaver.addEventListener('click', () => {
    PB.naverTitleInput.value   = '';
    PB.naverBodyArea.innerHTML = `<p class="naver-placeholder-text" id="naverEditorPlaceholder">콘텐츠 시작 버튼을 누르면 제목과 본문이 자동으로 순차적으로 입력됩니다.</p>`;
    PB.btnStartInject.disabled  = false;
    PB.btnStartInject.innerHTML = '▶ 콘텐츠 시작하기 (Auto-inject)';
    PB.openModal(PB.naverEditorModal);
  });

  PB.btnCloseNaverEditor.addEventListener('click', () => PB.closeModal(PB.naverEditorModal));

  PB.btnStartInject.addEventListener('click', () => {
    PB.btnStartInject.disabled  = true;
    PB.btnStartInject.innerHTML = '⏳ 자동 입력 실행 중...';

    const placeholder = document.getElementById('naverEditorPlaceholder');
    if (placeholder) placeholder.remove();

    // 제목 타이핑 애니메이션
    let idx = 0;
    PB.naverTitleInput.value = '';
    const titleInterval = setInterval(() => {
      if (idx < PB.generatedTitle.length) {
        PB.naverTitleInput.value += PB.generatedTitle[idx++];
      } else {
        clearInterval(titleInterval);
        injectBodyParagraphs();
      }
    }, 40);
  });

  PB.btnNaverPublish.addEventListener('click', () => {
    PB.closeModal(PB.naverEditorModal);
    PB.showToast('🎉 발행 완료! 네이버 블로그에 포스트가 게재되었습니다. (데모 완료)');
  });

  PB.btnNaverSave.addEventListener('click', () => {
    PB.showToast('네이버 에디터 저장 기능은 브라우저 확장 연동 시 활성화됩니다.');
  });
};

function injectBodyParagraphs() {
  const paragraphs = Array.from(
    PB.articleBody.querySelectorAll('p, h2, h3, ul, ol')
  ).filter(el => !el.closest('.article-inline-photo'));

  let pIdx = 0;

  // 사진 삽입 위치 계산
  const photoInsertMap = new Map();
  if (PB.uploadedFiles.length > 0 && paragraphs.length >= 2) {
    const gap = paragraphs.length / (PB.uploadedFiles.length + 1);
    for (let i = 0; i < PB.uploadedFiles.length; i++) {
      const pos = Math.min(Math.round(gap * (i + 1)), paragraphs.length - 1);
      if (!photoInsertMap.has(pos)) photoInsertMap.set(pos, i);
    }
  } else if (PB.uploadedFiles.length > 0) {
    photoInsertMap.set(1, 0);
  }

  function injectNext() {
    if (pIdx >= paragraphs.length) {
      PB.btnStartInject.innerHTML = '✅ 입력 완료';
      PB.showToast('스마트에디터에 본문 자동 입력 완료!');
      return;
    }

    const block = document.createElement('div');
    block.className = 'naver-paragraph';
    const src = paragraphs[pIdx];

    if (src.tagName === 'P') {
      block.innerHTML = src.innerHTML;
    } else if (src.tagName.startsWith('H')) {
      const h = document.createElement('h3');
      h.style.cssText = 'font-weight:bold;margin-top:20px;font-size:1.1rem;';
      h.innerHTML = src.innerHTML;
      block.appendChild(h);
    } else {
      block.innerHTML = src.outerHTML;
    }

    PB.naverBodyArea.appendChild(block);
    PB.naverBodyArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
    pIdx++;

    if (photoInsertMap.has(pIdx)) {
      const f = PB.uploadedFiles[photoInsertMap.get(pIdx)];
      setTimeout(() => {
        const imgBox = document.createElement('div');
        imgBox.className = 'naver-img-box';
        imgBox.innerHTML = `<img src="${f.previewUrl}" alt="${f.name}">
          <span class="naver-img-caption">📷 ${f.name} [WebP ${f.webpSize ? PB.formatFileSize(f.webpSize) : ''}]</span>`;
        PB.naverBodyArea.appendChild(imgBox);
        PB.naverBodyArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
        setTimeout(injectNext, 800);
      }, 600);
    } else {
      setTimeout(injectNext, 500);
    }
  }

  injectNext();
}
