/**
 * settings.js — API 키 / 모델 설정 모달
 */

'use strict';

PB.initSettings = function () {

  // 메인 인라인 API Key 입력
  if (PB.mainApiKey) {
    PB.mainApiKey.value = PB.apiKey;
    PB.mainApiKey.addEventListener('input', (e) => {
      PB.apiKey = e.target.value.trim();
      localStorage.setItem('photoblog_api_key', PB.apiKey);
      if (PB.settingsApiKey) PB.settingsApiKey.value = PB.apiKey;
      PB.updateSettingsStatus();
    });
  }

  // 설정 모달 열기
  PB.btnOpenSettings.addEventListener('click', () => {
    PB.settingsApiKey.value = PB.apiKey;
    PB.settingsModel.value  = PB.selectedModel;
    PB.updateSettingsStatus();
    PB.openModal(PB.settingsModal);
  });

  PB.btnCloseSettings.addEventListener('click', () => PB.closeModal(PB.settingsModal));

  // 저장
  PB.btnSaveSettings.addEventListener('click', () => {
    PB.apiKey        = PB.settingsApiKey.value.trim();
    PB.selectedModel = PB.settingsModel.value;
    localStorage.setItem('photoblog_api_key', PB.apiKey);
    localStorage.setItem('photoblog_model',   PB.selectedModel);
    if (PB.mainApiKey) PB.mainApiKey.value = PB.apiKey;
    PB.updateSettingsStatus();
    PB.closeModal(PB.settingsModal);
    PB.showToast('Gemini API 설정이 저장되었습니다.');
  });

  // 초기화
  PB.btnResetSettings.addEventListener('click', () => {
    PB.settingsApiKey.value = '';
    PB.settingsModel.value  = 'gemini-3.6-flash';
    PB.apiKey        = '';
    PB.selectedModel = 'gemini-3.6-flash';
    localStorage.removeItem('photoblog_api_key');
    localStorage.removeItem('photoblog_model');
    if (PB.mainApiKey) PB.mainApiKey.value = '';
    PB.updateSettingsStatus();
    PB.showToast('설정이 초기화되었습니다.');
  });

  // 비밀번호 토글
  PB.btnTogglePw.addEventListener('click', () => {
    const isPw = PB.settingsApiKey.type === 'password';
    PB.settingsApiKey.type = isPw ? 'text' : 'password';
    PB.btnTogglePw.innerHTML = isPw
      ? `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
           <line x1="1" y1="1" x2="23" y2="23"></line>
         </svg>`
      : `<svg class="icon-svg eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
           <circle cx="12" cy="12" r="3"></circle>
         </svg>`;
  });

  // .env 자동 로드
  PB.loadEnvApiKey();
};

PB.updateSettingsStatus = function () {
  if (!PB.settingsStatusBox) return;
  const dot  = PB.settingsStatusBox.querySelector('.status-dot');
  const text = PB.settingsStatusBox.querySelector('.status-text');
  if (PB.apiKey) {
    dot.className   = 'status-dot status-online';
    text.textContent = 'API 키가 연결된 상태';
  } else {
    dot.className   = 'status-dot status-offline';
    text.textContent = '무료 데모(로컬) 모드로 작동 중인 상태';
  }
};

PB.loadEnvApiKey = async function () {
  try {
    const response = await fetch('/.env');
    if (!response.ok) return;
    const text  = await response.text();
    const match = text.match(/GEMINI_API_KEY\s*=\s*([^\s#\r\n]+)/);
    if (match && match[1]) {
      PB.apiKey = match[1];
      localStorage.setItem('photoblog_api_key', PB.apiKey);
      if (PB.mainApiKey) PB.mainApiKey.value = PB.apiKey;
      PB.updateSettingsStatus();
      PB.showToast('.env 파일에서 Gemini API Key를 로드했습니다.', 3000);
    }
  } catch (e) {
    console.warn('Could not auto-load key from .env:', e);
  }
};
