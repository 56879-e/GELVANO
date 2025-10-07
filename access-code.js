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
    // Remove overlays if present
    const modalContent = videoModal.querySelector('.video-modal-content');
    if (modalContent) modalContent.querySelectorAll('.video-overlay').forEach(el => el.remove());
    videoModal.style.display = 'none';
    videoEmbedContainer.innerHTML = '';
    document.body.style.overflow = '';
};
videoModal.onclick = function(e) {
    if (e.target === videoModal) {
        const modalContent = videoModal.querySelector('.video-modal-content');
        if (modalContent) modalContent.querySelectorAll('.video-overlay').forEach(el => el.remove());
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
    // Ensure previous overlays are removed (avoid duplicates)
    const modalContent = videoModal.querySelector('.video-modal-content');
    function removeVideoOverlays() {
        if (!modalContent) return;
        modalContent.querySelectorAll('.video-overlay').forEach(el => el.remove());
    }
    removeVideoOverlays();

    videoEmbedContainer.appendChild(iframe);

    // Create transparent overlays to block clicks on top-left and top-right YouTube overlay UI
    if (modalContent) {
        const overlayTopLeft = document.createElement('div');
        overlayTopLeft.className = 'video-overlay top-left';
        overlayTopLeft.setAttribute('title', '');
        overlayTopLeft.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); });
        overlayTopLeft.addEventListener('contextmenu', function(e) { e.preventDefault(); });

        const overlayTopRight = document.createElement('div');
        overlayTopRight.className = 'video-overlay top-right';
        overlayTopRight.setAttribute('title', '');
        overlayTopRight.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); });
        overlayTopRight.addEventListener('contextmenu', function(e) { e.preventDefault(); });

        // Insert overlays into the modal content so they sit above the iframe but below the close button
        modalContent.appendChild(overlayTopLeft);
        modalContent.appendChild(overlayTopRight);
    }
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
// --- Dynamic blocking overlay & calibration helpers ---
// Zones are stored as percentages relative to the iframe bounding box: { x, y, w, h } in [0..1]
const DEFAULT_BLOCK_ZONES = [
    // small top-left zone
    { x: 0.01, y: 0.01, w: 0.12, h: 0.10 },
    // top-right title/profile area (broad)
    { x: 0.55, y: 0.02, w: 0.44, h: 0.12 }
];

function loadBlockZones() {
    try {
        const raw = localStorage.getItem('gelvano_block_zones');
        if (!raw) return DEFAULT_BLOCK_ZONES.slice();
        return JSON.parse(raw);
    } catch (e) {
        return DEFAULT_BLOCK_ZONES.slice();
    }
}

function saveBlockZones(zones) {
    try { localStorage.setItem('gelvano_block_zones', JSON.stringify(zones)); } catch (e) { /* ignore */ }
}

// Attach a smart overlay that intercepts clicks over the iframe and blocks clicks in configured zones.
function attachSmartOverlayToModal() {
    const modalContent = videoModal.querySelector('.video-modal-content');
    const iframe = videoEmbedContainer.querySelector('iframe');
    if (!modalContent || !iframe) return null;

    // remove existing overlay if present
    modalContent.querySelectorAll('.video-smart-overlay, .video-calibrate-panel').forEach(n => n.remove());

    const overlay = document.createElement('div');
    overlay.className = 'video-smart-overlay';

    // Zones in percent
    const zones = loadBlockZones();

    // draw debug boxes if debugging
    function renderDebugBoxes() {
        overlay.querySelectorAll('.debug-zone').forEach(n => n.remove());
        if (!overlay.dataset.debug) return;
        const r = iframe.getBoundingClientRect();
        zones.forEach((z, i) => {
            const el = document.createElement('div');
            el.className = 'debug-zone';
            el.style.left = (z.x * 100) + '%';
            el.style.top = (z.y * 100) + '%';
            el.style.width = (z.w * 100) + '%';
            el.style.height = (z.h * 100) + '%';
            el.title = 'blocked zone ' + (i+1);
            overlay.appendChild(el);
        });
    }

    // check if a relative point is inside any zone
    function isInZones(relX, relY) {
        return zones.some(z => relX >= z.x && relY >= z.y && relX <= (z.x + z.w) && relY <= (z.y + z.h));
    }

    // On pointerdown: decide whether to block
    overlay.addEventListener('pointerdown', function(ev) {
        const rect = iframe.getBoundingClientRect();
        const relX = (ev.clientX - rect.left) / rect.width;
        const relY = (ev.clientY - rect.top) / rect.height;
        // if outside iframe area, ignore
        if (relX < 0 || relY < 0 || relX > 1 || relY > 1) return;

        if (isInZones(relX, relY)) {
            ev.stopPropagation();
            ev.preventDefault();
            // visual feedback briefly
            overlay.classList.add('blocked-flash');
            setTimeout(() => overlay.classList.remove('blocked-flash'), 220);
            return;
        }

        // allow click to pass through: temporarily disable pointer-events on overlay so the iframe receives the event
        overlay.style.pointerEvents = 'none';
        // re-enable after next tick to avoid intercepting further events
        requestAnimationFrame(() => { overlay.style.pointerEvents = ''; });
    }, { passive: false });

    // calibration UI: panel with buttons
    const panel = document.createElement('div');
    panel.className = 'video-calibrate-panel';
    panel.innerHTML = `
        <button class="calib-start">معايرة</button>
        <button class="calib-clear">مسح الحظر</button>
        <label><input type="checkbox" class="calib-debug"> عرض مناطق الحظر</label>
        <button class="calib-save">حفظ</button>
    `;

    // calibration state
    let calibrating = false;
    let tempZones = zones.slice();

    panel.querySelector('.calib-start').addEventListener('click', function() {
        calibrating = true;
        tempZones = zones.slice();
        panel.querySelector('.calib-start').textContent = 'انقر على المناطق لإضافتها (إنهاء)';
        overlay.dataset.calibrating = '1';
        overlay.dataset.debug = '1';
        renderDebugBoxes();
    });
    panel.querySelector('.calib-clear').addEventListener('click', function() {
        tempZones = [];
        zones.length = 0;
        saveBlockZones(zones);
        renderDebugBoxes();
        alert('تم مسح مناطق الحظر');
    });
    panel.querySelector('.calib-save').addEventListener('click', function() {
        // copy tempZones to persistent zones
        try { zones.length = 0; tempZones.forEach(z => zones.push(z)); saveBlockZones(zones); } catch (e) {}
        alert('تم حفظ إعدادات الحظر');
    });
    const debugCheckbox = panel.querySelector('.calib-debug');
    debugCheckbox.addEventListener('change', function() {
        if (debugCheckbox.checked) overlay.dataset.debug = '1'; else delete overlay.dataset.debug;
        renderDebugBoxes();
    });

    // when calibrating, record clicks as small zones
    overlay.addEventListener('click', function(ev) {
        if (!calibrating) return;
        const rect = iframe.getBoundingClientRect();
        const relX = (ev.clientX - rect.left) / rect.width;
        const relY = (ev.clientY - rect.top) / rect.height;
        const zoneSizeW = 0.12;
        const zoneSizeH = 0.10;
        const newZone = {
            x: Math.max(0, relX - zoneSizeW/2),
            y: Math.max(0, relY - zoneSizeH/2),
            w: zoneSizeW,
            h: zoneSizeH
        };
        tempZones.push(newZone);
        // reflect immediate
        zones.length = 0; tempZones.forEach(z => zones.push(z));
        renderDebugBoxes();
        // if user clicked the panel button to finish, toggling is handled by Start button; here, we keep calibrating until user clicks Start again
    });

    // stop calibrating when user clicks Start again
    panel.querySelector('.calib-start').addEventListener('dblclick', function() {
        calibrating = false;
        delete overlay.dataset.calibrating;
        panel.querySelector('.calib-start').textContent = 'معايرة';
        renderDebugBoxes();
    });

    // show the panel in a corner of modalContent
    modalContent.appendChild(panel);
    modalContent.appendChild(overlay);

    // keep debug boxes in sync when window resizes
    const ro = new ResizeObserver(() => renderDebugBoxes());
    ro.observe(modalContent);

    // return cleanup function
    return function detach() {
        ro.disconnect();
        modalContent.querySelectorAll('.video-smart-overlay, .video-calibrate-panel').forEach(n => n.remove());
    };
}

// Whenever we open a video modal, attach the smart overlay
const originalShowVideoModal = showVideoModal;
// wrap showVideoModal so overlay is attached after iframe insertion
showVideoModal = function(url) {
    originalShowVideoModal(url);
    // small timeout so iframe exists and layout stabilizes
    setTimeout(() => { attachSmartOverlayToModal(); }, 120);
};
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
    // Normalize user input: remove all whitespace inside the code and trim
    const code = (codeInput.value || '').replace(/\s+/g, '').trim();
    attempts++;
    const originalText = verifyButton.textContent;
    verifyButton.textContent = 'جاري التحقق...';
    verifyButton.disabled = true;
    codeInput.disabled = true;
    try {
        const codes = await fetchCodesWithFallback();
        // Normalize the content id and allow IDs with an optional hyphen part (e.g. T8-1)
        // Also treat hyphenated and non-hyphenated IDs as equivalent (T8-1 === T801)
        const contentId = String(currentContentId || '').trim();
        const isVideo = /^[FST]\d+(?:-\d+)?$/i.test(contentId);
        const isFile = /^F[FST]\d+(?:-\d+)?$/i.test(contentId) || /^FF\d+(?:-\d+)?$/i.test(contentId);

        // helper: normalize id by removing hyphens, trimming and uppercasing
        const normalizeId = (s) => String(s || '').trim().toUpperCase().replace(/-/g, '');
        const normalizedContentId = normalizeId(contentId);

        let found = null;
        if (isVideo) {
            found = codes.find(c => normalizeId(c.videoId) === normalizedContentId && String(c.code).trim().toUpperCase() === code.toUpperCase());
        } else if (isFile) {
            found = codes.find(c => normalizeId(c.fileId) === normalizedContentId && String(c.code).trim().toUpperCase() === code.toUpperCase());
        }
        // التحقق من وجود الكود أولاً
        if (!found) {
            // Debug info for developer (will appear in the browser console)
            console.debug('Access code lookup failed', {
                contentId: contentId,
                normalizedContentId: normalizedContentId,
                inputCode: code,
                normalizedInputCode: code.toUpperCase()
            });

            errorMessage.textContent = isVideo ? 'كود غير صحيح لهذا الفيديو' : 'كود غير صحيح لهذا الملف';
            errorMessage.style.display = 'block';
            if (attempts >= MAX_ATTEMPTS) {
                attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
            } else {
                attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
            }
            return;
        }

        // التحقق من كلمة السر
        const savedPassword = (localStorage.getItem('gelvano_password') || '').trim();
        const passMatch = !!found.password && savedPassword && String(found.password).trim().toUpperCase() === savedPassword.toUpperCase();
        
        if (!passMatch) {
            errorMessage.textContent = isVideo ? 'هذا الفيديو غير متاح لك' : 'هذا الملف غير متاح لك';
            errorMessage.style.display = 'block';
            if (attempts >= MAX_ATTEMPTS) {
                attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
            } else {
                attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
            }
            return;
        }

        // التحقق من حالة الاستخدام (نفحص فقط علامة 'used'؛ لم نعد نطبق حد أقصى لعدد الاستخدامات)
        const alreadyUsed = found.used === true;

        if (alreadyUsed) {
            errorMessage.textContent = isVideo ? 'هذا الكود مستخدم بالفعل لهذا الفيديو' : 'هذا الكود مستخدم بالفعل لهذا الملف';
            errorMessage.style.display = 'block';
            if (attempts >= MAX_ATTEMPTS) {
                attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
            } else {
                attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
            }
            return;
        }

        // إذا وصلنا هنا، الكود صحيح ويمكن استخدامه
        // محاولة زيادة عدد مرات الاستخدام إذا كنا على API حقيقي
        let useSuccess = false;
        try {
            if (found.id) {
                const useResponse = await fetch(`${API_BASE}/codes/${found.id}/use`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (useResponse.ok) {
                    // الخادم الآن لا يمنع الاستخدام بناءً على عدد المرات - نعتبر الطلب ناجحاً لو استجاب الخادم بنجاح
                    useSuccess = true;
                } else {
                    console.error('فشل في تحديث عدد مرات الاستخدام');
                    // في حالة فشل التحديث، نعتبر الاستخدام ناجح لتجنب منع المستخدم
                    useSuccess = true;
                }
            } else {
                // في حالة عدم وجود ID (وضع الملفات الثابتة)، نعتبر الاستخدام ناجح
                useSuccess = true;
            }
        } catch (error) { 
            console.error('خطأ في تحديث عدد مرات الاستخدام:', error);
            // في حالة الخطأ، نعتبر الاستخدام ناجح لتجنب منع المستخدم
            useSuccess = true;
        }
        
        if (useSuccess) {
            // إظهار رسالة نجاح
            const successMessage = document.createElement('div');
            successMessage.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #4CAF50;
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                z-index: 10000;
                font-size: 18px;
                font-weight: bold;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                text-align: center;
            `;
            successMessage.textContent = 'تم التحقق من الكود بنجاح!';
            document.body.appendChild(successMessage);
            
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.parentNode.removeChild(successMessage);
                }
            }, 1500);
            
            // إرسال رسالة لتحديث صفحة الإدارة
            try {
                window.parent.postMessage('codeUsed', '*');
            } catch (e) {
                // تجاهل الخطأ إذا لم تكن الصفحة في iframe
            }
            
            // محاولة إرسال رسالة عبر localStorage كبديل
            try {
                localStorage.setItem('gelvano_code_used', Date.now().toString());
            } catch (e) {
                // تجاهل الخطأ
            }
            
            hidePopup();
            if (isVideo) {
                showVideoModal(currentContentUrl);
            } else if (isFile) {
                showPdfModal(currentContentUrl);
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
    'button', 'a', '[role="button"]', '[aria-label]', '[title]'
  ];
  shareSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      const txt = (el.innerText + ' ' + (el.title||'') + ' ' + (el.getAttribute('aria-label')||'')).toLowerCase();
      if (txt.includes('share') || txt.includes('مشاركة')) {
        el.onclick = function(e) {
          e.preventDefault();
          alert('يمنع مشاركة هذا الفيديو');
          return false;
        };
        el.style.opacity = '0.6';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'not-allowed';
      }
    });
  });
}
// نفذ عند تحميل الصفحة وأيضاً بعد أي تحديث ديناميكي
setTimeout(blockShareButtons, 500);
document.addEventListener('DOMContentLoaded', blockShareButtons);
setInterval(blockShareButtons, 2000);

document.addEventListener('DOMContentLoaded', function() {
    // Attach to all file and video links on page load
    const selectors = ['a.download-button[data-content-id]', 'a.play-button[data-content-id]', 'a.lesson-bar[data-content-id]'];
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
