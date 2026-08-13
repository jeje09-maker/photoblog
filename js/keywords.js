/**
 * keywords.js — SEO 키워드 태그 입력 & AI 추출
 */

'use strict';

PB.renderKeywordTags = function () {
  PB.keywordTags.innerHTML = '';
  PB.keywordsList.forEach((kw, index) => {
    const tag = document.createElement('span');
    tag.className = 'keyword-tag';
    tag.innerHTML = `#${kw}<button class="keyword-tag-remove" data-index="${index}">&times;</button>`;
    PB.keywordTags.appendChild(tag);
  });
  PB.keywordTags.querySelectorAll('.keyword-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      PB.keywordsList.splice(parseInt(btn.dataset.index), 1);
      PB.renderKeywordTags();
    });
  });
};

PB.addKeywordFromInput = function () {
  const val = PB.inputKeywords.value.trim().replace(/,/g, '');
  if (val && !PB.keywordsList.includes(val)) {
    PB.keywordsList.push(val);
    PB.renderKeywordTags();
  }
  PB.inputKeywords.value = '';
};

PB.initKeywords = function () {
  PB.inputKeywords.addEventListener('keydown', (e) => {
    if (e.key === ',' || e.key === 'Enter') { e.preventDefault(); PB.addKeywordFromInput(); }
  });
  PB.inputKeywords.addEventListener('blur', () => PB.addKeywordFromInput());

  PB.btnExtractKeywords.addEventListener('click', async () => {
    if (!PB.uploadedFiles.length && !PB.activeDemoPreset) {
      PB.showToast('키워드 추출을 위해 최소 1장의 사진을 업로드하거나 데모 프리셋을 선택하세요.');
      return;
    }
    PB.btnExtractKeywords.disabled    = true;
    PB.btnExtractKeywords.textContent = '추출 중...';

    const paris    = ['파리여행', '에펠탑야경', '프랑스감성여행', '에펠탑카페', '유럽자유여행'];
    const orangery = ['파리오랑주리', '오랑주리미술관', '파리미술관', '파리여행코스', '미술관관람'];
    const generic  = ['일상블로그', '데이트코스', '감성사진', '주말나들이', '분위기좋은곳'];

    if (PB.apiKey && PB.uploadedFiles.length > 0) {
      try {
        const extracted = await PB.fetchKeywordsFromGemini();
        PB.keywordsList = [...new Set([...PB.keywordsList, ...(extracted.length ? extracted : generic)])];
      } catch (err) {
        console.error(err);
        PB.showToast('API 오류로 기본 키워드를 로드했습니다.');
        PB.keywordsList = [...new Set([...PB.keywordsList, ...generic])];
      }
    } else {
      await new Promise(r => setTimeout(r, 1500));
      let demo = generic;
      if (PB.activeDemoPreset === 'paris' || PB.inputSubject.value.includes('파리') || PB.inputSubject.value.includes('에펠'))
        demo = paris;
      else if (PB.activeDemoPreset === 'orangery')
        demo = orangery;
      PB.keywordsList = [...new Set([...PB.keywordsList, ...demo])];
    }

    PB.renderKeywordTags();
    PB.btnExtractKeywords.disabled    = false;
    PB.btnExtractKeywords.textContent = 'AI 키워드 추출';
    PB.showToast('AI 키워드 추출이 완료되었습니다.');
  });
};
