/* ============================================================
   AI-ML GitHub Pages — Main JavaScript
   Handles: smooth scroll, copy code, animations, dynamic year
   ============================================================ */

(function () {
    'use strict';

    /* ---- Dynamic year in footer ---- */
    function updateYear() {
        const yearEl = document.getElementById('current-year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    /* ---- Copy code button ---- */
    function initCopyButtons() {
        const buttons = document.querySelectorAll('.copy-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const target = this.getAttribute('data-target');
                const codeEl = document.querySelector(target);
                if (!codeEl) return;
                const text = codeEl.textContent || codeEl.innerText;
                navigator.clipboard.writeText(text).then(() => {
                    const original = this.textContent;
                    this.textContent = '✓ Copied!';
                    this.style.background = 'var(--green)';
                    this.style.color = 'var(--bg)';
                    setTimeout(() => {
                        this.textContent = original;
                        this.style.background = '';
                        this.style.color = '';
                    }, 1500);
                }).catch(() => {
                    this.textContent = '✗ Failed';
                    setTimeout(() => { this.textContent = 'Copy'; }, 1500);
                });
            });
        });
    }

    /* ---- Smooth scroll for anchor links ---- */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    /* ---- Scroll reveal animation ---- */
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');
        if (!revealElements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(el => observer.observe(el));
    }

    /* ---- Navbar background on scroll ---- */
    function initNavScroll() {
        const header = document.querySelector('.site-header');
        if (!header) return;
        const toggleBg = () => {
            header.style.background = window.scrollY > 10
                ? 'rgba(11, 15, 25, 0.95)'
                : 'rgba(11, 15, 25, 0.85)';
        };
        window.addEventListener('scroll', toggleBg);
        toggleBg();
    }

    /* ---- Phase card progress indicators ---- */
    function initPhaseLinks() {
        // Add click handlers for phase cards that link to sections
        document.querySelectorAll('.phase-card a').forEach(link => {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    /* ---- Init ---- */
    document.addEventListener('DOMContentLoaded', function () {
        updateYear();
        initCopyButtons();
        initSmoothScroll();
        initScrollReveal();
        initNavScroll();
        initPhaseLinks();
    });
})();
