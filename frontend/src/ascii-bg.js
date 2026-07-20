// Interactive ASCII background: ambient flicker field + cursor-following glow trail
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ambientCanvas = document.getElementById('asciiAmbient');
  const trailCanvas = document.getElementById('asciiTrail');
  if (!ambientCanvas || !trailCanvas) return;

  const aCtx = ambientCanvas.getContext('2d');
  const tCtx = trailCanvas.getContext('2d');

  const CHARS = 'XxOo+=-:.#*<>/\\'.split('');
  const CELL = 34;
  const FONT = "IBM Plex Mono, monospace";

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let cells = [];
  let colors = { accent: '#E8A33D', accent2: '#5FC9C0', muted: '#9CA3B8' };

  function readColors(){
    const s = getComputedStyle(document.documentElement);
    colors.accent = s.getPropertyValue('--accent').trim() || colors.accent;
    colors.accent2 = s.getPropertyValue('--accent-2').trim() || colors.accent2;
    colors.muted = s.getPropertyValue('--text-muted').trim() || colors.muted;
  }

  function hexToRgb(hex){
    const h = hex.replace('#','');
    const n = h.length === 3
      ? h.split('').map(c => c + c).join('')
      : h;
    const num = parseInt(n, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function sizeCanvas(cv, ctx){
    cv.width = Math.floor(window.innerWidth * dpr);
    cv.height = Math.floor(window.innerHeight * dpr);
    cv.style.width = window.innerWidth + 'px';
    cv.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildAmbientGrid(){
    W = window.innerWidth;
    H = window.innerHeight;
    sizeCanvas(ambientCanvas, aCtx);
    sizeCanvas(trailCanvas, tCtx);
    const cols = Math.ceil(W / CELL);
    const rows = Math.ceil(H / CELL);
    cells = [];
    for (let r = 0; r < rows; r++){
      for (let c = 0; c < cols; c++){
        cells.push({
          x: c * CELL + CELL / 2,
          y: r * CELL + CELL / 2,
          char: CHARS[(Math.random() * CHARS.length) | 0],
          opacity: 0.02 + Math.random() * 0.07,
          tinted: Math.random() < 0.08
        });
      }
    }
    drawAmbient();
  }

  function drawAmbient(){
    aCtx.clearRect(0, 0, W, H);
    aCtx.font = `13px ${FONT}`;
    aCtx.textAlign = 'center';
    aCtx.textBaseline = 'middle';
    for (const cell of cells){
      const rgb = cell.tinted ? hexToRgb(colors.accent) : hexToRgb(colors.muted);
      aCtx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${cell.opacity})`;
      aCtx.fillText(cell.char, cell.x, cell.y);
    }
  }

  function flickerAmbient(){
    const n = Math.min(40, cells.length);
    for (let i = 0; i < n; i++){
      const cell = cells[(Math.random() * cells.length) | 0];
      cell.char = CHARS[(Math.random() * CHARS.length) | 0];
      cell.opacity = 0.02 + Math.random() * 0.07;
      cell.tinted = Math.random() < 0.08;
    }
    drawAmbient();
  }

  // ---------- cursor trail ----------
  let particles = [];
  let pointer = { x: -9999, y: -9999, active: false };
  const MAX_PARTICLES = 160;

  function spawnParticles(x, y){
    const count = 2;
    for (let i = 0; i < count; i++){
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const useAccent2 = Math.random() < 0.45;
      particles.push({
        x: x + (Math.random() - 0.5) * 22,
        y: y + (Math.random() - 0.5) * 22,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.25,
        char: CHARS[(Math.random() * CHARS.length) | 0],
        size: 12 + Math.random() * 8,
        color: useAccent2 ? colors.accent2 : colors.accent,
        life: 0,
        maxLife: 650 + Math.random() * 550,
        lastCharSwap: 0
      });
    }
  }

  let lastTime = performance.now();

  function tick(now){
    const dt = now - lastTime;
    lastTime = now;

    tCtx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--){
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife){ particles.splice(i, 1); continue; }

      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      p.lastCharSwap += dt;
      if (p.lastCharSwap > 90){
        p.char = CHARS[(Math.random() * CHARS.length) | 0];
        p.lastCharSwap = 0;
      }

      const progress = p.life / p.maxLife;
      const alpha = 1 - progress * progress; // ease out
      const rgb = hexToRgb(p.color);

      tCtx.font = `600 ${p.size}px ${FONT}`;
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      tCtx.shadowColor = p.color;
      tCtx.shadowBlur = 10;
      tCtx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
      tCtx.fillText(p.char, p.x, p.y);
    }
    tCtx.shadowBlur = 0;

    requestAnimationFrame(tick);
  }

  function onPointerMove(e){
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    spawnParticles(pointer.x, pointer.y);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });

  window.addEventListener('resize', () => {
    readColors();
    buildAmbientGrid();
  });

  new MutationObserver(() => {
    readColors();
    drawAmbient();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---------- init ----------
  readColors();
  buildAmbientGrid();

  if (!reduceMotion){
    setInterval(flickerAmbient, 220);
    requestAnimationFrame(tick);
  }
})();