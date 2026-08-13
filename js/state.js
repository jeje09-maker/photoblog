/**
 * state.js — 전역 상태 및 DOM 요소 참조
 * photoBlog 공유 상태를 window 객체에 노출해 모든 모듈이 접근할 수 있도록 합니다.
 */

'use strict';

window.PB = window.PB || {};

// ── 전역 상태 ────────────────────────────────────────────
PB.apiKey        = localStorage.getItem('photoblog_api_key') || '';
PB.selectedModel = localStorage.getItem('photoblog_model')   || 'gemini-3.6-flash';
PB.uploadedFiles = [];        // { name, type, base64, previewUrl, ... }
PB.currentCategory    = 'restaurant';
PB.categoryEngineMap  = JSON.parse(localStorage.getItem('photoblog_cat_engines') || '{}');
PB.generatedTitle     = '';
PB.generatedBody      = '';
PB.generatedSeoTitles   = [];
PB.generatedSeoKeywords = [];
PB.activeDemoPreset     = null;   // 'paris' | 'orangery'
PB.keywordsList         = [];

// ── DOM 요소 참조 (DOMContentLoaded 이후 초기화) ─────────
PB.initDOM = function () {
  PB.navbar          = document.getElementById('navbar');
  PB.cursorGlow      = document.getElementById('cursorGlow');

  // 업로드
  PB.uploadZone      = document.getElementById('uploadZone');
  PB.fileInput       = document.getElementById('fileInput');
  PB.previewContainer = document.getElementById('previewContainer');
  PB.previewGrid     = document.getElementById('previewGrid');
  PB.btnClearPhotos  = document.getElementById('btnClearPhotos');

  // 메타 입력
  PB.inputSubject    = document.getElementById('inputSubject');
  PB.inputDate       = document.getElementById('inputDate');
  PB.inputDesc       = document.getElementById('inputDesc');
  PB.inputArticle    = document.getElementById('inputArticle');
  PB.fileInputDoc    = document.getElementById('fileInputDoc');

  // 옵션
  PB.selectBlogTone       = document.getElementById('selectBlogTone');
  PB.selectCategoryEngine = document.getElementById('selectCategoryEngine');
  PB.mainCategoryTabs     = document.getElementById('mainCategoryTabs');

  // 생성 / 출력
  PB.btnGenerate      = document.getElementById('btnGenerate');
  PB.outputPlaceholder = document.getElementById('outputPlaceholder');
  PB.outputLoading    = document.getElementById('outputLoading');
  PB.outputContent    = document.getElementById('outputContent');
  PB.progressBar      = document.getElementById('progressBar');
  PB.loadingStatus    = document.getElementById('loadingStatus');
  PB.articleMetaInfo  = document.getElementById('articleMetaInfo');
  PB.articleTitle     = document.getElementById('articleTitle');
  PB.articleBody      = document.getElementById('articleBody');
  PB.seoResultsCard   = document.getElementById('seoResultsCard');
  PB.seoTitleList     = document.getElementById('seoTitleList');
  PB.seoKeywordGrid   = document.getElementById('seoKeywordGrid');
  PB.btnSendToNaver   = document.getElementById('btnSendToNaver');
  PB.btnCopyHtml      = document.getElementById('btnCopyHtml');
  PB.btnCopyText      = document.getElementById('btnCopyText');
  PB.btnCopyRichText  = document.getElementById('btnCopyRichText');

  // 설정 모달
  PB.settingsModal    = document.getElementById('settingsModal');
  PB.btnOpenSettings  = document.getElementById('btnOpenSettings') || document.createElement('button');
  PB.btnCloseSettings = document.getElementById('btnCloseSettings');
  PB.btnSaveSettings  = document.getElementById('btnSaveSettings');
  PB.btnResetSettings = document.getElementById('btnResetSettings');
  PB.settingsApiKey   = document.getElementById('settingsApiKey');
  PB.mainApiKey       = document.getElementById('mainApiKey');
  PB.settingsModel    = document.getElementById('settingsModel');
  PB.btnTogglePw      = document.getElementById('btnTogglePw');
  PB.settingsStatusBox = document.getElementById('settingsStatusBox');

  // 네이버 에디터 모달
  PB.naverEditorModal  = document.getElementById('naverEditorModal');
  PB.btnCloseNaverEditor = document.getElementById('btnCloseNaverEditor');
  PB.naverTitleInput   = document.getElementById('naverTitleInput');
  PB.naverBodyArea     = document.getElementById('naverBodyArea');
  PB.btnStartInject    = document.getElementById('btnStartInject');
  PB.btnNaverPublish   = document.getElementById('btnNaverPublish');
  PB.btnNaverSave      = document.getElementById('btnNaverSave');

  // 비교 / FAQ 모달
  PB.compareModal     = document.getElementById('compareModal');
  PB.btnShowCompare   = document.getElementById('btnShowCompare')   || document.createElement('button');
  PB.btnCloseCompare  = document.getElementById('btnCloseCompare');
  PB.btnConfirmCompare = document.getElementById('btnConfirmCompare');
  PB.faqModal         = document.getElementById('faqModal');
  PB.btnShowFaq       = document.getElementById('btnShowFaq')  || document.createElement('button');
  PB.btnCloseFaq      = document.getElementById('btnCloseFaq');
  PB.btnConfirmFaq    = document.getElementById('btnConfirmFaq');

  // 기타
  PB.toast            = document.getElementById('toast');
  PB.inputKeywords    = document.getElementById('inputKeywords')    || document.createElement('input');
  PB.keywordTags      = document.getElementById('keywordTags')      || document.createElement('div');
  PB.btnExtractKeywords = document.getElementById('btnExtractKeywords') || document.createElement('button');
  PB.chkHumanize      = document.getElementById('chkHumanize')   || { checked: false };
  PB.chkFaq           = document.getElementById('chkFaq')        || { checked: false };

  // 오늘 날짜 기본값
  PB.inputDate.value = new Date().toISOString().substring(0, 10);
};
