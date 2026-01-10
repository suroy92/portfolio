// Scroll Reveal
const sections = document.querySelectorAll("section");
const revealOnScroll = () => {
    const triggerBottom = window.innerHeight * 0.85;
    sections.forEach(sec => { const boxTop = sec.getBoundingClientRect().top; if (boxTop < triggerBottom) sec.classList.add("show"); });
};
window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

// Theme Toggle - Three-state (dark → light → auto)
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// SVG paths for icons
const icons = {
    sun: 'M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z',
    moon: 'M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z',
    auto: 'M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20V4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z'
};

const tooltips = {
    dark: 'Switch to light mode',
    light: 'Switch to auto mode',
    auto: 'Switch to dark mode'
};

const getSystemTheme = () => prefersDark.matches ? 'dark' : 'light';

const setTheme = (mode, skipAnimation = false) => {
    // Add switching animation unless reduced motion
    if (!skipAnimation && !prefersReducedMotion.matches) {
        themeToggle.classList.add('switching');
        setTimeout(() => themeToggle.classList.remove('switching'), 400);
    }

    localStorage.setItem('themeMode', mode);

    let actualTheme;
    if (mode === 'auto') {
        actualTheme = getSystemTheme();
        document.body.className = actualTheme + ' auto';
    } else {
        actualTheme = mode;
        document.body.className = mode;
    }

    // Update icon
    const iconKey = mode === 'auto' ? 'auto' : (mode === 'light' ? 'sun' : 'moon');
    themeIcon.innerHTML = `<path d="${icons[iconKey]}"/>`;

    // Update ARIA
    themeToggle.setAttribute('aria-checked', actualTheme === 'light' ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', `Theme: ${mode}${mode === 'auto' ? ' (currently ' + actualTheme + ')' : ''}`);
    themeToggle.setAttribute('data-tooltip', tooltips[mode]);

    // Update meta color-scheme
    document.documentElement.style.colorScheme = actualTheme;
};

const cycleTheme = () => {
    const currentMode = localStorage.getItem('themeMode') || 'dark';
    const nextMode = currentMode === 'dark' ? 'light' : (currentMode === 'light' ? 'auto' : 'dark');
    setTheme(nextMode);
};

// Initialize theme
const savedMode = localStorage.getItem('themeMode');
const initialMode = savedMode || (prefersDark.matches ? 'dark' : 'light');
setTheme(initialMode, true);

// Click handler
themeToggle.addEventListener('click', cycleTheme);

// Keyboard shortcut: Ctrl+Shift+T
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        cycleTheme();
    }
});

// Listen to system theme changes when in auto mode
prefersDark.addEventListener('change', () => {
    const currentMode = localStorage.getItem('themeMode');
    if (currentMode === 'auto') {
        setTheme('auto', true);
    }
});

// Projects: filters + search
(function () {
    const list = document.getElementById('projectsList');
    const cards = Array.from(list.querySelectorAll('.project-card'));
    const chips = Array.from(document.querySelectorAll('[data-chip]'));
    const search = document.getElementById('projectSearch');

    let activeTag = 'all';

    function matches(card) {
        const text = (card.textContent || '').toLowerCase();
        const q = search ? (search.value || '').toLowerCase() : '';
        const tags = (card.getAttribute('data-tags') || '').split(',').map(t => t.trim());
        const tagOk = activeTag === 'all' || tags.includes(activeTag);
        const qOk = !q || text.includes(q);
        return tagOk && qOk;
    }

    function render() {
        cards.forEach(card => {
            if (matches(card)) {
                card.classList.remove('hidden-card');
            } else {
                card.classList.add('hidden-card');
            }
        });
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false'); });
            chip.classList.add('is-active'); chip.setAttribute('aria-selected', 'true');
            activeTag = chip.dataset.chip; render();
        });
    });

    if (search) {
        search.addEventListener('input', render);
    }
    render();
})();

// Scroll progress bar
const bar = document.getElementById('scrollbar');
const prog = () => { const s = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight; bar.style.width = `${(s / h) * 100}%`; };
addEventListener('scroll', prog); addEventListener('load', prog);

// Animated counters
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + '+';
        }
    }, 16);
};

const stats = document.querySelectorAll('.stat .num');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = 'true';
            const targetValue = parseInt(entry.target.textContent);
            const suffix = entry.target.dataset.suffix || '+';
            const animateCounterWithSuffix = (element, target, duration = 2000) => {
                const start = 0;
                const increment = target / (duration / 16);
                let current = start;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        element.firstChild && element.firstChild.nodeType === 3
                            ? element.firstChild.nodeValue = String(target)
                            : element.textContent = String(target);
                        if (suffix) {
                            if (!element.querySelector('.suffix')) {
                                const s = document.createElement('span'); s.className = 'suffix'; s.textContent = suffix; element.appendChild(s);
                            } else { element.querySelector('.suffix').textContent = suffix; }
                        }
                        clearInterval(timer);
                    } else {
                        const value = Math.floor(current);
                        element.firstChild && element.firstChild.nodeType === 3
                            ? element.firstChild.nodeValue = String(value)
                            : element.textContent = String(value);
                    }
                }, 16);
            };
            animateCounterWithSuffix(entry.target, targetValue);
        }
    });
}, { threshold: 0.5 });

stats.forEach(stat => statsObserver.observe(stat));

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('mobile-open');
        const isOpen = navMenu.classList.contains('mobile-open');
        mobileMenuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('mobile-open');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            navMenu.classList.remove('mobile-open');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Cursor trail effect
let isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (isHoverDevice) {
    document.addEventListener('mousemove', (e) => {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.left = `${e.clientX - 3}px`;
        trail.style.top = `${e.clientY - 3}px`;
        document.body.appendChild(trail);

        setTimeout(() => {
            trail.remove();
        }, 500);
    });
}