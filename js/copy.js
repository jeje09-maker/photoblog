/**
 * copy.js — 텍스트 복사 & HTML 복사
 */

'use strict';

PB.initCopy = function () {
  // 순수 텍스트 복사
  PB.btnCopyText.addEventListener('click', () => {
    const temp = document.createElement('div');
    temp.innerHTML = PB.articleBody.innerHTML;
    temp.querySelectorAll('p, h2, h3, li').forEach(el => { el.innerHTML = el.innerHTML + '\n'; });
    const plainBody = temp.textContent.trim();
    const tagsText  = PB.keywordsList.map(k => `#${k}`).join(' ');
    const full = `[제목]\n${PB.generatedTitle}\n\n[본문]\n${plainBody}\n\n[태그]\n${tagsText}`;
    navigator.clipboard.writeText(full).then(() => {
      PB.showToast('포스트 전체 텍스트가 클립보드에 복사되었습니다!');
    }).catch(() => PB.showToast('복사 실패. 본문을 직접 선택해 복사해주세요.'));
  });

  // HTML 소스 복사
  PB.btnCopyHtml.addEventListener('click', () => {
    const tagsHtml = PB.keywordsList.map(k => `<span>#${k}</span>`).join(' ');
    const full = `<!-- photoBlog Generated Post -->
<div class="photoblog-post">
  <div class="photoblog-meta">
    <p>방문일: ${PB.inputDate.value.replace(/-/g, '. ')}</p>
    <p class="photoblog-tags">${tagsHtml}</p>
  </div>
  <h1 class="photoblog-title">${PB.generatedTitle}</h1>
  <div class="photoblog-body">
    ${PB.generatedBody}
  </div>
</div>`;
    navigator.clipboard.writeText(full).then(() => {
      PB.showToast('HTML 소스가 복사되었습니다. 블로그 HTML 편집기에 붙여넣기 하세요.');
    }).catch(() => PB.showToast('클립보드 복사 실패. 직접 선택해서 복사해주세요.'));
  });

  // 서식 유지 (에디터 양식) 복사
  if (PB.btnCopyRichText) {
    PB.btnCopyRichText.addEventListener('click', async () => {
      const tagsHtml = PB.keywordsList.map(k => `#${k}`).join(' ');
      
      // 배경색(다크모드) 영향을 받지 않도록 깔끔한 인라인 스타일 적용
      const cleanHtml = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 800px;">
          <h1 style="font-size: 1.6em; font-weight: bold; margin-bottom: 20px; color: #000;">${PB.generatedTitle}</h1>
          <p style="color: #666; font-size: 0.9em; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            방문일: ${PB.inputDate.value.replace(/-/g, '. ')}<br>
            태그: <span style="color: #3b82f6;">${tagsHtml}</span>
          </p>
          <div style="font-size: 1em; color: #222;">
            ${PB.articleBody.innerHTML}
          </div>
        </div>
      `;

      // 클린 텍스트 폴백 생성
      const temp = document.createElement('div');
      temp.innerHTML = PB.articleBody.innerHTML;
      temp.querySelectorAll('p, h2, h3, li').forEach(el => { el.innerHTML = el.innerHTML + '\n'; });
      const plainBody = temp.textContent.trim();
      const tagsText  = PB.keywordsList.map(k => `#${k}`).join(' ');
      const plainText = `[제목]\n${PB.generatedTitle}\n\n[본문]\n${plainBody}\n\n[태그]\n${tagsText}`;

      try {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([cleanHtml], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' })
        });
        await navigator.clipboard.write([clipboardItem]);
        PB.showToast('에디터 양식 복사 완료! 블로그 에디터에 그대로 붙여넣기(Ctrl+V) 하세요.');
      } catch (err) {
        console.error(err);
        PB.showToast('브라우저가 서식 복사를 지원하지 않습니다. 텍스트 복사를 이용해주세요.');
      }
    });
  }
};
