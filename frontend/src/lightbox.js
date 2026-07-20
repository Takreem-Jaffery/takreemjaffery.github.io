// Click any carousel image to view it enlarged; click the backdrop, the
// close button, or press Escape to dismiss.
(() => {
  let dragStart = null;
  const THRESHOLD = 6; // px — distinguishes a tap from a carousel drag

  function ensureOverlay(){
    let overlay = document.getElementById('lightboxOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'lightboxOverlay';
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="Close image">&times;</button>
      <img class="lightbox-img" alt="">
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
        closeLightbox();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    return overlay;
  }

  function openLightbox(src, alt){
    const overlay = ensureOverlay();
    const img = overlay.querySelector('.lightbox-img');
    img.src = src;
    img.alt = alt || '';
    overlay.classList.add('is-open');
    document.body.classList.add('lightbox-locked');
  }

  function closeLightbox(){
    const overlay = document.getElementById('lightboxOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('lightbox-locked');
  }

  // Track movement between pointerdown/pointerup so a carousel drag
  // never accidentally opens the lightbox — only a genuine tap does.
  document.addEventListener('pointerdown', (e) => {
    const img = e.target.closest('.mini-carousel .carousel-slide img');
    if (!img) return;
    dragStart = { x: e.clientX, y: e.clientY, img };
  });

  document.addEventListener('pointerup', (e) => {
    if (!dragStart) return;
    const dx = Math.abs(e.clientX - dragStart.x);
    const dy = Math.abs(e.clientY - dragStart.y);
    if (dx < THRESHOLD && dy < THRESHOLD) {
      openLightbox(dragStart.img.src, dragStart.img.alt);
    }
    dragStart = null;
  });
})();