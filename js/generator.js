/**
 * generator.js — 블로그 생성 버튼 이벤트 핸들러 & 프로그레스 바
 */

'use strict';

PB.initGenerator = function () {
  PB.btnGenerate.addEventListener('click', async () => {
    if (!PB.uploadedFiles.length && !PB.activeDemoPreset) {
      PB.showToast('블로그를 생성하려면 최소 1장의 사진을 업로드해 주세요.');
      return;
    }
    if (!PB.inputSubject.value.trim()) {
      PB.showToast('블로그 주제 또는 장소명을 입력해주세요.');
      return;
    }

    // UI — 로딩 시작
    PB.outputPlaceholder.classList.add('hidden');
    PB.outputContent.classList.add('hidden');
    PB.outputLoading.classList.remove('hidden');
    PB.btnGenerate.disabled = true;

    const btnText = PB.btnGenerate.querySelector('.btn-gen-text');
    const origText = btnText ? btnText.innerHTML : '✨ 블로그 포스트 생성하기';
    if (btnText) btnText.innerHTML = '⏳ 실행 중...';

    // 프로그레스 바
    let progress = 0;
    PB.progressBar.style.width = '0%';
    const messages = [
      'Gemini Vision 멀티모달 모델이 사진 WebP 데이터를 분석 중입니다...',
      '사진 내 매장 레이아웃, 조명, 색상 요소를 추출하고 있습니다...',
      '선택한 블로그 최적화 템플릿과 프롬프트를 통합하여 원고를 설계하고 있습니다...',
      'SEO 최적화 검증 및 문체 다듬기 작업을 마무리하는 중입니다...'
    ];
    const interval = setInterval(() => {
      progress += (100 - progress) * 0.1;
      PB.progressBar.style.width = `${Math.min(progress, 95)}%`;
      const idx = progress < 30 ? 0 : progress < 60 ? 1 : progress < 85 ? 2 : 3;
      PB.loadingStatus.textContent = messages[idx];
    }, 350);

    try {
      let result;
      if (PB.apiKey) {
        result = await PB.generateBlogWithGemini();
      } else {
        await new Promise(r => setTimeout(r, 3000));
        result = PB.generateLocalDemoContent();
      }

      PB.generatedTitle       = result.title;
      PB.generatedBody        = result.body;
      PB.generatedSeoTitles   = result.seoTitles   || [];
      PB.generatedSeoKeywords = result.seoKeywords || [];

      clearInterval(interval);
      PB.progressBar.style.width   = '100%';
      PB.loadingStatus.textContent = '생성 완료!';

      setTimeout(() => {
        PB.outputLoading.classList.add('hidden');
        PB.renderGeneratedOutput();
        PB.btnGenerate.disabled = false;
        if (btnText) btnText.innerHTML = origText;
        PB.showToast('블로그 포스트가 성공적으로 생성되었습니다!');
      }, 500);

    } catch (error) {
      console.error(error);
      clearInterval(interval);
      PB.outputLoading.classList.add('hidden');
      PB.outputPlaceholder.classList.remove('hidden');
      PB.btnGenerate.disabled = false;
      if (btnText) btnText.innerHTML = origText;
      PB.showToast(`글 생성 에러: ${error.message}`, 6000);
    }
  });
};
