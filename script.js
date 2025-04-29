// Add smooth scrolling to all links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add intersection observer for animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate__animated', 'animate__fadeInUp');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements with data-animate attribute
document.querySelectorAll('[data-animate]').forEach(element => {
    observer.observe(element);
});

// Improved loading animation
document.addEventListener('DOMContentLoaded', () => {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);

    // Hide loading animation after page loads
    window.addEventListener('load', () => {
        loading.classList.add('hidden');
        setTimeout(() => {
            loading.remove();
            // Ensure content is visible
            document.body.classList.add('active');
        }, 500);
    });
});

// Add hover effect to buttons
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-5px)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
    });
});

// Add parallax effect to banner
const banner = document.querySelector('.banner');
if (banner) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        banner.style.backgroundPositionY = -(scrolled * 0.5) + 'px';
    });
}

// Add click animation to buttons
document.querySelectorAll('button, .nav-button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        this.appendChild(ripple);
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size/2 + 'px';
        ripple.style.top = e.clientY - rect.top - size/2 + 'px';
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Improved page transition effect
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.getAttribute('href').startsWith('#')) return;
        
        e.preventDefault();
        const href = link.getAttribute('href');
        
        // Add transition class to body
        document.body.classList.add('page-transition');
        
        // Ensure transition completes before navigation
        setTimeout(() => {
            window.location.href = href;
        }, 300);
    });
});

// Handle browser navigation (back/forward)
window.addEventListener('pageshow', (event) => {
    // If the page is loaded from the cache
    if (event.persisted) {
        // Remove any transition classes
        document.body.classList.remove('page-transition');
        // Force a reflow
        document.body.offsetHeight;
        // Add active class to show content
        document.body.classList.add('active');
    }
});

// Handle form submissions (if any)
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Add your form handling logic here
    });
});

// Header Scroll Effect
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Page Transitions
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('main, .banner');
    if (mainContent) {
        mainContent.classList.add('page-transition');
        setTimeout(() => {
            mainContent.classList.add('active');
        }, 100);
    }
}); 