/**
 * app.js — photoBlog 메인 엔트리포인트
 * 모든 모듈을 순서에 맞게 초기화합니다.
 * 
 * 모듈 로드 순서 (index.html 참고):
 *   state.js → ui.js → settings.js → upload.js → keywords.js
 *   → presets.js → category.js → gemini.js → demo-content.js
 *   → generator.js → renderer.js → naver.js → copy.js → app.js
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // 1. DOM 요소 참조 초기화
  PB.initDOM();

  // 2. UI 유틸 초기화 (커서 글로우, 모달 오버레이, FAQ 아코디언)
  PB.initCursorGlow();
  PB.initModalOverlayClose();
  PB.initFaqAccordion();
  PB.initMiscModals();

  // 3. 설정 모달 (API 키, 모델 선택)
  PB.initSettings();

  // 4. 이미지 업로드 & WebP 변환
  PB.initUpload();

  // 5. SEO 키워드 태그 입력
  PB.initKeywords();

  // 6. 데모 프리셋 버튼
  PB.initPresets();

  // 7. 카테고리 탭 & 엔진 선택
  PB.initCategory();

  // 8. 생성 버튼
  PB.initGenerator();

  // 9. 네이버 에디터 인젝션
  PB.initNaverEditor();

  // 10. 복사 기능
  PB.initCopy();
});
