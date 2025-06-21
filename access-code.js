// Access code popup and verification for all files and videos
// Each content (file/video) has a unique 4-digit code
// Codes are stored in this object (update as needed)
const accessCodes = {
    // First grade
    'first-grade-video-1': '1234',
    'first-grade-video-2': '2345',
    'first-grade-file-1': '3456',
    'first-grade-file-2': '4567',
    // Second grade
    'second-grade-video-1': '5678',
    'second-grade-video-2': '6789',
    'second-grade-file-1': '7890',
    'second-grade-file-2': '8901',
    // Third grade
    'third-grade-video-1': ['3719', '1426', '1048', '2037', '1110', '8237', '9022', '2900', '2297', '6611', '7261', '5912', '1220', '7706', '2111', '1807', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-2': ['8462', '3918', '3265', '1486', '2568', '9244', '7513', '1348', '8761', '3407', '3504', '7433', '6033', '4588', '3449', '2113', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-3': ['1093', '9603', '7891', '7002', '3344', '5306', '6620', '1011', '4600', '3950', '8892', '8035', '3177', '9914', '6701', '4935', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-4': ['2754', '2715', '4432', '8154', '4779', '1884', '1123', '9983', '7155', '1285', '4143', '2699', '8550', '1099', '9352', '7806', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-5': ['5021', '4382', '6380', '9406', '6005', '3789', '4051', '3149', '9433', '2134', '5213', '3000', '8531', '2972', '1101', '7428', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-6': ['6830', '5570', '5921', '3617', '7291', '8475', '8362', '6222', '5748', '9097', '6100', '1351', '4008', '1790', '2998', '8903', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-7': ['6830', '5570', '5921', '3617', '7291', '8475', '8362', '6222', '5748', '9097', '6100', '1351', '4008', '1790', '2998', '8903', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-8': ['6830', '5570', '5921', '3617', '7291', '8475', '8362', '6222', '5748', '9097', '6100', '1351', '4008', '1790', '2998', '8903', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-9': ['6830', '5570', '5921', '3617', '7291', '8475', '8362', '6222', '5748', '9097', '6100', '1351', '4008', '1790', '2998', '8903', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-10': ['6830', '5570', '5921', '3617', '7291', '8475', '8362', '6222', '5748', '9097', '6100', '1351', '4008', '1790', '2998', '8903', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-11': ['6830', '5570', '5921', '3617', '7291', '8475', '8362', '6222', '5748', '9097', '6100', '1351', '4008', '1790', '2998', '8903', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],
    'third-grade-video-12': ['6830', '5570', '5921', '3617', '7291', '8475', '8362', '6222', '5748', '9097', '6100', '1351', '4008', '1790', '2998', '8903', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'],

    'third-grade-file-1': ['1357'],
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
    videoEmbedContainer.appendChild(iframe);
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

verifyButton.onclick = function() {
    const code = codeInput.value.trim();
    attempts++;
    
    const allowedCodes = accessCodes[currentContentId];
    const isValid = Array.isArray(allowedCodes) ? allowedCodes.includes(code) : code === allowedCodes;

    if (isValid) {
        hidePopup();
        // Instead of window.open, show modal
        showVideoModal(currentContentUrl);
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
