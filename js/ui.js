/**
 * ui.js — Toast 알림, 모달 제어, 커서 글로우, 공통 유틸
 */

'use strict';

// ── Toast ────────────────────────────────────────────────
PB.showToast = function (message, duration = 3000) {
  PB.toast.textContent = message;
  PB.toast.classList.add('active');
  setTimeout(() => PB.toast.classList.remove('active'), duration);
};

// ── Modal ────────────────────────────────────────────────
PB.openModal  = (modal) => modal.classList.add('active');
PB.closeModal = (modal) => modal.classList.remove('active');

// ── 커서 글로우 애니메이션 ──────────────────────────────
PB.initCursorGlow = function () {
  let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
  (function animate() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    if (PB.cursorGlow) {
      PB.cursorGlow.style.left = glowX + 'px';
      PB.cursorGlow.style.top  = glowY + 'px';
    }
    requestAnimationFrame(animate);
  })();
};

// ── 모달 오버레이 클릭 닫기 ───────────────────────────────
PB.initModalOverlayClose = function () {
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) PB.closeModal(e.target);
  });
};

// ── FAQ 아코디언 ──────────────────────────────────────────
PB.initFaqAccordion = function () {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer   = item.querySelector('.faq-answer');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-answer').style.maxHeight = null;
      });
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
};

// ── 출력 액션 버튼 표시 ───────────────────────────────────
PB.updateOutputActionButtons = function () {
  if (PB.outputContent.classList.contains('hidden')) return;
  if (PB.btnCopyText)    PB.btnCopyText.classList.remove('hidden');
  if (PB.btnCopyHtml)    PB.btnCopyHtml.classList.remove('hidden');
  if (PB.btnCopyRichText) PB.btnCopyRichText.classList.remove('hidden');
  if (PB.btnSendToNaver) PB.btnSendToNaver.classList.remove('hidden');
};

// ── 파일 크기 포맷 ────────────────────────────────────────
PB.formatFileSize = function (bytes) {
  if (bytes < 1024)            return bytes + ' B';
  if (bytes < 1024 * 1024)     return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ── 빠른 날짜 설정 (HTML onclick에서 사용) ───────────────
window.setQuickDate = function (days) {
  const input = PB.inputDate || document.getElementById('inputDate');
  if (!input) return;
  if (days === '') { input.value = ''; return; }
  const d = new Date();
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset() * 60000;
  input.value = (new Date(d - offset)).toISOString().slice(0, 10);
};

// ── 비교/FAQ 모달 이벤트 ──────────────────────────────────
PB.initMiscModals = function () {
  PB.btnShowCompare.addEventListener('click', () => PB.openModal(PB.compareModal));
  PB.btnCloseCompare.addEventListener('click',  () => PB.closeModal(PB.compareModal));
  PB.btnConfirmCompare.addEventListener('click', () => PB.closeModal(PB.compareModal));
  PB.btnShowFaq.addEventListener('click',  () => PB.openModal(PB.faqModal));
  PB.btnCloseFaq.addEventListener('click', () => PB.closeModal(PB.faqModal));
  PB.btnConfirmFaq.addEventListener('click', () => PB.closeModal(PB.faqModal));
};
