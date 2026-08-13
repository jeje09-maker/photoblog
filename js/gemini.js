/**
 * gemini.js — Gemini API 호출 (키워드 추출 & 블로그 생성)
 */

'use strict';

// ── Gemini API 공통 fetch ────────────────────────────────
async function callGemini(model, payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${PB.apiKey}`;
  const res  = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`[Gemini API 오류] ${res.status}: ${err.error ? err.error.message : 'Request Failed'}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
}

// ── 키워드 추출 ──────────────────────────────────────────
PB.fetchKeywordsFromGemini = async function () {
  const payload = {
    contents: [{
      parts: [
        { text: `다음 사진과 정보를 기반으로, 검색 최적화(SEO)에 적합한 한국어 키워드 5개를 쉼표로 구분해서 출력하세요.\n주제: ${PB.inputSubject.value}\n설명: ${PB.inputDesc.value}` },
        ...PB.uploadedFiles.map(f => ({ inlineData: { mimeType: f.type, data: f.base64 } }))
      ]
    }]
  };
  const text = await callGemini(PB.selectedModel, payload);
  return text.split(',').map(s => s.trim().replace(/#/g, '')).filter(Boolean);
};

// ── 블로그 생성 ──────────────────────────────────────────
PB.generateBlogWithGemini = async function () {
  const categoryMap = {
    restaurant:'맛집/푸드', cafe:'카페/디저트', travel:'여행/관광',
    tech:'IT/테크/가전', fashion:'패션/뷰티', living:'리빙/인테리어',
    parenting:'육아/교육', review:'도서/영화/리뷰', health:'건강/운동/헬스',
    finance:'경제/재테크/비즈', news:'시사/경제/정치'
  };
  const categoryName = categoryMap[PB.currentCategory] || PB.currentCategory;

  // 톤 지시
  const toneMap = {
    emotional:       '감성적이고 낭만적인 문체(~이었다, ~었지요 등)',
    seo:             '정보 중심 SEO 최적화 문체',
    friendly:        '친근하고 편안한 말투(~해요, ~했어요)',
    formal:          '격식체 전문 보고 문체(~입니다, ~합니다)',
    humorous:        '유머러스하고 재치있는 문체',
    casual_informal: '일상적이고 솔직한 문체(~이다, ~했다)'
  };
  const toneInstruction = toneMap[PB.selectBlogTone.value] || '평범하고 읽기 쉬운 블로그 문체';

  const humanizeRule = PB.chkHumanize.checked
    ? '[휴먼 페르소나 필수]: AI 말투(~것으로 보입니다, ~습니다 등 딱딱한 말투)를 피하세요. 실제 사람이 경험한 것처럼 자연스럽고 감정적인 표현을 사용하세요.'
    : '';

  const dateRule = PB.inputDate.value
    ? `[날짜 반영]: 입력된 날짜는 '${PB.inputDate.value}'입니다. 글 내에 자연스럽게 녹여주세요.`
    : '[날짜 반영]: 날짜가 없으므로 날짜 언급 없이 작성하세요.';

  const descRule = PB.inputDesc.value
    ? `[직접 경험/휴먼 페르소나 내용]: """${PB.inputDesc.value}"""\n이 내용을 바탕으로 생생하게 작성하세요.`
    : '';

  const articleRule = PB.inputArticle && PB.inputArticle.value
    ? `[참고 문서]: """${PB.inputArticle.value}"""\n참고 문서의 정보를 활용해 더 풍부하게 작성하되, 그대로 복사하지 마세요.`
    : '';

  const faqRule = PB.chkFaq.checked
    ? '글 마지막에 독자에게 유용한 FAQ 섹션(Q1, Q2, Q3)을 3개 작성해주세요.'
    : '';

  const prompt = `당신은 최고의 멀티모달 블로그 포스팅 전문 SEO 전문가입니다. 사진 분석과 아래 설정에 따라 블로그 글을 작성해주세요.

[기본 설정]
- 카테고리 분야: ${categoryName}
- 글쓰기 톤/말투: ${toneInstruction}
- 핵심 주제/장소/대상: ${PB.inputSubject.value || '사진 기반 자동 주제 추론'}
- 목표 키워드: ${PB.keywordsList.join(', ')}

[작성 지시사항]
1. 첨부된 이미지를 꼼꼼하게 시각 분석하여 매장의 분위기, 색감, 인테리어를 생동감 있게 묘사하세요.
2. ${dateRule}
3. ${descRule}
4. ${articleRule}
5. ${humanizeRule}
6. 목표 키워드를 자연스럽게 녹여 4~6개의 문단으로 나눠 작성하세요.
7. ${faqRule}

[정확한 출력 형식 (반드시 준수)]:
아래 3개의 섹션으로 구분하여 출력해주세요.

[SEO_TITLES]
1. (SEO에 최적화된 제목 1)
2. (제목 2)
3. (제목 3)
4. (제목 4)
5. (제목 5)

[SEO_KEYWORDS]
#키워드1, #키워드2, #키워드3, #키워드4, #키워드5, #키워드6, #키워드7, #키워드8, #키워드9, #키워드10

[MAIN_CONTENT]
[TITLE]: (위 5개 제목 중 가장 클릭율이 높을 최종 제목 1개)
(본문 HTML. h2, h3, p, ul, li 태그를 적절히 사용. 이미지 위치는 <img src="assets/이미지명.png" alt="사진 묘사"> 형식으로 1~3개 삽입)`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        ...PB.uploadedFiles.map(f => ({ inlineData: { mimeType: f.type, data: f.base64 } }))
      ]
    }]
  };

  const targetModel = (PB.selectCategoryEngine && PB.selectCategoryEngine.value) || PB.selectedModel || 'gemini-3.6-flash';
  const rawText = await callGemini(targetModel, payload);

  // 응답 파싱
  let seoTitles = [], seoKeywords = [];
  let title = '자동 생성된 제목';
  let body  = rawText;

  if (rawText.includes('[SEO_TITLES]')) {
    const [, afterTitles] = rawText.split('[SEO_TITLES]');
    if (afterTitles && afterTitles.includes('[SEO_KEYWORDS]')) {
      const [titlesRaw, rest] = afterTitles.split('[SEO_KEYWORDS]');
      seoTitles = titlesRaw.trim().split('\n').map(t => t.replace(/^\d+\.\s*/, '').replace(/[*"']/g, '').trim()).filter(Boolean);
      if (rest && rest.includes('[MAIN_CONTENT]')) {
        const [kwRaw, main] = rest.split('[MAIN_CONTENT]');
        seoKeywords = kwRaw.trim().split(',').map(k => k.trim()).filter(Boolean);
        body = main.trim();
      } else {
        body = (rest || '').trim();
      }
    }
  }

  if (body.startsWith('[TITLE]:')) {
    const lines = body.split('\n');
    title = lines[0].replace('[TITLE]:', '').trim();
    body  = lines.slice(1).join('\n').trim();
  } else if (body.includes('\n')) {
    const idx = body.indexOf('\n');
    title = body.substring(0, idx).replace('[TITLE]:', '').trim();
    body  = body.substring(idx + 1).trim();
  }

  return { title, body, seoTitles, seoKeywords };
};
