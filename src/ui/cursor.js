/**
 * @file cursor.js
 * @description 마우스 커서 광원(Glow) 효과를 처리하는 애니메이션 모듈입니다.
 */
import { State, DOM } from '../state.js';
const { cursorGlow } = DOM;

function animateCursor() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    if (cursorGlow) {
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
    }
    requestAnimationFrame(animateCursor);
  }
export { animateCursor };
