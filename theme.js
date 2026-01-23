// Import stylesheets for Vite bundling
import './styles.css';
import './field-notes.css';

/**
 * Theme Manager — v1.3.0
 * Light-default theme system with OS listener support
 */

class ThemeManager {
    constructor() {
        this.html = document.documentElement;
        this.toggle = document.getElementById('themeToggle');
        this.currentMode = this.getSavedMode();
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        this.init();
    }

    init() {
        // Apply theme immediately (before DOM ready to prevent FOUC)
        this.applyTheme();

        // Set up OS listener for system mode
        this.mediaQuery.addEventListener('change', () => {
            if (this.currentMode === 'system') {
                this.applyTheme();
            }
        });

        // Toggle on button click (cycles: light → dark → system → light)
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.cycleMode());
        }
    }

    getSavedMode() {
        // Check localStorage for saved preference
        const saved = localStorage.getItem('sb-theme');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
            return saved;
        }

        // Default to light mode (not system)
        return 'light';
    }

    getSystemTheme() {
        return this.mediaQuery.matches ? 'dark' : 'light';
    }

    cycleMode() {
        // Cycle through: light → dark → system → light
        const modes = ['light', 'dark', 'system'];
        const currentIndex = modes.indexOf(this.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.currentMode = modes[nextIndex];

        // Save and apply
        localStorage.setItem('sb-theme', this.currentMode);
        this.applyTheme();
    }

    applyTheme() {
        // Determine effective theme
        let effectiveTheme;
        if (this.currentMode === 'system') {
            effectiveTheme = this.getSystemTheme();
        } else {
            effectiveTheme = this.currentMode;
        }

        // Apply data-theme attribute
        this.html.setAttribute('data-theme', effectiveTheme);
        this.html.setAttribute('data-theme-mode', this.currentMode);
    }
}

/**
 * Menu Manager — v2.0.0
 * Premium morphing menu with focus trap and backdrop
 * Hamburger-on-overflow: collapses nav only when content would spill
 */
class MenuManager {
    constructor() {
        this.hamburger = document.getElementById('hamburger');
        this.navMenu = document.getElementById('navMenu');
        this.backdrop = document.getElementById('menuBackdrop');
        this.navContainer = this.navMenu?.parentElement;
        this.lastFocus = null;
        this.focusTrapHandler = null;

        if (this.hamburger && this.navMenu && this.navContainer) {
            this.init();
        }
    }

    init() {
        // Set up hamburger toggle
        this.hamburger.addEventListener('click', () => this.toggleMenu());

        // Set up close button
        const closeBtn = this.navMenu.querySelector('.mobile-menu-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeMenu();
            });
        }

        // Set up backdrop click to close
        if (this.backdrop) {
            this.backdrop.addEventListener('click', () => this.closeMenu());
        }

        // Close menu when clicking menu items (except dropdown toggle)
        this.navMenu.querySelectorAll('a').forEach(item => {
            item.addEventListener('click', () => this.closeMenu());
        });

        // Close menu on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.navMenu.classList.contains('active')) {
                this.closeMenu();
            }
        });

        // Set up overflow detection with ResizeObserver
        this.setupOverflowDetection();
    }

    setupOverflowDetection() {
        const checkOverflow = () => {
            // Check if nav content would overflow its container
            const navWidth = this.navMenu.scrollWidth;
            const containerWidth = this.navContainer.clientWidth;
            const isOverflowing = navWidth > containerWidth;

            // Toggle collapsed state
            if (isOverflowing) {
                this.navContainer.classList.add('nav--collapsed');
            } else {
                this.navContainer.classList.remove('nav--collapsed');
                this.closeMenu(); // Close menu if we're no longer collapsed
            }
        };

        // Observe container size changes
        const resizeObserver = new ResizeObserver(checkOverflow);
        resizeObserver.observe(this.navContainer);

        // Initial check
        checkOverflow();
    }

    getFocusableElements() {
        return this.navMenu.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
    }

    enableFocusTrap() {
        this.focusTrapHandler = (e) => {
            if (e.key !== 'Tab') return;

            const focusables = this.getFocusableElements();
            if (focusables.length === 0) return;

            const firstFocusable = focusables[0];
            const lastFocusable = focusables[focusables.length - 1];

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };

        document.addEventListener('keydown', this.focusTrapHandler);
    }

    disableFocusTrap() {
        if (this.focusTrapHandler) {
            document.removeEventListener('keydown', this.focusTrapHandler);
            this.focusTrapHandler = null;
        }
    }

    toggleMenu() {
        const isActive = this.navMenu.classList.contains('active');

        if (isActive) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        // Store current focus for restoration
        this.lastFocus = document.activeElement;

        // Add menu-open class to nav-container to disable backdrop-filter
        // (fixes position:fixed containing block issue)
        this.navContainer.classList.add('nav--menu-open');

        // Activate menu and backdrop
        this.navMenu.classList.add('active');
        this.hamburger.classList.add('active');
        this.backdrop?.classList.add('active');

        // Update ARIA attributes
        this.navMenu.setAttribute('aria-hidden', 'false');
        this.hamburger.setAttribute('aria-expanded', 'true');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus the menu for screen readers
        this.navMenu.focus();

        // Enable focus trap
        this.enableFocusTrap();
    }

    closeMenu() {
        // Remove menu-open class from nav-container
        this.navContainer.classList.remove('nav--menu-open');

        // Deactivate menu and backdrop
        this.navMenu.classList.remove('active');
        this.hamburger.classList.remove('active');
        this.backdrop?.classList.remove('active');

        // Update ARIA attributes
        this.navMenu.setAttribute('aria-hidden', 'true');
        this.hamburger.setAttribute('aria-expanded', 'false');

        // Restore body scroll
        document.body.style.overflow = '';

        // Disable focus trap
        this.disableFocusTrap();

        // Restore focus to trigger element
        if (this.lastFocus && typeof this.lastFocus.focus === 'function') {
            this.lastFocus.focus();
        } else {
            this.hamburger.focus();
        }
    }
}

/**
 * Active Nav State
 * Highlights the current section in navigation based on scroll position
 */
class ActiveNavManager {
    constructor() {
        this.sections = document.querySelectorAll('.section[id], .hero');
        this.navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

        if (this.sections.length > 0 && this.navLinks.length > 0) {
            this.init();
        }
    }

    init() {
        // Set up Intersection Observer
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id || 'hero';
                    this.setActiveLink(id);
                }
            });
        }, options);

        // Observe all sections
        this.sections.forEach(section => {
            this.observer.observe(section);
        });
    }

    setActiveLink(sectionId) {
        // Remove active class from all links
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to matching link
        const activeLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new MenuManager();
    new ActiveNavManager();
});
