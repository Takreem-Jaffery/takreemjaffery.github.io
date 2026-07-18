import { createHeroScene } from './scene.js';
import { initMiniCarousels } from './carousel.js';

// Point this at your deployed backend once you have one running.
// Locally this defaults to the Express server in /backend (see its README).
const CONTACT_API_URL = 'http://localhost:4000/api/contact';

// ---------- Theme handling ----------
const root = document.documentElement;
const toggleBtn = document.getElementById('themeToggle');
const icon = document.getElementById('themeIcon');

const SUN_PATH =
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
const MOON_PATH = '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>';

let scene = null;

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  icon.innerHTML = theme === 'dark' ? SUN_PATH : MOON_PATH;
  try {
    localStorage.setItem('tj-theme', theme);
  } catch (e) {
    /* localStorage unavailable — ignore */
  }
  if (scene) scene.updateColors();
}

function initTheme() {
  let saved;
  try {
    saved = localStorage.getItem('tj-theme');
  } catch (e) {
    saved = null;
  }
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(saved || (prefersLight ? 'light' : 'dark'));

  toggleBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

// ---------- Reveal on scroll ----------
function initReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
}

// ---------- Hero scene ----------
function initScene() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  try {
    scene = createHeroScene(canvas);
  } catch (err) {
    console.error('Hero scene failed to start:', err);
    canvas.closest('.hero-visual')?.style.setProperty('display', 'none');
  }
}

// ---------- Contact form ----------
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const statusEl = document.getElementById('cf-status');
  const submitBtn = document.getElementById('cf-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
    };

    submitBtn.disabled = true;
    statusEl.textContent = 'Sending…';
    statusEl.className = 'form-status';

    try {
      const res = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Request failed');
      statusEl.textContent = "Thanks — I'll get back to you soon.";
      statusEl.className = 'form-status ok';
      form.reset();
    } catch (err) {
      statusEl.textContent = "Couldn't send — please email me directly instead.";
      statusEl.className = 'form-status err';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

initTheme();
initReveal();
initScene();
initContactForm();
initMiniCarousels();
