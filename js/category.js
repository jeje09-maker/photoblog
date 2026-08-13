/**
 * category.js — 카테고리 탭 & 모델 엔진 옵션
 */

'use strict';

PB.initCategory = function () {
  const catTabs = document.querySelectorAll('.category-tab');

  catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      PB.currentCategory = tab.dataset.category;

      if (PB.categoryEngineMap[PB.currentCategory]) {
        PB.selectCategoryEngine.value = PB.categoryEngineMap[PB.currentCategory];
      } else {
        PB.selectCategoryEngine.value = PB.selectedModel || 'gemini-3.6-flash';
      }
      PB.showToast(`[${tab.textContent.trim()}] 카테고리 및 맞춤 AI 엔진이 적용되었습니다.`);
    });
  });

  if (PB.selectCategoryEngine) {
    PB.selectCategoryEngine.addEventListener('change', () => {
      PB.categoryEngineMap[PB.currentCategory] = PB.selectCategoryEngine.value;
      localStorage.setItem('photoblog_cat_engines', JSON.stringify(PB.categoryEngineMap));
      PB.showToast(`[${PB.currentCategory}] 카테고리 엔진을 '${PB.selectCategoryEngine.value}'(으)로 저장했습니다.`);
    });
  }
};
