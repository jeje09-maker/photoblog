/**
 * @file fileUtils.js
 * @description HEIC 지원 및 WebP 이미지 변환, 파일 크기 포맷을 담당하는 유틸리티입니다.
 */
import { State, DOM } from '../state.js';
async function convertToWebp(file) {
    return new Promise(async (resolve, reject) => {
      const originalSize = file.size;
      
      // HEIC 변환 지원
      if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
        try {
          if (typeof heic2any !== 'undefined') {
            const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg' });
            file = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
          } else {
            console.warn('heic2any library is not loaded');
          }
        } catch (err) {
          return reject(new Error('HEIC 변환에 실패했습니다.'));
        }
      } // ?먮낯 ?뚯씪 諛붿씠???ш린 ???      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Image size scaling limit for token and network performance (max 1200px)
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Output WebP data URL with 0.85 compression quality
          const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
          const base64Data = webpDataUrl.split(',')[1];
          
          // WebP base64 ?곗씠?곗쓽 ?ㅼ젣 諛붿씠???ш린 怨꾩궛
          const webpSize = Math.round((base64Data.length * 3) / 4);
          const compressionRate = originalSize > 0 ? Math.round((1 - webpSize / originalSize) * 100) : 0;
          
          resolve({
            name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
            type: 'image/webp',
            base64: base64Data,
            previewUrl: webpDataUrl,
            originalSize: originalSize,
            webpSize: webpSize,
            compressionRate: Math.max(0, compressionRate)
          });
        };
        img.onerror = () => reject(new Error('Image load failed.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('File reading failed.'));
      reader.readAsDataURL(file);
    });
  }

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
export { convertToWebp, formatFileSize };
