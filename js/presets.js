/**
 * presets.js — 데모 프리셋 (파리 에펠탑 / 오랑주리 카페)
 */

'use strict';

PB.loadPresetImageToBase64 = async function (url, name) {
  try {
    const blob = await (await fetch(url)).blob();
    return await PB.convertToWebp(new File([blob], name, { type: blob.type }));
  } catch (e) {
    console.error('Preset image load failed:', e);
    return {
      name: name.replace(/\.[^/.]+$/, '') + '.webp',
      type: 'image/webp',
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      previewUrl: url
    };
  }
};

PB.initPresets = function () {
  const presetParis    = document.getElementById('presetParis');
  const presetOrangery = document.getElementById('presetOrangery');

  if (presetParis) {
    presetParis.addEventListener('click', async () => {
      PB.activeDemoPreset = 'paris';
      presetParis.classList.add('active');
      if (presetOrangery) presetOrangery.classList.remove('active');

      PB.inputSubject.value = '파리 에펠탑 감성 여행';
      PB.inputDate.value    = '2026-06-15';
      PB.inputDesc.value    = '에펠탑 근처 카페에서 바라본 저녁 풍경. 황금빛 조명과 거리의 낭만이 가득했던 여행.';
      PB.keywordsList = ['파리여행', '에펠탑야경', '프랑스감성'];
      PB.renderKeywordTags();

      PB.uploadedFiles = [];
      PB.renderPreviews();
      PB.showToast('파리 에펠탑 샘플 이미지를 로드 중...');
      const fileObj = await PB.loadPresetImageToBase64('assets/paris_travel.png', 'paris_travel.png');
      PB.uploadedFiles.push(fileObj);
      PB.renderPreviews();
      PB.showToast('파리 에펠탑 데이터 로드 완료!');
    });
  }

  if (presetOrangery) {
    presetOrangery.addEventListener('click', async () => {
      PB.activeDemoPreset = 'orangery';
      presetOrangery.classList.add('active');
      if (presetParis) presetParis.classList.remove('active');

      PB.inputSubject.value = '파리 오랑주리 식물원 카페';
      PB.inputDate.value    = '2026-07-10';
      PB.inputDesc.value    = '초록빛 식물로 가득한 유리 온실 카페. 조용한 음악과 따뜻한 커피 한 잔이 어우러진 공간.';
      PB.keywordsList = ['파리오랑주리', '식물원카페', '파리여행'];
      PB.renderKeywordTags();

      PB.uploadedFiles = [];
      PB.renderPreviews();
      PB.showToast('오랑주리 카페 샘플 이미지를 로드 중...');
      const fileObj = await PB.loadPresetImageToBase64('assets/orangery_cafe.png', 'orangery_cafe.png');
      PB.uploadedFiles.push(fileObj);
      PB.renderPreviews();
      PB.showToast('오랑주리 카페 데이터 로드 완료!');
    });
  }
};
