import * as THREE from 'three';

// The hero visual: a small "build graph" — a hub (you) connected to the
// domains you build across (web, mobile, cloud, AI/ML, data), with a glowing
// packet that travels the graph to suggest something shipping, plus a
// slow-drifting particle field for ambient depth. Colors are read from the
// page's CSS variables so it stays in sync with light/dark mode.

const DOMAINS = [
  { label: 'WEB', pos: [-3.1, 1.3, 0.4] },
  { label: 'MOBILE', pos: [3.0, 1.4, -0.6] },
  { label: 'CLOUD', pos: [-2.6, -1.5, -0.3] },
  { label: 'AI/ML', pos: [2.7, -1.3, 0.5] },
  { label: 'DATA', pos: [0.0, 0.0, -2.6] },
];

function cssColor(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

function makeLabelSprite(text, color) {
  const cvs = document.createElement('canvas');
  cvs.width = 256;
  cvs.height = 64;
  const ctx = cvs.getContext('2d');
  ctx.font = '600 34px "IBM Plex Mono", monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(cvs);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.8, 0.45, 1);
  return sprite;
}

export function createHeroScene(canvas) {
  const container = canvas.parentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.4, 8.5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);

  const group = new THREE.Group();
  scene.add(group);

  // --- ambient particle field ---
  const PARTICLE_COUNT = 260;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particlePos[i * 3] = (Math.random() - 0.5) * 20;
    particlePos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    particlePos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({ size: 0.035, transparent: true, opacity: 0.5 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // --- hub ---
  const hubMat = new THREE.MeshBasicMaterial({ wireframe: true });
  const hub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), hubMat);
  group.add(hub);

  const hubGlowMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.15 });
  const hubGlow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), hubGlowMat);
  group.add(hubGlow);

  // --- domain nodes + connecting edges ---
  const nodeMeshes = [];
  const edgeMats = [];
  const labelSprites = [];

  DOMAINS.forEach((d) => {
    const mat = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), mat);
    mesh.position.set(...d.pos);
    mesh.userData.base = d.pos.slice();
    mesh.userData.phase = Math.random() * Math.PI * 2;
    group.add(mesh);
    nodeMeshes.push(mesh);

    const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 });
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...d.pos)];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat);
    group.add(line);
    edgeMats.push({ mat: lineMat, phase: Math.random() * Math.PI * 2 });

    const sprite = makeLabelSprite(d.label, '#F1EFE9');
    sprite.position.set(d.pos[0], d.pos[1] + 0.42, d.pos[2]);
    group.add(sprite);
    labelSprites.push(sprite);
  });

  // --- traveling "shipment" pulse: hub -> a domain node, in sequence ---
  const pulseMat = new THREE.MeshBasicMaterial();
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), pulseMat);
  group.add(pulse);
  let pulseTarget = 0;
  let pulseStart = performance.now();
  const PULSE_DURATION = 1400; // ms travel time
  const PULSE_PAUSE = 900; // ms dwell at node before moving on

  function updatePulse(now) {
    const elapsed = now - pulseStart;
    const cycle = PULSE_DURATION + PULSE_PAUSE;
    const t = elapsed % cycle;

    if (t < PULSE_DURATION) {
      const progress = t / PULSE_DURATION;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      const target = new THREE.Vector3(...DOMAINS[pulseTarget].pos);
      pulse.position.lerpVectors(new THREE.Vector3(0, 0, 0), target, eased);
      pulse.visible = true;
      pulseMat.opacity = 1;
    } else {
      pulse.visible = false;
    }

    if (elapsed > cycle) {
      pulseTarget = (pulseTarget + 1) % DOMAINS.length;
      pulseStart = now;
    }
  }

  function updateColors() {
    const accent = new THREE.Color(cssColor('--accent', '#E8A33D'));
    const accent2 = new THREE.Color(cssColor('--accent-2', '#5FC9C0'));
    const textHex = cssColor('--text', '#F1EFE9');

    hubMat.color = accent;
    hubGlowMat.color = accent;
    pulseMat.color = accent;
    particleMat.color = accent2;
    nodeMeshes.forEach((m) => (m.material.color = accent2));
    edgeMats.forEach((e) => (e.mat.color = accent2));

    labelSprites.forEach((s, i) => {
      const fresh = makeLabelSprite(DOMAINS[i].label, textHex);
      s.material.map.dispose();
      s.material.dispose();
      s.material = fresh.material;
    });
  }
  updateColors();

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // subtle mouse parallax
  let mouseX = 0;
  let mouseY = 0;
  function onPointerMove(e) {
    const rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }
  container.addEventListener('pointermove', onPointerMove);

  let raf;
  const clock = new THREE.Clock();

  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const now = performance.now();

    if (!reduceMotion) {
      group.rotation.y = t * 0.18 + mouseX * 0.25;
      group.rotation.x = Math.sin(t * 0.15) * 0.08 + mouseY * 0.12;
      hub.rotation.y += 0.01;
      hub.rotation.x += 0.006;
      hubGlow.scale.setScalar(1 + Math.sin(t * 1.4) * 0.08);

      nodeMeshes.forEach((m) => {
        const [bx, by, bz] = m.userData.base;
        const p = m.userData.phase;
        m.position.set(bx, by + Math.sin(t * 0.9 + p) * 0.12, bz);
      });
      edgeMats.forEach((e) => {
        e.mat.opacity = 0.35 + Math.sin(t * 1.2 + e.phase) * 0.2;
      });
      particles.rotation.y = t * 0.015;

      updatePulse(now);
    }

    renderer.render(scene, camera);
  }
  animate();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      animate();
    }
  });

  return { updateColors };
}
