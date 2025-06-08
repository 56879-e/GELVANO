// Access Code Management System
class AccessCodeManager {
    constructor(config = {}) {
        this.config = {
            maxAttempts: config.maxAttempts || 3,
            lockoutDuration: config.lockoutDuration || 15 * 60 * 1000, // 15 minutes
            storagePrefix: config.storagePrefix || 'access_code_',
            ...config
        };

        this.storageKeys = {
            attempts: `${this.config.storagePrefix}attempts`,
            lastAttempt: `${this.config.storagePrefix}last_attempt`,
            verifiedContent: `${this.config.storagePrefix}verified_content`
        };

        this.currentContent = {
            url: '',
            type: '',
            grade: ''
        };

        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
        this.setupContentLinks();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'access-code-modal';
        this.modal.innerHTML = `
            <div class="access-code-content">
                <h2 class="access-code-title">أدخل كود الوصول</h2>
                <form class="access-code-form">
                    <input type="text" class="access-code-input" maxlength="4" placeholder="XXXX" pattern="[0-9]{4}" required>
                    <button type="submit" class="verify-button">
                        <span class="button-text">تحقق</span>
                        <span class="loading-spinner"></span>
                    </button>
                    <div class="error-message"></div>
                    <div class="attempts-remaining"></div>
                </form>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    setupEventListeners() {
        // Input formatting
        const input = this.modal.querySelector('.access-code-input');
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });

        // Form submission
        this.modal.querySelector('form').addEventListener('submit', (e) => this.handleSubmit(e));

        // Modal close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Browser back button
        window.addEventListener('popstate', () => this.closeModal());
    }

    setupContentLinks() {
        document.addEventListener('DOMContentLoaded', () => {
            const contentLinks = document.querySelectorAll('.play-button, .download-button');
            contentLinks.forEach(link => {
                const url = link.getAttribute('href');
                const type = link.getAttribute('data-type') || 
                            (link.classList.contains('download-button') ? 'file' : 'video');
                const grade = this.determineGradeFromPath(window.location.pathname);

                link.setAttribute('data-original-url', url);
                link.setAttribute('href', '#');
                link.addEventListener('click', (e) => this.handleContentAccess(e, url, type, grade));
            });
        });
    }

    determineGradeFromPath(path) {
        if (path.includes('first-grade')) return 'firstGrade';
        if (path.includes('second-grade')) return 'secondGrade';
        if (path.includes('third-grade')) return 'thirdGrade';
        return null;
    }

    isLockedOut() {
        const lastAttempt = sessionStorage.getItem(this.storageKeys.lastAttempt);
        if (!lastAttempt) return false;
        
        const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
        return timeSinceLastAttempt < this.config.lockoutDuration;
    }

    updateAttemptsDisplay() {
        const attempts = parseInt(sessionStorage.getItem(this.storageKeys.attempts) || '0');
        const attemptsDisplay = this.modal.querySelector('.attempts-remaining');
        
        if (attempts >= this.config.maxAttempts) {
            const lockoutTime = Math.ceil(
                (this.config.lockoutDuration - 
                (Date.now() - parseInt(sessionStorage.getItem(this.storageKeys.lastAttempt)))) / 60000
            );
            attemptsDisplay.textContent = `تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة بعد ${lockoutTime} دقيقة`;
            attemptsDisplay.classList.add('error');
        } else {
            attemptsDisplay.textContent = `المحاولات المتبقية: ${this.config.maxAttempts - attempts}`;
            attemptsDisplay.classList.remove('error');
        }
    }

    isContentVerified(url) {
        const verifiedContent = JSON.parse(sessionStorage.getItem(this.storageKeys.verifiedContent) || '{}');
        return verifiedContent[url] === true;
    }

    markContentAsVerified(url) {
        const verifiedContent = JSON.parse(sessionStorage.getItem(this.storageKeys.verifiedContent) || '{}');
        verifiedContent[url] = true;
        sessionStorage.setItem(this.storageKeys.verifiedContent, JSON.stringify(verifiedContent));
    }

    handleContentAccess(e, url, type, grade) {
        e.preventDefault();
        
        if (this.isContentVerified(url)) {
            this.accessContent(url, type);
            return;
        }
        
        if (this.isLockedOut()) {
            this.updateAttemptsDisplay();
            this.showModal();
            return;
        }
        
        this.currentContent = { url, type, grade };
        this.showModal();
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isLockedOut()) {
            this.updateAttemptsDisplay();
            return;
        }
        
        const code = this.modal.querySelector('.access-code-input').value;
        const errorMessage = this.modal.querySelector('.error-message');
        const button = this.modal.querySelector('.verify-button');
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.loading-spinner');
        
        this.setLoadingState(button, buttonText, spinner, true);
        
        try {
            if (await this.validateCode(code, this.currentContent.grade)) {
                this.handleSuccessfulVerification();
            } else {
                this.handleFailedVerification(errorMessage);
            }
        } catch (error) {
            errorMessage.textContent = 'حدث خطأ. يرجى المحاولة مرة أخرى';
            errorMessage.classList.add('show');
        } finally {
            this.setLoadingState(button, buttonText, spinner, false);
        }
    }

    async validateCode(code, grade) {
        // In a real implementation, this would make an API call to validate the code
        const accessCodes = {
            firstGrade: ['8888', '7777', '6666'],
            secondGrade: ['0000', '1111', '2222'],
            thirdGrade: ['5555', '4444', '3333']
        };
        
        return accessCodes[grade]?.includes(code) || false;
    }

    handleSuccessfulVerification() {
        sessionStorage.removeItem(this.storageKeys.attempts);
        sessionStorage.removeItem(this.storageKeys.lastAttempt);
        this.markContentAsVerified(this.currentContent.url);
        this.closeModal();
        this.accessContent(this.currentContent.url, this.currentContent.type);
    }

    handleFailedVerification(errorMessage) {
        const attempts = parseInt(sessionStorage.getItem(this.storageKeys.attempts) || '0') + 1;
        sessionStorage.setItem(this.storageKeys.attempts, attempts.toString());
        sessionStorage.setItem(this.storageKeys.lastAttempt, Date.now().toString());
        
        errorMessage.textContent = 'كود غير صحيح';
        errorMessage.classList.add('show');
        this.modal.querySelector('.access-code-input').value = '';
        this.modal.querySelector('.access-code-input').focus();
        this.updateAttemptsDisplay();
    }

    accessContent(url, type) {
        if (type === 'video') {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    }

    showModal() {
        this.modal.classList.add('active');
        this.modal.querySelector('.access-code-input').focus();
        this.updateAttemptsDisplay();
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.modal.querySelector('.access-code-input').value = '';
        this.modal.querySelector('.error-message').classList.remove('show');
    }

    setLoadingState(button, buttonText, spinner, isLoading) {
        button.disabled = isLoading;
        buttonText.style.display = isLoading ? 'none' : 'block';
        spinner.style.display = isLoading ? 'block' : 'none';
    }
}

// Initialize the access code manager
const accessCodeManager = new AccessCodeManager(); 