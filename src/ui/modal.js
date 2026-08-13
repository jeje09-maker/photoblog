/**
 * @file modal.js
 * @description 토스트 메시지 표시 및 각종 모달 창(설정, 네이버 에디터 등) 제어 모듈입니다.
 */
import { State, DOM } from '../state.js';
const { settingsStatusBox, toast } = DOM;

function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, duration);
  }

function openModal(modal) {
    modal.classList.add('active');
  }

function closeModal(modal) {
    modal.classList.remove('active');
  }

function updateSettingsStatus() {
    const dot = settingsStatusBox.querySelector('.status-dot');
    const text = settingsStatusBox.querySelector('.status-text');
    if (State.apiKey) {
      dot.className = 'status-dot status-online';
      text.textContent = 'API ?⑤씪???곌껐 ?곹깭';
    } else {
      dot.className = 'status-dot status-offline';
      text.textContent = '濡쒖뺄 ?곕え(泥댄뿕) 紐⑤뱶濡??쒖꽦???곹깭';
    }
  }

async function loadEnvApiKey() {
    try {
      const response = await fetch('/.env');
      if (response.ok) {
        const text = await response.text();
        const match = text.match(/GEMINI_API_KEY\s*=\s*([^\s#\r\n]+)/);
        if (match && match[1]) {
          State.apiKey = match[1];
          localStorage.setItem('photoblog_api_key', State.apiKey);
          updateSettingsStatus();
          showToast('.env ?뚯씪?먯꽌 Gemini API Key瑜?濡쒕뱶?덉뒿?덈떎.', 3000);
        }
      }
    } catch (e) {
      console.warn('Could not auto-load key from .env:', e);
    }
  }
export { showToast, openModal, closeModal, updateSettingsStatus, loadEnvApiKey };
