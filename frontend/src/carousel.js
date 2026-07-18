// carousel.js
// Auto-discovers every [data-carousel] block and turns it into a
// continuously-drifting "train" of slides (all visible at once, slowly
// scrolling like a marquee). Drag/swipe grabs that same motion directly
// via Pointer Events — there's no native scroll container involved, so
// there's nothing for the browser to fight with.
//
// Slides can be <img> or <video>. Videos are muted + looped + played
// continuously in place as they drift by, like an animated thumbnail.

const SPEED_PX_PER_SEC = 32;   // how fast the train drifts on its own
const RESUME_DELAY = 1500;     // ms after letting go before auto-drift resumes

export function initMiniCarousels() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const carousels = document.querySelectorAll('.mini-carousel[data-carousel]');

  carousels.forEach((carousel) => {
    const track = carousel.querySelector('.carousel-track');
    const strip = carousel.querySelector('.carousel-strip');
    if (!track || !strip) return;

    const originalSlides = Array.from(strip.children);
    if (originalSlides.length === 0) return;

    // A single slide can't meaningfully "drift" — just show it.
    if (originalSlides.length === 1) {
      carousel.classList.add('single-slide');
      const video = originalSlides[0].querySelector('video');
      if (video) {
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.play().catch(() => {});
      }
      return;
    }

    // Prep + start any videos so they're already playing as they drift by
    function prepVideo(video) {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.play().catch(() => {});
    }
    originalSlides.forEach((slide) => {
      const video = slide.querySelector('video');
      if (video) prepVideo(video);
    });

    // Duplicate the slide set once so the loop can wrap seamlessly:
    // once we've drifted the width of one full set, snap back to 0 —
    // visually identical since the clone is sitting right there.
    originalSlides.forEach((slide) => {
      const clone = slide.cloneNode(true);
      const video = clone.querySelector('video');
      if (video) prepVideo(video);
      strip.appendChild(clone);
    });

    let setWidth = 0;
    function measure() {
      const gap = parseFloat(getComputedStyle(strip).columnGap || getComputedStyle(strip).gap) || 0;
      setWidth = originalSlides.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0)
        + gap * originalSlides.length;
    }
    measure();
    window.addEventListener('resize', measure);

    let offset = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let paused = false;
    let resumeTimeoutId = null;
    let lastTs = null;

    function applyTransform() {
      strip.style.transform = `translate3d(${-offset}px,0,0)`;
    }

    function wrap(value) {
      if (setWidth <= 0) return value;
      return ((value % setWidth) + setWidth) % setWidth;
    }

    function tick(ts) {
      if (lastTs == null) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      if (!dragging && !paused && !reduceMotion && document.visibilityState === 'visible') {
        offset = wrap(offset + SPEED_PX_PER_SEC * dt);
        applyTransform();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function pauseDrift() {
      paused = true;
      clearTimeout(resumeTimeoutId);
    }
    function resumeDriftSoon() {
      clearTimeout(resumeTimeoutId);
      resumeTimeoutId = setTimeout(() => { paused = false; }, RESUME_DELAY);
    }

    carousel.addEventListener('mouseenter', pauseDrift);
    carousel.addEventListener('mouseleave', resumeDriftSoon);

    // ---------- Drag / swipe ----------
    track.addEventListener('pointerdown', (e) => {
      dragging = true;
      pauseDrift();
      dragStartX = e.clientX;
      dragStartOffset = offset;
      track.classList.add('dragging');
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      offset = wrap(dragStartOffset - dx);
      applyTransform();
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('dragging');
      resumeDriftSoon();
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
  });
}