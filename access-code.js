// Access code popup and verification for all files and videos
// Each content (file/video) has a unique 4-digit code
// Codes are stored in this object (update as needed)
const accessCodes = {
    // First grade
    'first-grade-video-1': ['AB123', 'CD456'],
    'first-grade-video-2': ['EF789', 'GH012'],
    'first-grade-file-1': ['3719', '5021'],
    'first-grade-file-2': ['3719', '5021'],
    // Second grade
    'second-grade-video-1': ['IJ345', 'KL678'],
    'second-grade-video-2': ['MN901', 'OP234'],
    'second-grade-file-1': ['3719', '5021'],
    'second-grade-file-2': ['3719', '5021'],
    // Third grade
    'third-grade-video-1': ['QR567', 'ST890'],
    'third-grade-video-2': ['UV123', 'WX456'],
    'third-grade-file-1': ['3719', '0000'],
    'third-grade-file-2': ['2468']
};

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
    if (contentId && contentId.includes('video')) {
        codeInput.maxLength = 5;
        codeInput.placeholder = "مثال: AB123";
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
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`;
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
            // Disable download, sharing, etc.
            return `https://drive.google.com/file/d/${id}/preview`;
        }
    }
    return null;
}

function showVideoModal(url) {
    const embedUrl = getEmbedUrl(url);
    if (!embedUrl) return;
    // Remove previous iframe
    videoEmbedContainer.innerHTML = '';
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    // For Google Drive, try to block context menu and drag
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    // Create overlay to block YouTube share button (top right corner)
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.width = '80px';
    overlay.style.height = '60px';
    overlay.style.zIndex = '10';
    overlay.style.cursor = 'pointer';
    overlay.style.background = 'rgba(0,0,0,0)'; // transparent
    overlay.title = 'تم تعطيل زر المشاركة';
    overlay.onclick = function() {
        // Stop video and hide modal
        hideVideoModal();
    };
    // Container for positioning overlay and iframe
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    container.appendChild(iframe);
    container.appendChild(overlay);
    videoEmbedContainer.appendChild(container);
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
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

verifyButton.onclick = function() {
    const code = codeInput.value.trim();
    attempts++;

    const allowedCodes = accessCodes[currentContentId];
    // If it's a video, require two letters + three numbers
    let isValid = false;
    if (currentContentId && currentContentId.includes('video')) {
        // Validate format: two letters followed by three digits
        const videoCodePattern = /^[A-Za-z]{2}\d{3}$/;
        if (videoCodePattern.test(code)) {
            isValid = Array.isArray(allowedCodes) ? allowedCodes.includes(code) : code === allowedCodes;
        }
    } else {
        // For files, keep old logic (4-digit code)
        isValid = Array.isArray(allowedCodes) ? allowedCodes.includes(code) : code === allowedCodes;
    }

    if (isValid) {
        hidePopup();
        // Check if it's a video or file
        if (currentContentId && currentContentId.includes('video')) {
            // Instead of window.open, show modal
            showVideoModal(currentContentUrl);
        } else {
            // For files, show PDF modal with viewer and download
            showPdfModal(currentContentUrl);
        }
    } else {
        errorMessage.textContent = 'كود غير صحيح';
        errorMessage.style.display = 'block';
        if (attempts >= MAX_ATTEMPTS) {
            codeInput.disabled = true;
            verifyButton.disabled = true;
            attemptsLeft.textContent = 'تم استنفاد جميع المحاولات';
        } else {
            attemptsLeft.textContent = `محاولات متبقية: ${MAX_ATTEMPTS - attempts}`;
        }
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
