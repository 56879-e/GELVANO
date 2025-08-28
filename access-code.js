// Access code popup and verification for all files and videos
// Each content (file/video) has a unique code
// Codes are stored in the studentAccess object below

const MAX_ATTEMPTS = 5;
let currentContentId = null;
let currentContentUrl = null;
let attempts = 0;

// Create popup HTML
const popup = document.createElement('div');
popup.className = 'access-code-popup';
popup.innerHTML = `
  <div class="popup-content">
    <span class="close-popup" style="float:right;cursor:pointer;font-size:24px">&times;</span>
    <h2>أدخل كود الوصول</h2>
    <input type="text" class="code-input" maxlength="4" placeholder="أدخل الكودهنا ">
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

// حذف studentAccess نهائياً

function showPopup(contentId, url) {
    currentContentId = contentId;
    currentContentUrl = url;
    attempts = 0;
    codeInput.value = '';
    errorMessage.style.display = 'none';
    attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS}`;
    popup.style.display = 'flex';
    codeInput.disabled = false;
    verifyButton.disabled = false;

    // Set maxlength and placeholder based on content type
    if (contentId && /^[FST]\d+$/.test(contentId)) {
        codeInput.maxLength = 5;
        codeInput.placeholder = "مثال: FF151";
    } else if (contentId && /^F[FST]\d+$/.test(contentId)) {
        codeInput.maxLength = 4;
        codeInput.placeholder = "أدخل الكودهنا ";
    } else {
        codeInput.maxLength = 4;
        codeInput.placeholder = "أدخل الكودهنا ";
    }
    codeInput.focus();
}

function hidePopup() {
    popup.style.display = 'none';
}

closeButton.onclick = hidePopup;
popup.onclick = function(e) { if (e.target === popup) hidePopup(); };

// Video modal HTML
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
    <div class="video-embed-container" style="width:80vw;height:45vw;max-width:900px;max-height:506px;background:#000;display:flex;align-items:center;justify-content:center;">
      <!-- Video iframe will be injected here -->
    </div>
  </div>
`;
document.body.appendChild(videoModal);

const closeVideoModalBtn = videoModal.querySelector('.close-video-modal');
const videoEmbedContainer = videoModal.querySelector('.video-embed-container');

function getEmbedUrl(url) {
    // YouTube
    if (/youtu\.be|youtube\.com/.test(url)) {
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split(/[?&]/)[0];
        } else if (url.includes('youtube.com/watch')) {
            const params = new URLSearchParams(url.split('?')[1]);
            videoId = params.get('v');
        }
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&fs=1&disablekb=1&iv_load_policy=3&cc_load_policy=0&showinfo=0`;
        }
    }
    // Google Drive
    if (/drive\.google\.com/.test(url)) {
        // Accept both /file/d/ID and /open?id=ID
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
    if (!embedUrl) return;
    videoEmbedContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    
    // Add overlay to block share buttons for all video types
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.width = '200px';
    overlay.style.height = '100px';
    overlay.style.zIndex = '10';
    overlay.style.cursor = 'pointer';
    overlay.style.background = 'rgba(0,0,0,0)';
    overlay.title = 'تم تعطيل زر المشاركة لحماية الملكية الفكرية';
    
    // Create container for iframe and overlay
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    
    // Add click handler for overlay
    overlay.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        // Show warning message
        showWarningMessage('تم تعطيل زر المشاركة لحماية الملكية الفكرية');
    };
    
    container.appendChild(iframe);
    container.appendChild(overlay);
    videoEmbedContainer.appendChild(container);
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add CSS to block share buttons for all video platforms
    addShareButtonBlockingCSS();
    
    // Add event listener for iframe load
    iframe.addEventListener('load', function() {
        // Apply protection based on video platform
        if (/youtu\.be|youtube\.com/.test(url)) {
            // YouTube specific protection
            setTimeout(() => {
                addYouTubeShareProtection(iframe);
            }, 2000);
        } else if (/drive\.google\.com/.test(url)) {
            // Google Drive specific protection
            setTimeout(() => {
                addGoogleDriveShareProtection(iframe);
            }, 2000);
        } else {
            // Generic protection for other video platforms
            setTimeout(() => {
                addGenericShareProtection(iframe);
            }, 2000);
        }
    });
}

// Function to show warning messages
function showWarningMessage(message) {
    const warning = document.createElement('div');
    warning.style.position = 'fixed';
    warning.style.top = '20px';
    warning.style.left = '50%';
    warning.style.transform = 'translateX(-50%)';
    warning.style.backgroundColor = '#d5472f';
    warning.style.color = 'white';
    warning.style.padding = '10px 20px';
    warning.style.borderRadius = '5px';
    warning.style.zIndex = '10000';
    warning.style.fontFamily = 'Tajawal, sans-serif';
    warning.style.fontSize = '14px';
    warning.textContent = message;
    
    document.body.appendChild(warning);
    
    setTimeout(() => {
        warning.remove();
    }, 3000);
}

// Function to add CSS for blocking share buttons on all platforms
function addShareButtonBlockingCSS() {
    if (!document.getElementById('share-button-blocking')) {
        const style = document.createElement('style');
        style.id = 'share-button-blocking';
        style.textContent = `
            /* Universal Share Button Blocking */
            /* YouTube */
            .ytp-share-button,
            .ytp-share-button-visible,
            .ytp-share-icon,
            .ytp-share-title,
            [aria-label*="Share"],
            [aria-label*="مشاركة"],
            [title*="Share"],
            [title*="مشاركة"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                width: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
            }
            
            /* Google Drive */
            [aria-label*="Share"],
            [aria-label*="مشاركة"],
            [title*="Share"],
            [title*="مشاركة"],
            .docs-ml-share-button,
            .docs-ml-share-icon {
                display: none !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
            
            /* Generic share button blocking */
            [class*="share"],
            [id*="share"],
            [data-testid*="share"],
            [aria-label*="Share"],
            [aria-label*="مشاركة"] {
                display: none !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Function to add protection for YouTube share functionality
function addYouTubeShareProtection(iframe) {
    try {
        // Try to inject CSS into the iframe to block share button
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
            const style = iframeDoc.createElement('style');
            style.textContent = `
                /* Block YouTube share button and related elements */
                .ytp-share-button,
                .ytp-share-button-visible,
                .ytp-share-icon,
                .ytp-share-title,
                [aria-label*="Share"],
                [aria-label*="مشاركة"],
                [title*="Share"],
                [title*="مشاركة"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    position: absolute !important;
                    left: -9999px !important;
                    top: -9999px !important;
                    width: 0 !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
            `;
            iframeDoc.head.appendChild(style);
        }
    } catch (e) {
        // Cross-origin restrictions may prevent this, but overlay protection is active
        console.log('YouTube share protection applied via overlay');
    }
}

// Function to add protection for Google Drive share functionality
function addGoogleDriveShareProtection(iframe) {
    try {
        // Try to inject CSS into the iframe to block share button
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
            const style = iframeDoc.createElement('style');
            style.textContent = `
                /* Block Google Drive share button and related elements */
                [aria-label*="Share"],
                [aria-label*="مشاركة"],
                [title*="Share"],
                [title*="مشاركة"],
                .docs-ml-share-button,
                .docs-ml-share-icon {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    position: absolute !important;
                    left: -9999px !important;
                    top: -9999px !important;
                    width: 0 !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
            `;
            iframeDoc.head.appendChild(style);
        }
    } catch (e) {
        // Cross-origin restrictions may prevent this, but overlay protection is active
        console.log('Google Drive share protection applied via overlay');
    }
}

// Function to add generic protection for other video platforms
function addGenericShareProtection(iframe) {
    try {
        // Try to inject CSS into the iframe to block share button
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
            const style = iframeDoc.createElement('style');
            style.textContent = `
                /* Block generic share button and related elements */
                [class*="share"],
                [id*="share"],
                [data-testid*="share"],
                [aria-label*="Share"],
                [aria-label*="مشاركة"],
                [title*="Share"],
                [title*="مشاركة"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    position: absolute !important;
                    left: -9999px !important;
                    top: -9999px !important;
                    width: 0 !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
            `;
            iframeDoc.head.appendChild(style);
        }
    } catch (e) {
        // Cross-origin restrictions may prevent this, but overlay protection is active
        console.log('Generic share protection applied via overlay');
    }
}

function hideVideoModal() {
    videoModal.style.display = 'none';
    videoEmbedContainer.innerHTML = '';
    document.body.style.overflow = '';
}

closeVideoModalBtn.onclick = hideVideoModal;
videoModal.onclick = function(e) {
    if (e.target === videoModal) hideVideoModal();
};

// PDF modal HTML
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
    <div class="pdf-embed-container" style="width:80vw;height:80vh;max-width:900px;max-height:90vh;display:flex;align-items:center;justify-content:center;">
      <!-- PDF iframe will be injected here -->
    </div>
    <a class="pdf-download-link" href="#" download style="display:inline-block;margin-top:1rem;background:#e53935;color:#fff;padding:0.5rem 1.5rem;border-radius:8px;text-decoration:none;">تحميل الملف</a>
  </div>
`;
document.body.appendChild(pdfModal);

const closePdfModalBtn = pdfModal.querySelector('.close-pdf-modal');
const pdfEmbedContainer = pdfModal.querySelector('.pdf-embed-container');
const pdfDownloadLink = pdfModal.querySelector('.pdf-download-link');

function showPdfModal(url) {
    pdfEmbedContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    pdfEmbedContainer.appendChild(iframe);
    pdfDownloadLink.href = url;
    pdfModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hidePdfModal() {
    pdfModal.style.display = 'none';
    pdfEmbedContainer.innerHTML = '';
    document.body.style.overflow = '';
}

closePdfModalBtn.onclick = hidePdfModal;
pdfModal.onclick = function(e) {
    if (e.target === pdfModal) hidePdfModal();
};

// تعديل زر التحقق ليعتمد على الأكواد من الباك اند
verifyButton.onclick = async function() {
    const code = codeInput.value.trim();
    attempts++;
    // جلب الأكواد من الباك اند
    try {
        const API = "http://localhost:7878/api";
        const res = await fetch(`${API}/codes`);
        const codes = await res.json();
        
        // تحديد نوع المحتوى (فيديو أم ملف)
        const isVideo = /^[FST]\d+$/.test(currentContentId);
        const isFile = /^F[FST]\d+$/.test(currentContentId);
        
        // البحث عن الكود المناسب حسب نوع المحتوى
        let found = null;
        if (isVideo) {
            // البحث في أكواد الفيديوهات
            found = codes.find(c => c.videoId === currentContentId && c.code === code && !c.used);
        } else if (isFile) {
            // البحث في أكواد الملفات
            found = codes.find(c => c.fileId === currentContentId && c.code === code && !c.used);
        }
        
        let isValid = false;
        if (found) isValid = true;
        
        if (isValid) {
            // تحديث حالة الكود إلى مستخدم
            await fetch(`${API}/codes/${found.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ used: true })
            });
            hidePopup();
            
            // عرض المحتوى المناسب حسب النوع
            if (isVideo) {
                showVideoModal(currentContentUrl);
            } else if (isFile) {
                showPdfModal(currentContentUrl);
            } else {
                showPdfModal(currentContentUrl);
            }
        } else {
            // رسالة خطأ مخصصة حسب نوع المحتوى
            if (isVideo) {
                errorMessage.textContent = 'كود غير صحيح أو مستخدم بالفعل لهذا الفيديو';
            } else if (isFile) {
                errorMessage.textContent = 'كود غير صحيح أو مستخدم بالفعل لهذا الملف';
            } else {
                errorMessage.textContent = 'كود غير صحيح أو مستخدم بالفعل لهذا المحتوى';
            }
            
            errorMessage.style.display = 'block';
            if (attempts >= MAX_ATTEMPTS) {
                codeInput.disabled = true;
                verifyButton.disabled = true;
                attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
            } else {
                attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
            }
        }
    } catch (e) {
        errorMessage.textContent = 'حدث خطأ في الاتصال بالخادم. حاول لاحقاً.';
        errorMessage.style.display = 'block';
    }
};

// Attach to all file and video links on page load
document.addEventListener('DOMContentLoaded', function() {
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
