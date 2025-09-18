// js/app.js
// =====================================================
// MAIN APPLICATION ENTRY POINT
// =====================================================
// This is the main entry point for the application.
// It initializes Alpine.js and all application components.

// Load external dependencies
function loadScript(src, type = 'text/javascript', isModule = false, attributes = {}) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.type = type;
        script.async = true;
        if (isModule) script.type = 'module';
        
        // Add any additional attributes
        Object.entries(attributes).forEach(([key, value]) => {
            script.setAttribute(key, value);
        });
        
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
        document.head.appendChild(link);
    });
}

// Global state variables - these will be managed by Alpine.js components
console.log('%c[APP] Initializing application...', 'color: #4CAF50; font-weight: bold;');

// Define the appInfrastructure component
const appInfrastructure = {
    // Component state
    mobileDropdownOpen: false,
    desktopDropdownOpen: false,
    mobileDropdownPosition: {},
    activeTab: 'document',
    isMobileMenuOpen: false,
    preloaderVisible: true,
    leftColumnCollapsed: false,
    rightColumnCollapsed: false,
    middleColumnFocused: false,
    
    // Initialize function called when component is mounted
    init() {
        console.log('%c[APP] Initializing app infrastructure', 'color: #6366f1;');
        
        // Initialize all systems
        this.initDropdownSystem();
        this.initPreloaderSystem();
        this.initColumnManagementSystem();
        this.initTabSystem();
        
        // Hide preloader after a short delay
        setTimeout(() => {
            this.preloaderVisible = false;
            document.dispatchEvent(new CustomEvent('appContentReady'));
        }, 1000);
    },
    
    // Initialize dropdown system
    initDropdownSystem() {
        console.log('%c[APP] Initializing dropdown system', 'color: #6366f1;');
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            const mobileDropdownTrigger = document.getElementById('avatar-dropdown-trigger');
            const mobileDropdown = document.getElementById('avatar-dropdown');
            const desktopDropdownTrigger = document.getElementById('profile-dropdown-trigger');
            const desktopDropdown = document.getElementById('profile-dropdown');
            
            // Mobile dropdown closure
            if (mobileDropdown && mobileDropdownTrigger && 
                !mobileDropdown.contains(e.target) && !mobileDropdownTrigger.contains(e.target)) {
                this.mobileDropdownOpen = false;
                console.log('%c[APP] Mobile dropdown closed (outside click)', 'color: #6366f1;');
            }
            
            // Desktop dropdown closure
            if (desktopDropdown && desktopDropdownTrigger &&
                !desktopDropdown.contains(e.target) && !desktopDropdownTrigger.contains(e.target)) {
                this.desktopDropdownOpen = false;
                console.log('%c[APP] Desktop dropdown closed (outside click)', 'color: #6366f1;');
            }
        });
        
        // Close dropdowns when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.mobileDropdownOpen) {
                    this.mobileDropdownOpen = false;
                    console.log('%c[APP] Mobile dropdown closed (Escape key)', 'color: #6366f1;');
                }
                if (this.desktopDropdownOpen) {
                    this.desktopDropdownOpen = false;
                    console.log('%c[APP] Desktop dropdown closed (Escape key)', 'color: #6366f1;');
                }
            }
        });
    },
    
    // Initialize preloader system
    initPreloaderSystem() {
        console.log('%c[APP] Initializing preloader system', 'color: #6366f1;');
    },
    
    // Initialize column management system
    initColumnManagementSystem() {
        console.log('%c[APP] Initializing column management system', 'color: #6366f1;');
    },
    
    // Initialize tab system
    initTabSystem() {
        console.log('%c[APP] Initializing tab system', 'color: #6366f1;');
    },
    
    // Toggle mobile menu
    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        console.log(`%c[APP] Mobile menu ${this.isMobileMenuOpen ? 'opened' : 'closed'}`, 'color: #6366f1;');
    },
    
    // Toggle middle column focus
    toggleMiddleColumnFocus() {
        const bothCollapsed = this.leftColumnCollapsed && this.rightColumnCollapsed;
        console.log(`%c[APP] Middle column focus mode: ${bothCollapsed ? 'expanding sides' : 'focusing middle'}`, 'color: #6366f1;');
        
        if (bothCollapsed) {
            this.leftColumnCollapsed = false;
            this.rightColumnCollapsed = false;
            this.middleColumnFocused = false;
        } else {
            this.leftColumnCollapsed = true;
            this.rightColumnCollapsed = true;
            this.middleColumnFocused = true;
        }
    },
    
    // Toggle left column
    toggleLeftColumn() {
        this.leftColumnCollapsed = !this.leftColumnCollapsed;
        console.log(`%c[APP] Left column ${this.leftColumnCollapsed ? 'collapsed' : 'expanded'}`, 'color: #6366f1;');
    },
    
    // Toggle right column
    toggleRightColumn() {
        this.rightColumnCollapsed = !this.rightColumnCollapsed;
        console.log(`%c[APP] Right column ${this.rightColumnCollapsed ? 'collapsed' : 'expanded'}`, 'color: #6366f1;');
    }
};

// Register the component with Alpine.js when it's available
function registerAlpineComponent() {
    if (typeof Alpine !== 'undefined') {
        Alpine.data('appInfrastructure', () => appInfrastructure);
        console.log('%c[APP] Alpine.js component registered', 'color: #4CAF50;');
        return true;
    }
    return false;
}

// Tailwind initialization is now handled by tailwind-config.js
// Initialize the application
async function initializeApplication() {
    console.log('%c[APP] Initializing application', 'color: #6366f1;');
    
    try {
        // Register Alpine component
        if (!registerAlpineComponent()) {
            console.warn('Alpine.js not available yet, will retry...');
            // If Alpine isn't loaded yet, wait for it
            const checkAlpine = setInterval(() => {
                if (registerAlpineComponent()) {
                    clearInterval(checkAlpine);
                }
            }, 100);
        }
        
        // Load other dependencies
        console.log('%c[APP] Loading external dependencies...', 'color: #6366f1;');
        
        // Load other dependencies
        await Promise.all([
            // Load Shepherd.js (for tours)
            loadStylesheet('https://cdn.jsdelivr.net/npm/shepherd.js@10.0.1/dist/css/shepherd.css'),
            loadScript('https://cdn.jsdelivr.net/npm/shepherd.js@10.0.1/dist/js/shepherd.min.js'),
            
            // Load ApexCharts
            loadScript('https://cdn.jsdelivr.net/npm/apexcharts', 'application/JavaScript'),
            
            // Load SweetAlert2
            loadScript('https://cdn.jsdelivr.net/npm/sweetalert2@11', 'application/JavaScript')
        ]);
        
        console.log('%c[APP] All dependencies loaded', 'color: #4CAF50;');
    } catch (error) {
        console.error('%c[APP] Error loading dependencies:', 'color: #F44336; font-weight: bold;', error);
    }
}

// Start the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
    initializeApplication();
}

// Error handling
window.addEventListener('error', function(event) {
    console.error('%c[ERROR]', 'color: #F44336; font-weight: bold;', event.error || event.message || 'Unknown error');
    return false; // Prevent default error handling
});

window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason || 'Unknown rejection reason';
    console.error('%c[UNHANDLED PROMISE REJECTION]', 'color: #F44336; font-weight: bold;', reason);
    return false; // Prevent default error handling
});

// Make appInfrastructure available globally
window.appInfrastructure = appInfrastructure;
