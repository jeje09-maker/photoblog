/**
 * renderer.js — 생성 결과 HTML 렌더링 & 인라인 사진 삽입
 */

'use strict';

PB.renderGeneratedOutput = function () {
  PB.outputContent.classList.remove('hidden');

  // 날짜 & 태그 메타
  const formattedDate = PB.inputDate.value
    ? `📅 방문/경험일: ${PB.inputDate.value.replace(/-/g, '. ')}`
    : '📅 방문/경험일: (미입력)';
  const kwsToUse = (PB.generatedSeoKeywords && PB.generatedSeoKeywords.length)
    ? PB.generatedSeoKeywords : PB.keywordsList;
  const tagsHtml = kwsToUse.map(k => k.startsWith('#') ? k : `#${k}`).join(' ');

  PB.articleMetaInfo.innerHTML = `
    <span style="margin-right:14px;color:#94a3b8;font-weight:500;">${formattedDate}</span>
    <span style="color:#38bdf8;font-weight:500;">${tagsHtml}</span>`;

  PB.articleTitle.textContent = PB.generatedTitle;

  // 이미지 태그 치환 (AI가 출력한 <img> 또는 [IMAGE_N])
  let finalBody = PB.generatedBody;
  if (PB.uploadedFiles.length > 0) {
    finalBody = finalBody.replace(/\[IMAGE_(\d+)\]/gi, (match, p1) => {
      const idx  = parseInt(p1, 10) - 1;
      if (idx >= 0 && idx < PB.uploadedFiles.length) {
        const f = PB.uploadedFiles[idx];
        return `<figure class="article-image" style="margin:32px 0;text-align:center;">
          <img src="${f.previewUrl}" alt="첨부 이미지 ${p1}" style="max-width:100%;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <figcaption style="margin-top:8px;font-size:0.9rem;color:#64748b;">${f.name.replace('.webp','')}</figcaption>
        </figure>`;
      }
      return match;
    });

    let imgCount = 0;
    finalBody = finalBody.replace(/<img[^>]*>/gi, () => {
      if (imgCount < PB.uploadedFiles.length) {
        const f = PB.uploadedFiles[imgCount++];
        return `<figure class="article-image" style="margin:32px 0;text-align:center;">
          <img src="${f.previewUrl}" alt="첨부 이미지 ${imgCount}" style="max-width:100%;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <figcaption style="margin-top:8px;font-size:0.9rem;color:#64748b;">${f.name.replace('.webp','')}</figcaption>
        </figure>`;
      }
      return '';
    });
  }

  // 본문 렌더링
  if (finalBody.includes('<h2') || finalBody.includes('<p>') || finalBody.includes('<ul')) {
    PB.articleBody.innerHTML = finalBody;
  } else {
    PB.articleBody.innerHTML = finalBody.split('\n\n')
      .map(p => `<p style="margin-bottom:14px;line-height:1.8;">${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  // SEO 결과 박스
  if (PB.seoResultsCard && PB.seoTitleList && PB.seoKeywordGrid) {
    if ((PB.generatedSeoTitles && PB.generatedSeoTitles.length) || kwsToUse.length) {
      PB.seoResultsCard.classList.remove('hidden');

      // 추천 제목 Top 5
      PB.seoTitleList.innerHTML = '';
      const titles = PB.generatedSeoTitles.length
        ? PB.generatedSeoTitles
        : [PB.generatedTitle, '감성과 낭만이 가득한 특별한 경험 후기', '사진으로 기록하는 소중한 찰나의 순간', '또 가고 싶은 최고의 핫플레이스 탐방기', '알고 가면 더 좋은 핵심 포인트 정리'];
      titles.slice(0, 5).forEach((t, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText = 'text-align:left;padding:10px 14px;background:rgba(30,41,59,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#f8fafc;font-size:0.9rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:space-between;';
        btn.innerHTML = `<span><strong style="color:#818cf8;margin-right:8px;">Top ${i+1}.</strong>${t}</span><span style="font-size:0.75rem;color:#64748b;background:rgba(255,255,255,0.05);padding:2px 6px;border-radius:4px;">적용 & 복사</span>`;
        btn.addEventListener('mouseover', () => btn.style.background = 'rgba(99,102,241,0.25)');
        btn.addEventListener('mouseout',  () => btn.style.background = 'rgba(30,41,59,0.8)');
        btn.addEventListener('click', () => {
          PB.articleTitle.textContent = t;
          PB.generatedTitle = t;
          navigator.clipboard.writeText(t);
          PB.showToast(`제목이 "${t}"(으)로 변경 및 복사되었습니다.`);
        });
        PB.seoTitleList.appendChild(btn);
      });

      // 추천 키워드 10개
      PB.seoKeywordGrid.innerHTML = '';
      kwsToUse.slice(0, 10).forEach(kw => {
        const k = kw.replace(/^#/, '').trim();
        if (!k) return;
        const badge = document.createElement('span');
        badge.style.cssText = 'padding:6px 12px;background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);border-radius:20px;font-size:0.82rem;font-weight:500;cursor:pointer;transition:all 0.2s;';
        badge.textContent = `#${k}`;
        badge.addEventListener('mouseover', () => badge.style.background = 'rgba(56,189,248,0.35)');
        badge.addEventListener('mouseout',  () => badge.style.background = 'rgba(56,189,248,0.15)');
        badge.addEventListener('click', () => { navigator.clipboard.writeText(`#${k}`); PB.showToast(`키워드 #${k} 복사되었습니다.`); });
        PB.seoKeywordGrid.appendChild(badge);
      });
    } else {
      PB.seoResultsCard.classList.add('hidden');
    }
  }

  PB.insertPhotosIntoArticle();
  PB.updateOutputActionButtons();
};

// 사진을 본문 문단 사이에 균등 삽입
PB.insertPhotosIntoArticle = function () {
  if (!PB.uploadedFiles.length) return;
  const blocks = Array.from(PB.articleBody.querySelectorAll('p, h2, h3, ul, ol'));
  if (blocks.length < 2) return;

  const gap = blocks.length / (PB.uploadedFiles.length + 1);
  const indices = [];
  for (let i = 0; i < PB.uploadedFiles.length; i++) {
    const idx = Math.min(Math.round(gap * (i + 1)), blocks.length - 1);
    if (!indices.includes(idx)) indices.push(idx);
  }

  [...indices].sort((a, b) => b - a).forEach((blockIdx, ri) => {
    const photoIdx = indices.indexOf([...indices].sort((a, b) => b - a)[ri]);
    if (photoIdx >= PB.uploadedFiles.length) return;
    const f   = PB.uploadedFiles[photoIdx];
    const box = document.createElement('div');
    box.className  = 'article-inline-photo';
    box.innerHTML  = `<img src="${f.previewUrl}" alt="${f.name}" loading="lazy">
      <span class="article-photo-caption">📷 ${f.name} <span class="article-photo-badge">WebP</span></span>`;
    const target = blocks[blockIdx];
    target.parentNode.insertBefore(box, target.nextSibling);
  });
};
