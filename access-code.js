// Access code popup and verification for all files and videos
// Each content (file/video) has a unique code
// Codes are stored in the backend

const MAX_ATTEMPTS = 5;
let currentContentId = null;
let currentContentUrl = null;
let attempts = 0;

// تحديد أساس الـ API ديناميكياً مع دعم النشر الثابت
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:7878/api' : '/api';

async function fetchCodesWithFallback() {
    // المحاولة عبر API ثم السقوط إلى الملف الثابت
    try {
        const res = await fetch(`${API_BASE}/codes`, { cache: 'no-store' });
        if (!res.ok) throw new Error('API unavailable');
        return await res.json();
    } catch (_) {
        const res2 = await fetch('codes.json', { cache: 'no-store' });
        if (!res2.ok) throw new Error('codes.json not found');
        return await res2.json();
    }
}

// Create popup HTML
const popup = document.createElement('div');
popup.className = 'access-code-popup';
popup.innerHTML = `
  <div class="popup-content">
    <span class="close-popup" style="float:right;cursor:pointer;font-size:24px">&times;</span>
    <h2>أدخل كود الوصول</h2>
    <input type="text" class="code-input" maxlength="6" placeholder="أدخل الكود هنا">
    <button class="verify-button">تحقق</button>
    <div class="error-message" style="color:red;display:none"></div>
    <div class="attempts-left" style="margin-top:5px"></div>
  </div>
`;
document.body.appendChild(popup);
popup.style.display = 'none';

const codeInput = popup.querySelector('.code-input');
const verifyButton = popup.querySelector('.verify-button');
const errorMessage = popup.querySelector('.error-message');
const attemptsLeft = popup.querySelector('.attempts-left');
const closeButton = popup.querySelector('.close-popup');

function showPopup(contentId, url) {
    currentContentId = contentId;
    // تطبيع المسار واستبدال الشرطة العكسية إلى مائلة للأمام
    currentContentUrl = (url || '').replace(/\\/g, '/');
    attempts = 0;
    codeInput.value = '';
    errorMessage.style.display = 'none';
    attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS}`;
    popup.style.display = 'flex';
    codeInput.disabled = false;
    verifyButton.disabled = false;
    codeInput.focus();
}
function hidePopup() {
    popup.style.display = 'none';
}
closeButton.onclick = hidePopup;
popup.onclick = function(e) { if (e.target === popup) hidePopup(); };

// Video modal
const videoModal = document.createElement('div');
videoModal.className = 'video-modal';
videoModal.style.display = 'none';
videoModal.style.position = 'fixed';
videoModal.style.top = '0';
videoModal.style.left = '0';
videoModal.style.width = '100vw';
videoModal.style.height = '100vh';
videoModal.style.background = 'rgba(0,0,0,0.8)';
videoModal.style.justifyContent = 'center';
videoModal.style.alignItems = 'center';
videoModal.style.zIndex = '9999';
videoModal.innerHTML = `
  <div class="video-modal-content" style="position:relative;max-width:90vw;max-height:90vh;">
    <span class="close-video-modal" style="position:absolute;top:10px;left:10px;font-size:32px;color:#fff;cursor:pointer;z-index:2;">&times;</span>
    <div class="video-embed-container" style="width:80vw;height:45vw;max-width:900px;max-height:506px;background:#000;display:flex;align-items:center;justify-content:center;"></div>
  </div>
`;
document.body.appendChild(videoModal);
const closeVideoModalBtn = videoModal.querySelector('.close-video-modal');
const videoEmbedContainer = videoModal.querySelector('.video-embed-container');
closeVideoModalBtn.onclick = function() {
    videoModal.style.display = 'none';
    videoEmbedContainer.innerHTML = '';
    document.body.style.overflow = '';
};
videoModal.onclick = function(e) {
    if (e.target === videoModal) {
        videoModal.style.display = 'none';
        videoEmbedContainer.innerHTML = '';
        document.body.style.overflow = '';
    }
};

// PDF modal
const pdfModal = document.createElement('div');
pdfModal.className = 'pdf-modal';
pdfModal.style.display = 'none';
pdfModal.style.position = 'fixed';
pdfModal.style.top = '0';
pdfModal.style.left = '0';
pdfModal.style.width = '100vw';
pdfModal.style.height = '100vh';
pdfModal.style.background = 'rgba(0,0,0,0.8)';
pdfModal.style.justifyContent = 'center';
pdfModal.style.alignItems = 'center';
pdfModal.style.zIndex = '9999';
pdfModal.innerHTML = `
  <div class="pdf-modal-content" style="position:relative;max-width:90vw;max-height:90vh;background:#fff;border-radius:12px;padding:1rem;">
    <span class="close-pdf-modal" style="position:absolute;top:10px;left:10px;font-size:32px;color:#333;cursor:pointer;z-index:2;">&times;</span>
    <div class="pdf-embed-container" style="width:80vw;height:80vh;max-width:900px;max-height:90vh;display:flex;align-items:center;justify-content:center;"></div>
    <a class="pdf-download-link" href="#" download style="display:inline-block;margin-top:1rem;background:#e53935;color:#fff;padding:0.5rem 1.5rem;border-radius:8px;text-decoration:none;">تحميل الملف</a>
  </div>
`;
document.body.appendChild(pdfModal);
const closePdfModalBtn = pdfModal.querySelector('.close-pdf-modal');
const pdfEmbedContainer = pdfModal.querySelector('.pdf-embed-container');
const pdfDownloadLink = pdfModal.querySelector('.pdf-download-link');
closePdfModalBtn.onclick = function() {
    pdfModal.style.display = 'none';
    pdfEmbedContainer.innerHTML = '';
    document.body.style.overflow = '';
};
pdfModal.onclick = function(e) {
    if (e.target === pdfModal) {
        pdfModal.style.display = 'none';
        pdfEmbedContainer.innerHTML = '';
        document.body.style.overflow = '';
    }
};

function getEmbedUrl(url) {
    // YouTube
    if (/youtu\.be|youtube\.com/.test(url)) {
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split(/[?&]/)[0];
        } else if (url.includes('youtube.com/watch')) {
            const params = new URLSearchParams(url.split('?')[1]);
            videoId = params.get('v');
        } else if (url.includes('/embed/')) {
            // دعم روابط YouTube المضمنة مباشرة
            videoId = url.split('/embed/')[1]?.split(/[?&]/)[0] || '';
        }
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&fs=1`;
        }
    }
    // Google Drive
    if (/drive\.google\.com/.test(url)) {
        let match = url.match(/\/file\/d\/([^/]+)/);
        let id = match ? match[1] : null;
        if (!id) {
            const params = new URLSearchParams(url.split('?')[1]);
            id = params.get('id');
        }
        if (id) {
            return `https://drive.google.com/file/d/${id}/preview`;
        }
    }
    return null;
}
function showVideoModal(url) {
    const embedUrl = getEmbedUrl(url);
    if (!embedUrl) {
        // حل بديل: فتح الرابط الأصلي في تبويب جديد إذا كان صالحاً
        if (url && url !== '#' && url !== 'about:blank') {
            window.open(url, '_blank');
        } else {
            alert('رابط الفيديو غير متاح حالياً.');
        }
        return;
    }
    videoEmbedContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    // إذا فشل التضمين بسبب سياسات X-Frame، أظهر زر فتح في تبويب جديد
    iframe.addEventListener('error', function() {
        videoEmbedContainer.innerHTML = '';
        const openBtn = document.createElement('a');
        openBtn.textContent = 'فتح الفيديو في تبويب جديد';
        openBtn.href = url;
        openBtn.target = '_blank';
        openBtn.style.background = '#e53935';
        openBtn.style.color = '#fff';
        openBtn.style.padding = '0.6rem 1rem';
        openBtn.style.borderRadius = '8px';
        openBtn.style.textDecoration = 'none';
        videoEmbedContainer.appendChild(openBtn);
    });
    videoEmbedContainer.appendChild(iframe);
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function showPdfModal(url) {
    const normalizedUrl = (url || '').replace(/\\/g, '/');
    if (!normalizedUrl || normalizedUrl === '#') {
        alert('رابط الملف غير متاح حالياً.');
        return;
    }
    pdfEmbedContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = normalizedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    pdfEmbedContainer.appendChild(iframe);
    pdfDownloadLink.href = normalizedUrl;
    pdfModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

async function handleVerify() {
    const code = codeInput.value.trim();
    attempts++;
    const originalText = verifyButton.textContent;
    verifyButton.textContent = 'جاري التحقق...';
    verifyButton.disabled = true;
    codeInput.disabled = true;
    try {
        const codes = await fetchCodesWithFallback();
        const isVideo = /^[FST]\d+$/.test(currentContentId);
        const isFile = /^F[FST]\d+$/.test(currentContentId);
        let found = null;
        if (isVideo) {
            found = codes.find(c => c.videoId === currentContentId && String(c.code).trim().toUpperCase() === code.toUpperCase());
        } else if (isFile) {
            found = codes.find(c => c.fileId === currentContentId && String(c.code).trim().toUpperCase() === code.toUpperCase());
        }
        const alreadyUsed = found && (found.used === true);
        const savedPassword = (localStorage.getItem('gelvano_password') || '').trim();
        const passMatch = !!found && !!found.password && savedPassword && String(found.password).trim().toUpperCase() === savedPassword.toUpperCase();
        const isValid = !!found && !alreadyUsed && passMatch;
        if (!!found && !alreadyUsed && !passMatch) {
            errorMessage.textContent = isVideo ? 'هذا الفيديو غير متاح لك' : 'هذا الملف غير متاح لك';
            errorMessage.style.display = 'block';
            if (attempts >= MAX_ATTEMPTS) {
                attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
            } else {
                attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
            }
        }
        if (isValid) {
            // محاولة تعليم الكود كمستخدم فقط إذا كنا على API حقيقي
            try {
                if (found.id) {
                    await fetch(`${API_BASE}/codes/${found.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ used: true })
                    });
                }
            } catch (_) { /* تجاهل في وضع الملفات الثابتة */ }
            hidePopup();
            if (isVideo) {
                showVideoModal(currentContentUrl);
            } else if (isFile) {
                showPdfModal(currentContentUrl);
            }
        } else {
            errorMessage.textContent = isVideo ? 'كود غير صحيح أو مستخدم بالفعل لهذا الفيديو' : 'كود غير صحيح أو مستخدم بالفعل لهذا الملف';
            errorMessage.style.display = 'block';
            if (attempts >= MAX_ATTEMPTS) {
                attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
            } else {
                attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
            }
        }
    } catch (e) {
        errorMessage.textContent = 'تعذر الاتصال للتحقق من الكود. حاول لاحقاً.';
        errorMessage.style.display = 'block';
    } finally {
        if (attempts < MAX_ATTEMPTS) {
            verifyButton.disabled = false;
            codeInput.disabled = false;
        }
        verifyButton.textContent = originalText;
    }
}

verifyButton.onclick = handleVerify;
codeInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!verifyButton.disabled) {
            handleVerify();
        }
    }
});

// --- منع مشاركة الفيديوهات ---
function blockShareButtons() {
  // أي زر أو رابط فيه كلمة share أو مشاركة أو أيقونة مشاركة
  const shareSelectors = [
    'button', 'a', '[role="button"]', '[aria-label]', '[title]', 
    '[data-tooltip]', '.ytp-button', '.ytp-menuitem', 
    '[aria-label*="Share"]', '[aria-label*="مشاركة"]',
    '[title*="Share"]', '[title*="مشاركة"]',
    'button[aria-label*="share"]', 'button[aria-label*="مشاركة"]',
    'a[href*="share"]', 'a[href*="مشاركة"]'
  ];
  
  shareSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      const txt = (el.innerText + ' ' + (el.title||'') + ' ' + (el.getAttribute('aria-label')||'') + ' ' + (el.getAttribute('data-tooltip')||'')).toLowerCase();
      const href = (el.href || '').toLowerCase();
      const className = (el.className || '').toLowerCase();
      
      // كلمات مفتاحية للمشاركة
      const shareKeywords = [
        'share', 'مشاركة', 'شارك', 'share video', 'مشاركة الفيديو',
        'embed', 'embed video', 'embed code', 'embed link',
        'copy link', 'نسخ الرابط', 'copy url', 'نسخ العنوان',
        'social', 'social media', 'وسائل التواصل', 'social share',
        'facebook', 'twitter', 'whatsapp', 'telegram', 'instagram',
        'linkedin', 'pinterest', 'reddit', 'tumblr'
      ];
      
      // أيقونات المشاركة الشائعة
      const shareIcons = [
        'fa-share', 'fa-share-alt', 'fa-share-square', 'fa-external-link',
        'fa-link', 'fa-copy', 'fa-clipboard', 'fa-paper-plane',
        'fa-facebook', 'fa-twitter', 'fa-whatsapp', 'fa-telegram',
        'fa-instagram', 'fa-linkedin', 'fa-pinterest', 'fa-reddit'
      ];
      
      const isShareButton = shareKeywords.some(keyword => 
        txt.includes(keyword) || href.includes(keyword) || className.includes(keyword)
      ) || shareIcons.some(icon => 
        className.includes(icon) || el.querySelector(`.${icon}`) || el.querySelector(`[class*="${icon}"]`)
      );
      
      if (isShareButton) {
        // منع النقر
        el.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          alert('⚠️ يمنع مشاركة هذا الفيديو');
          return false;
        };
        
        // منع الأحداث الأخرى
        el.onmousedown = function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        };
        
        el.oncontextmenu = function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        };
        
        // تغيير المظهر
        el.style.opacity = '0.6';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'not-allowed';
        el.style.filter = 'grayscale(100%)';
        el.classList.add('share-button-blocked', 'no-select', 'no-drag');
        
        // إضافة عنوان تحذيري
        el.title = 'يمنع مشاركة هذا الفيديو';
        el.setAttribute('aria-label', 'يمنع مشاركة هذا الفيديو');
      }
    });
  });
}

// مراقبة مستمرة للفيديوهات المضمنة
function monitorVideoModal() {
  const videoModal = document.querySelector('.video-modal');
  if (videoModal && videoModal.style.display !== 'none') {
    const iframe = videoModal.querySelector('iframe');
    if (iframe) {
      // مراقبة محتوى الـ iframe
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          const shareElements = iframeDoc.querySelectorAll('button, a, [role="button"]');
          shareElements.forEach(el => {
            const txt = (el.innerText + ' ' + (el.title||'') + ' ' + (el.getAttribute('aria-label')||'')).toLowerCase();
            if (txt.includes('share') || txt.includes('مشاركة') || txt.includes('embed')) {
              el.style.display = 'none';
            }
          });
        }
      } catch (e) {
        // تجاهل أخطاء CORS
      }
    }
  }
}

// مراقبة أزرار YouTube المحددة
function blockYouTubeShareButtons() {
  // أزرار YouTube المحددة
  const youtubeShareSelectors = [
    '.ytp-share-button',
    '.ytp-menuitem[aria-label*="Share"]',
    '.ytp-menuitem[aria-label*="مشاركة"]',
    'button[aria-label*="Share"]',
    'button[aria-label*="مشاركة"]',
    '.ytp-button[aria-label*="Share"]',
    '.ytp-button[aria-label*="مشاركة"]',
    '[data-tooltip*="Share"]',
    '[data-tooltip*="مشاركة"]'
  ];
  
  youtubeShareSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.display = 'none';
      el.remove();
    });
  });
}

// مراقبة أزرار Google Drive
function blockGoogleDriveShareButtons() {
  const driveShareSelectors = [
    '[aria-label*="Share"]',
    '[aria-label*="مشاركة"]',
    'button[data-tooltip*="Share"]',
    'button[data-tooltip*="مشاركة"]',
    '.docs-icon-share',
    '.drive-icon-share',
    '[role="button"][aria-label*="Share"]'
  ];
  
  driveShareSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.display = 'none';
      el.remove();
    });
  });
}

// دالة شاملة لمراقبة جميع أنواع المشاركة
function comprehensiveShareBlocking() {
  blockShareButtons();
  blockYouTubeShareButtons();
  blockGoogleDriveShareButtons();
  monitorVideoModal();
}

// نفذ عند تحميل الصفحة وأيضاً بعد أي تحديث ديناميكي
setTimeout(comprehensiveShareBlocking, 500);
document.addEventListener('DOMContentLoaded', comprehensiveShareBlocking);
setInterval(comprehensiveShareBlocking, 1000); // زيادة التكرار

// مراقبة إضافية عند فتح الفيديوهات
const originalShowVideoModal = showVideoModal;
showVideoModal = function(url) {
  originalShowVideoModal(url);
  // مراقبة إضافية بعد فتح الفيديو
  setTimeout(() => {
    comprehensiveShareBlocking();
    // مراقبة مستمرة للفيديو المفتوح
    const videoInterval = setInterval(() => {
      if (document.querySelector('.video-modal').style.display === 'none') {
        clearInterval(videoInterval);
      } else {
        comprehensiveShareBlocking();
      }
    }, 500);
  }, 1000);
};

// منع نسخ الرابط من شريط العنوان
function preventUrlCopying() {
  // منع اختيار النص في شريط العنوان
  document.addEventListener('keydown', function(e) {
    // منع Ctrl+A (اختيار الكل)
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      return false;
    }
    
    // منع Ctrl+C (نسخ)
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      return false;
    }
    
    // منع Ctrl+V (لصق)
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      return false;
    }
    
    // منع F6 (الانتقال لشريط العنوان)
    if (e.key === 'F6') {
      e.preventDefault();
      return false;
    }
    
    // منع Ctrl+L (الانتقال لشريط العنوان)
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      return false;
    }
  });
  
  // منع النقر على شريط العنوان
  window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  });
  
  // منع تغيير الرابط
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      window.location.href = currentUrl;
    }
  }, 100);
}

// تشغيل منع نسخ الرابط
preventUrlCopying();

// منع مشاركة الفيديوهات عبر لوحة المفاتيح
function preventKeyboardSharing() {
  document.addEventListener('keydown', function(e) {
    // منع اختصارات المشاركة الشائعة
    const shareShortcuts = [
      // Windows/Linux
      { ctrl: true, shift: true, key: 'S' }, // مشاركة في بعض التطبيقات
      { ctrl: true, key: 'D' }, // إضافة للمفضلة
      { ctrl: true, key: 'T' }, // تبويب جديد
      { ctrl: true, key: 'N' }, // نافذة جديدة
      { ctrl: true, key: 'W' }, // إغلاق التبويب
      { ctrl: true, key: 'R' }, // تحديث الصفحة
      { ctrl: true, key: 'F5' }, // تحديث الصفحة
      
      // Mac
      { meta: true, shift: true, key: 'S' },
      { meta: true, key: 'D' },
      { meta: true, key: 'T' },
      { meta: true, key: 'N' },
      { meta: true, key: 'W' },
      { meta: true, key: 'R' }
    ];
    
    const isShareShortcut = shareShortcuts.some(shortcut => {
      return (shortcut.ctrl ? e.ctrlKey : !e.ctrlKey) &&
             (shortcut.shift ? e.shiftKey : !e.shiftKey) &&
             (shortcut.meta ? e.metaKey : !e.metaKey) &&
             e.key.toLowerCase() === shortcut.key.toLowerCase();
    });
    
    if (isShareShortcut) {
      e.preventDefault();
      e.stopPropagation();
      alert('⚠️ يمنع مشاركة هذا الفيديو');
      return false;
    }
  });
}

// تشغيل منع المشاركة عبر لوحة المفاتيح
preventKeyboardSharing();

// منع مشاركة الفيديوهات عبر قائمة السياق
function preventContextMenuSharing() {
  document.addEventListener('contextmenu', function(e) {
    // منع قائمة السياق تماماً
    e.preventDefault();
    e.stopPropagation();
    return false;
  });
  
  // منع النقر بالزر الأيمن على الفيديوهات
  document.addEventListener('mousedown', function(e) {
    if (e.button === 2) { // الزر الأيمن
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
  
  // منع اختصارات لوحة المفاتيح لقائمة السياق
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F10' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
}

// تشغيل منع قائمة السياق
preventContextMenuSharing();

// منع مشاركة الفيديوهات عبر أزرار المتصفح
function preventBrowserSharing() {
  // منع إضافة للمفضلة
  window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  });
  
  // منع فتح في تبويب جديد
  document.addEventListener('click', function(e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      const target = e.target.closest('a');
      if (target && target.href) {
        e.preventDefault();
        e.stopPropagation();
        alert('⚠️ يمنع مشاركة هذا الفيديو');
        return false;
      }
    }
  });
  
  // منع فتح في نافذة جديدة
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a');
    if (target && (target.target === '_blank' || target.target === '_new')) {
      e.preventDefault();
      e.stopPropagation();
      alert('⚠️ يمنع مشاركة هذا الفيديو');
      return false;
    }
  });
  
  // منع نسخ الرابط
  document.addEventListener('copy', function(e) {
    e.preventDefault();
    e.stopPropagation();
    alert('⚠️ يمنع مشاركة هذا الفيديو');
    return false;
  });
  
  // منع لصق الرابط
  document.addEventListener('paste', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });
}

// تشغيل منع مشاركة المتصفح
preventBrowserSharing();

// دالة لعرض رسالة تحذيرية أنيقة
function showShareWarning() {
  // إزالة الرسالة السابقة إن وجدت
  const existingWarning = document.querySelector('.share-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  // إنشاء رسالة تحذيرية جديدة
  const warning = document.createElement('div');
  warning.className = 'share-warning';
  warning.innerHTML = '⚠️ يمنع مشاركة هذا الفيديو';
  
  // إضافة الرسالة للصفحة
  document.body.appendChild(warning);
  
  // إزالة الرسالة بعد 3 ثوان
  setTimeout(() => {
    if (warning && warning.parentNode) {
      warning.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (warning && warning.parentNode) {
          warning.remove();
        }
      }, 300);
    }
  }, 3000);
}

// تحديث جميع رسائل التنبيه لاستخدام الرسالة الأنيقة
function updateAlertMessages() {
  // استبدال alert بـ showShareWarning في جميع الأماكن
  const originalAlert = window.alert;
  window.alert = function(message) {
    if (message && message.includes('يمنع مشاركة هذا الفيديو')) {
      showShareWarning();
    } else {
      originalAlert(message);
    }
  };
}

// تشغيل تحديث رسائل التنبيه
updateAlertMessages();

document.addEventListener('DOMContentLoaded', function() {
    // Attach to all file and video links on page load
    const selectors = ['a.download-button[data-content-id]', 'a.play-button[data-content-id]'];
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const contentId = this.getAttribute('data-content-id');
                const url = this.getAttribute('href');
                showPopup(contentId, url);
            });
        });
    });
});
