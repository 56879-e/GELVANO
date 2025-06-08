// List of valid access codes (to be replaced with actual codes)
const validAccessCodes = ['1234', '5678', '9012', '3333'];

// Store verified codes in localStorage
const STORAGE_KEY = 'verifiedAccessCodes';

// Get verified codes from localStorage
function getVerifiedCodes() {
    const codes = localStorage.getItem(STORAGE_KEY);
    return codes ? JSON.parse(codes) : [];
}

// Save verified code to localStorage
function saveVerifiedCode(code) {
    const codes = getVerifiedCodes();
    if (!codes.includes(code)) {
        codes.push(code);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    }
}

// Check if code is verified
function isCodeVerified(code) {
    return getVerifiedCodes().includes(code);
}

// Create and show the access code modal
function showAccessCodeModal(contentId, contentType) {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'access-code-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>أدخل رمز الوصول</h3>
                <button class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <input type="text" 
                           maxlength="4" 
                           pattern="[0-9]*" 
                           inputmode="numeric" 
                           class="access-code-input" 
                           placeholder="أدخل الرمز المكون من 4 أرقام">
                    <div class="error-message"></div>
                </div>
                <button class="verify-button">تحقق</button>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.appendChild(modal);

    // Get modal elements
    const input = modal.querySelector('.access-code-input');
    const verifyButton = modal.querySelector('.verify-button');
    const closeButton = modal.querySelector('.close-button');
    const errorMessage = modal.querySelector('.error-message');

    // Focus input
    input.focus();

    // Handle input - only allow numbers
    input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Handle verification
    verifyButton.addEventListener('click', () => {
        const code = input.value;
        
        if (code.length !== 4) {
            errorMessage.textContent = 'الرجاء إدخال 4 أرقام';
            return;
        }

        if (validAccessCodes.includes(code) || isCodeVerified(code)) {
            saveVerifiedCode(code);
            modal.remove();
            
            // Trigger the original action
            if (contentType === 'video') {
                window.location.href = contentId;
            } else if (contentType === 'file') {
                const link = document.createElement('a');
                link.href = contentId;
                link.download = '';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
            errorMessage.textContent = 'رمز غير صحيح';
        }
    });

    // Handle close button
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.remove();
        }
    });

    // Prevent clicks outside modal from closing it
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            e.stopPropagation();
        }
    });
}

// Initialize access code verification for all videos and files
document.addEventListener('DOMContentLoaded', () => {
    // Handle video links
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const videoUrl = button.closest('.video-card').querySelector('a').href;
            showAccessCodeModal(videoUrl, 'video');
        });
    });

    // Handle file downloads
    document.querySelectorAll('.download-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const fileUrl = button.href;
            showAccessCodeModal(fileUrl, 'file');
        });
    });
}); 