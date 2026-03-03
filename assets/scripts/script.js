// Glitch Background Generator
// Draws directly onto a fixed-position DOM canvas — grain everywhere, glitch effects only in the
// side margins (outside the .container max-width), so the content column stays clean.
function generateGlitchBg() {
    const canvas = document.getElementById('glitch-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const vw  = canvas.width  = window.innerWidth;
    const vh  = canvas.height = window.innerHeight;

    const isLight = document.body.classList.contains('light');
    const ri = (min, max) => Math.floor(Math.random() * (max - min) + min);

    // Margin bands — mirrors CSS: .container { width: 92%; max-width: 1280px }
    const containerW = Math.min(1280, vw * 0.92);
    const margin     = Math.max(0, (vw - containerW) / 2);

    ctx.clearRect(0, 0, vw, vh);

    // 1. Film grain — full canvas, sparse random pixels at very low alpha
    const img = ctx.getImageData(0, 0, vw, vh);
    const d   = img.data;
    const sp  = (x, y, r, g, b, a) => {
        if (x < 0 || x >= vw || y < 0 || y >= vh) return;
        const i = (y * vw + x) * 4;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
    };
    // Film grain — bright in dark mode, dark in light mode so it reads against the background
    for (let i = 0; i < d.length; i += 4) {
        if (Math.random() > 0.05) continue;
        const v = isLight ? ri(0, 80) : ri(180, 255);
        d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = ri(4, 14);
    }

    // Helper — pick a random x start within left or right margin band
    const marginX = (w) => {
        if (margin < w) return -1; // margin too narrow — skip this element
        return Math.random() < 0.5
            ? ri(0, margin - w)                    // left band
            : ri(vw - margin, vw - w);             // right band
    };

    // 2. RGB chromatic-aberration clusters (margins only)
    // Fix: draw main pixels first in one pass, then fringe edges in a second pass.
    // Inline ghost drawing caused each pixel's red ghost (at x-2) to be overwritten
    // two iterations later by a newer pixel's red ghost — making everything appear red.
    const numClusters = ri(4, 8);
    for (let c = 0; c < numClusters; c++) {
        const cw = ri(40, Math.min(200, Math.max(40, margin - 10)));
        const cx = marginX(cw);
        if (cx < 0) continue;
        const cy = ri(0, vh - 10);
        const ch = ri(2, 6);

        // Pass 1 — noisy static body (per-pixel random color)
        let lastR = 0, lastB = 0; // track channels for fringe
        for (let y = cy; y < cy + ch; y++) {
            for (let x = cx; x < cx + cw; x++) {
                const t = Math.random();
                let r, g, b, a;
                if      (t < 0.30) { r = 0;   g = isLight ? 140 : 190; b = isLight ? 200 : 245; a = ri(110, 210); }
                else if (t < 0.55) { r = isLight ? 200 : 240; g = 0;   b = isLight ? 120 : 170; a = ri(110, 210); }
                else if (t < 0.75) { r = 0;   g = 0;   b = isLight ? 190 : 250; a = ri(90,  185); }
                else               { const wv = ri(isLight ? 80 : 160, isLight ? 180 : 245); r = wv; g = wv; b = wv; a = ri(55, 130); }
                sp(x, y, r, g, b, a);
                lastR = isLight ? 200 : 240; // red channel for fringe
                lastB = isLight ? 200 : 250; // blue channel for fringe
            }
        }

        // Pass 2 — red fringe 2px to the left, blue fringe 2px to the right
        const fa = ri(60, 130);
        for (let y = cy; y < cy + ch; y++) {
            sp(cx - 2, y, lastR, 0, 0, fa);
            sp(cx - 1, y, lastR, 0, 0, Math.floor(fa * 0.6));
            sp(cx + cw,     y, 0, 0, lastB, fa);
            sp(cx + cw + 1, y, 0, 0, lastB, Math.floor(fa * 0.6));
        }
    }

    // 3. Dashed tracking lines (margins only)
    const numLines = ri(3, 6);
    for (let i = 0; i < numLines; i++) {
        const lw = ri(30, Math.min(220, Math.max(30, margin - 5)));
        const lx = marginX(lw);
        if (lx < 0) continue;
        const ly = ri(0, vh - 1);
        const lv = isLight ? ri(50, 110) : ri(100, 180);
        const la = ri(12, 40);
        let x = lx;
        while (x < lx + lw) {
            const dw = ri(5, 18), gw = ri(4, 14);
            for (let px = x; px < Math.min(x + dw, lx + lw); px++) sp(px, ly, lv, lv, lv, la);
            x += dw + gw;
        }
    }

    // 4. Block artifacts (margins only)
    const numBlocks = ri(4, 8);
    for (let i = 0; i < numBlocks; i++) {
        const bw = ri(10, Math.min(55, Math.max(10, margin - 5)));
        const bx = marginX(bw);
        if (bx < 0) continue;
        const by  = ri(0, vh - 20);
        const bh  = ri(3, 14);
        const bri = isLight ? ri(165, 210) : ri(20, 44);
        const ba  = ri(10, 28);
        for (let y = by; y < Math.min(by + bh, vh); y++)
            for (let x = bx; x < Math.min(bx + bw, vw); x++)
                sp(x, y, bri, bri, bri, ba);
    }

    ctx.putImageData(img, 0, 0);

    // 5. Scanlines — full width, very faint
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.008)' : 'rgba(0,0,0,0.025)';
    for (let y = 0; y < vh; y += 4) ctx.fillRect(0, y + 2, vw, 1);

    // Clear any leftover inline body background styles from the old tiling approach
    document.body.style.backgroundImage      = '';
    document.body.style.backgroundSize       = '';
    document.body.style.backgroundRepeat     = '';
    document.body.style.backgroundAttachment = '';
}

// Regenerate glitch canvas on resize (debounced)
let _glitchResizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(_glitchResizeTimer);
    _glitchResizeTimer = setTimeout(generateGlitchBg, 200);
}, { passive: true });

// Navbar scroll opacity
const navEl = document.querySelector("nav");
const updateNavOpacity = () => navEl.classList.toggle("nav-scrolled", window.scrollY > 20);
window.addEventListener("scroll", updateNavOpacity, { passive: true });
updateNavOpacity();

// Active nav link based on scroll position
const navLinks = document.querySelectorAll(".nav-link");
const scrollSections = [...document.querySelectorAll("section[id]")];
const updateActiveLink = () => {
    // Find the last section whose top has passed 40% down the viewport
    const scrollMid = window.scrollY + window.innerHeight * 0.4;
    let active = scrollSections[0];
    for (const sec of scrollSections) {
        if (sec.offsetTop <= scrollMid) active = sec;
    }
    navLinks.forEach(l => l.classList.toggle("active", l.getAttribute("href") === `#${active.id}`));
};
window.addEventListener("scroll", updateActiveLink, { passive: true });
updateActiveLink();

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

    generateGlitchBg();
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
generateGlitchBg();

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

// ─── Project Data ────────────────────────────────────────────────────────────
// To add a new project, append an object to this array and it will
// automatically appear in the carousel.
const projectsData = [
    {
        title: "SubWatch",
        category: "Web",
        tags: ["web", "typescript", "nextjs"],
        description: "Manual-entry subscription tracker and cost audit tool. Dashboard shows total monthly spend, category breakdown, and upcoming renewals. Includes an audit wizard to review and cancel unused subs, a renewal calendar, email reminders, and CSV/JSON export — backed by Google OAuth and PostgreSQL.",
        image: "assets/images/subwatch_square_1.svg",
        tech: [
            { type: "devicon", cls: "devicon-nextjs-plain", label: "Next.js" },
            { type: "devicon", cls: "devicon-typescript-plain colored", label: "TypeScript" },
            { type: "devicon", cls: "devicon-tailwindcss-original colored", label: "Tailwind CSS" },
            { type: "devicon", cls: "devicon-postgresql-plain colored", label: "PostgreSQL" }
        ],
        links: [
            { label: "Live Site", url: "https://subwatch-app.vercel.app", icon: "ph:globe-duotone" }
        ]
    },
    {
        title: "RankIt",
        category: "Web",
        tags: ["web", "typescript", "nextjs"],
        description: "Compare any list of items head-to-head and get a definitive ELO-scored tier ranking (S–D). Supports Quick and Thorough modes, CSV import, shareable result URLs, and re-ranking — all client-side with no backend or account needed.",
        image: "assets/images/rankit_square_1.svg",
        tech: [
            { type: "devicon", cls: "devicon-nextjs-plain", label: "Next.js" },
            { type: "devicon", cls: "devicon-typescript-plain colored", label: "TypeScript" },
            { type: "devicon", cls: "devicon-tailwindcss-original colored", label: "Tailwind CSS" }
        ],
        links: [
            { label: "Live Site", url: "https://jade-cobbler-098504.netlify.app/", icon: "ph:globe-duotone" }
        ]
    },
    {
        title: "Automated Documentation Generator",
        category: "AI",
        tags: ["ai", "cli", "python", "web"],
        description: "Point it at any codebase and get a comprehensive README with architecture diagrams, API docs, real code examples, and setup guides — powered by a local Ollama LLM. No API keys, fully offline, supports Python, JS, TS, and Java.",
        image: "assets/images/cli_documentation_tool_1.svg",
        tech: [
            { type: "iconify", icon: "mdi:robot-outline", label: "AI" },
            { type: "devicon", cls: "devicon-python-plain colored", label: "Python" },
            { type: "devicon", cls: "devicon-javascript-plain colored", label: "JavaScript" }
        ],
        links: [
            { label: "View in GitHub", url: "https://github.com/suroy92/automated-documentation-generator", icon: "mdi:github" }
        ]
    },
    {
        title: "Personal Finance Analyzer",
        category: "AI",
        tags: ["ai", "python", "desktop"],
        description: "Import bank statement CSVs and get a full Dash dashboard — ML-powered transaction categorisation, monthly trend charts, budget tracking, savings suggestions, and festive season alerts. All data stays local in SQLite.",
        image: "assets/images/financial_app_dashboard_square_1.svg",
        tech: [
            { type: "iconify", icon: "mdi:robot-outline", label: "AI" },
            { type: "iconify", icon: "mdi:chart-line", label: "Analytics" },
            { type: "devicon", cls: "devicon-sqlite-plain colored", label: "SQLite" }
        ],
        links: [
            { label: "View in GitHub", url: "https://github.com/suroy92/personal-finance-analyzer", icon: "mdi:github" }
        ]
    },
    {
        title: "Password Manager",
        category: "Security",
        tags: ["desktop", "security", "python"],
        description: "PySide6 desktop vault with master-password encryption using Argon2id KDF and Fernet AES-128. Features light/dark themes, a password generator, secure clipboard auto-clear, encrypted export/import, and master password rotation.",
        image: "assets/images/password_manager_square_1.svg",
        tech: [
            { type: "iconify", icon: "mdi:lock-outline", label: "Security" },
            { type: "devicon", cls: "devicon-python-plain colored", label: "Python" },
            { type: "devicon", cls: "devicon-sqlite-plain colored", label: "SQLite" }
        ],
        links: [
            { label: "View in GitHub", url: "https://github.com/suroy92/password-manager", icon: "mdi:github" }
        ]
    }
];

// ─── Projects Carousel ───────────────────────────────────────────────────────
(function () {
    const track   = document.getElementById('carouselTrack');
    const dots    = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const search  = document.getElementById('projectSearch');

    let activeTag = 'all';
    let query     = '';
    let page      = 0;

    const visibleCount = () => window.innerWidth >= 900 ? 3 : window.innerWidth >= 600 ? 2 : 1;

    const filtered = () => projectsData.filter(p => {
        const tagOk = activeTag === 'all' || p.tags.includes(activeTag);
        const qOk   = !query || p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
        return tagOk && qOk;
    });

    const buildCard = p => {
        const techHtml  = p.tech.map(t =>
            t.type === 'devicon'
                ? `<i class="${t.cls}" title="${t.label}"></i>`
                : `<iconify-icon icon="${t.icon}" title="${t.label}"></iconify-icon>`
        ).join('');
        const linksHtml = p.links.map(l =>
            `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="btn">
                <iconify-icon icon="${l.icon}"></iconify-icon> ${l.label}
            </a>`
        ).join('');
        return `
            <article class="project-card">
                <img src="${p.image}" alt="${p.title}" class="project-card-image" loading="lazy" />
                <div class="project-card-text">
                    <span class="project-card-category">${p.category}</span>
                    <h3>${p.title}</h3>
                    <p>${p.description}</p>
                </div>
                <p class="project-card-tech">${techHtml}</p>
                <div class="project-links">${linksHtml}</div>
            </article>`;
    };

    const render = () => {
        const items = filtered();
        const cols  = visibleCount();
        const total = Math.max(1, Math.ceil(items.length / cols));
        page = Math.max(0, Math.min(page, total - 1));

        track.style.setProperty('--cols', cols);

        const slice = items.slice(page * cols, page * cols + cols);
        track.innerHTML = slice.length
            ? slice.map(buildCard).join('')
            : '<p class="carousel-empty">No projects match your search.</p>';

        // Dots
        dots.innerHTML = Array.from({ length: total }, (_, i) =>
            `<button class="carousel-dot${i === page ? ' is-active' : ''}" aria-label="Page ${i + 1}"></button>`
        ).join('');
        dots.querySelectorAll('.carousel-dot').forEach((d, i) =>
            d.addEventListener('click', () => { page = i; render(); })
        );

        prevBtn.disabled = page === 0;
        nextBtn.disabled = page >= total - 1;
    };

    prevBtn.addEventListener('click', () => { page--; render(); });
    nextBtn.addEventListener('click', () => { page++; render(); });

    // Filter chips
    document.querySelectorAll('[data-chip]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-chip]').forEach(c => {
                c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false');
            });
            chip.classList.add('is-active'); chip.setAttribute('aria-selected', 'true');
            activeTag = chip.dataset.chip; page = 0; render();
        });
    });

    if (search) search.addEventListener('input', () => { query = search.value.toLowerCase(); page = 0; render(); });

    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { page = 0; render(); }, 200); });

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

// Custom two-part cursor (dot + lagging ring)
(function () {
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (prefersReducedMotion.matches) return;

    let mx = 0, my = 0; // mouse
    let rx = 0, ry = 0; // ring (lerped)
    const EASE = 0.12;

    document.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
    });

    (function animateRing() {
        rx += (mx - rx) * EASE;
        ry += (my - ry) * EASE;
        ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`;
        requestAnimationFrame(animateRing);
    })();

    // Expand ring on interactive elements
    const interactiveSelector = 'a, button, .project-card, .chip, .skill-pill, .icon-btn, input, textarea';
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactiveSelector)) ring.classList.add('is-expanded');
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactiveSelector)) ring.classList.remove('is-expanded');
    });
})();

// Typewriter role cycling
(function () {
    const el = document.getElementById('typewriter-text');
    if (!el) return;
    if (prefersReducedMotion.matches) { el.textContent = 'Tech Lead'; return; }

    const roles = ['Tech Lead', 'Full-Stack Developer', 'Cloud Architect', 'Open Source Builder'];
    let roleIdx = 0, charIdx = roles[0].length, deleting = false;
    const TYPE_SPEED = 80, DELETE_SPEED = 45, PAUSE_END = 1800, PAUSE_START = 320;

    function tick() {
        const current = roles[roleIdx];
        if (!deleting) {
            el.textContent = current.slice(0, charIdx);
            if (charIdx === current.length) {
                deleting = true;
                setTimeout(tick, PAUSE_END);
                return;
            }
            charIdx++;
        } else {
            el.textContent = current.slice(0, charIdx);
            if (charIdx === 0) {
                deleting = false;
                roleIdx = (roleIdx + 1) % roles.length;
                setTimeout(tick, PAUSE_START);
                return;
            }
            charIdx--;
        }
        setTimeout(tick, deleting ? DELETE_SPEED : TYPE_SPEED);
    }

    // Start deleting from the initial text so the animation begins immediately
    setTimeout(tick, PAUSE_END);
})();

// Contact Form Handler
// ============================================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://www.emailjs.com/ and create a free account
// 2. Add an email service (Gmail, Outlook, etc.)
// 3. Create an email template with variables: {{from_name}}, {{from_email}}, {{message}}
// 4. Get your credentials and replace below (publicKey, serviceId, templateId)
// 5. IMPORTANT: In EmailJS Dashboard, enable security:
//    - Restrict to your domain only
//    - Enable reCAPTCHA (optional)
//    - Set rate limits
// ============================================================================

(function() {
    const contactForm = document.querySelector('.contact-form');
    
    if (!contactForm) return;

    // EmailJS configuration - replace with your credentials
    const EMAILJS_CONFIG = {
        publicKey: 'r2AePUGGm7nheYfl3',      // From Account → API Keys
        serviceId: 'service_b84zon8',       // From Email Services
        templateId: 'template_dibbdzv'      // From Email Templates
    };

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        // Get form data
        const formData = {
            from_name: contactForm.querySelector('input[name="name"]').value,
            from_email: contactForm.querySelector('input[name="email"]').value,
            message: contactForm.querySelector('textarea[name="message"]').value
        };

        // Validate
        if (!formData.from_name || !formData.from_email || !formData.message) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<iconify-icon icon="mdi:loading" class="spin"></iconify-icon> Sending...';

        try {
            // Check if EmailJS is configured
            if (EMAILJS_CONFIG.publicKey === 'YOUR_PUBLIC_KEY') {
                throw new Error('EmailJS not configured. Please follow setup instructions in script.js');
            }

            // Initialize EmailJS if not already done
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS library not loaded. Add the script tag to your HTML.');
            }

            // Send email using EmailJS
            const response = await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                formData,
                EMAILJS_CONFIG.publicKey
            );

            if (response.status === 200) {
                showMessage('Message sent successfully! I\'ll get back to you soon.', 'success');
                contactForm.reset();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showMessage(error.message || 'Failed to send message. Please try again or email me directly.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // Show feedback message
    function showMessage(text, type = 'info') {
        // Remove existing messages
        const existing = document.querySelector('.form-message');
        if (existing) existing.remove();

        const message = document.createElement('div');
        message.className = `form-message form-message-${type}`;
        message.textContent = text;
        message.style.cssText = `
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            message.style.backgroundColor = 'color-mix(in oklab, green 20%, transparent)';
            message.style.color = 'green';
            message.style.border = '1px solid green';
        } else if (type === 'error') {
            message.style.backgroundColor = 'color-mix(in oklab, red 20%, transparent)';
            message.style.color = 'red';
            message.style.border = '1px solid red';
        }

        contactForm.appendChild(message);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }
})();