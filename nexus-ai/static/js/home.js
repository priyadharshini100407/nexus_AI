/* ══════════════════════════════════════════
   NEXUS AI — home.js
   Custom cursor · Canvas particles · Typing · Scroll reveal · Counters
══════════════════════════════════════════ */

/* ── Custom Cursor ── */
const cur = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.transform = `translate(${mx - 5}px, ${my - 5}px)`;
});

function animRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
  requestAnimationFrame(animRing);
}
animRing();

document.querySelectorAll('a, button, .feat-card, .crop-item').forEach(el => {
  el.addEventListener('mouseenter', () => { ring.style.width = '56px'; ring.style.height = '56px'; ring.style.opacity = '0.6'; });
  el.addEventListener('mouseleave', () => { ring.style.width = '36px'; ring.style.height = '36px'; ring.style.opacity = '1'; });
});

/* ── Animated Canvas (particles + connections) ── */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, pts = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  pts = Array.from({ length: 80 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 2 + 0.5,
  }));
}
resize();
window.addEventListener('resize', resize);

function drawBg() {
  ctx.clearRect(0, 0, W, H);

  // radial gradients
  const g1 = ctx.createRadialGradient(W * 0.2, H * 0.2, 0, W * 0.2, H * 0.2, W * 0.7);
  g1.addColorStop(0, 'rgba(0,80,50,0.5)');
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

  const g2 = ctx.createRadialGradient(W * 0.85, H * 0.8, 0, W * 0.85, H * 0.8, W * 0.5);
  g2.addColorStop(0, 'rgba(0,200,150,0.08)');
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

  // particles
  pts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,200,150,0.4)';
    ctx.fill();
  });

  // connecting lines
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 120) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(0,200,150,${0.08 * (1 - d / 120)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(drawBg);
}
drawBg();

/* ── Typing Effect ── */
const lines = [
  "Analysing nitrogen levels...",
  "Cross-referencing soil pH...",
  "Optimising fertilizer profile...",
  "Generating harvest timeline...",
  "Model confidence: 94.7%",
];
let li = 0, ci = 0, dir = 1;

function typeStep() {
  const el = document.getElementById('typeEl');
  const line = lines[li];
  if (dir === 1) {
    ci++;
    el.textContent = line.slice(0, ci);
    if (ci >= line.length) { dir = -1; setTimeout(typeStep, 1800); return; }
  } else {
    ci--;
    el.textContent = line.slice(0, ci);
    if (ci <= 0) { dir = 1; li = (li + 1) % lines.length; setTimeout(typeStep, 400); return; }
  }
  setTimeout(typeStep, dir === 1 ? 48 : 20);
}
typeStep();

/* ── Scroll Reveal ── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── Animated Counters ── */
function animCount(el, target, suffix) {
  let s = 0;
  const step = () => {
    s += target / 60;
    if (s >= target) { el.textContent = target + suffix; return; }
    el.textContent = Math.floor(s) + suffix;
    requestAnimationFrame(step);
  };
  step();
}

const statValues = [20, 8, 99];
const statSuffixes = ['+', '', '%'];
const statObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animCount(e.target, parseInt(e.target.dataset.n), e.target.dataset.s || '');
      statObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-n').forEach((el, i) => {
  el.dataset.n = statValues[i];
  el.dataset.s = statSuffixes[i];
  el.textContent = '0' + statSuffixes[i];
  statObs.observe(el);
});
