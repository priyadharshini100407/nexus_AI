/* ══════════════════════════════════════════
   NEXUS AI — form.js
   Cursor · Canvas · NPK sliders · Moisture preview · Loading overlay
══════════════════════════════════════════ */

/* ── Custom Cursor ── */
const cur  = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px';
  cur.style.top  = my + 'px';
});

function animRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animRing);
}
animRing();

document.querySelectorAll('a, button, input, select').forEach(el => {
  el.addEventListener('mouseenter', () => { ring.style.width = '52px'; ring.style.height = '52px'; });
  el.addEventListener('mouseleave', () => { ring.style.width = '36px'; ring.style.height = '36px'; });
});

/* ── Animated Canvas ── */
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');
let W, H, pts = [];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  pts = Array.from({ length: 60 }, () => ({
    x:  Math.random() * W,
    y:  Math.random() * H,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    r:  Math.random() * 1.5 + 0.5,
  }));
}
resize();
window.addEventListener('resize', resize);

function draw() {
  ctx.clearRect(0, 0, W, H);

  const g = ctx.createRadialGradient(W * 0.15, H * 0.15, 0, W * 0.15, H * 0.15, W * 0.6);
  g.addColorStop(0, 'rgba(0,80,50,0.4)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  pts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,200,150,0.35)';
    ctx.fill();
  });

  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 100) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(0,200,150,${0.07 * (1 - d / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(draw);
}
draw();

/* ── NPK Sliders ── */
document.getElementById('nSlider').addEventListener('input', function () {
  document.getElementById('nVal').textContent = this.value;
});
document.getElementById('pSlider').addEventListener('input', function () {
  document.getElementById('pVal').textContent = this.value;
});
document.getElementById('kSlider').addEventListener('input', function () {
  document.getElementById('kVal').textContent = this.value;
});

/* ── Moisture Preview ── */
function updateMoisture() {
  const w = parseFloat(document.getElementById('wet').value);
  const d = parseFloat(document.getElementById('dry').value);
  const preview = document.getElementById('moistPreview');

  if (w && d && d > 0 && w > d) {
    const m = (((w - d) / d) * 100).toFixed(1);
    document.getElementById('moistVal').textContent = m + '%';
    const pct = Math.min(parseFloat(m), 80) / 80 * 100;
    document.getElementById('moistBar').style.width = pct + '%';
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

document.getElementById('wet').addEventListener('input', updateMoisture);
document.getElementById('dry').addEventListener('input', updateMoisture);

/* ── Loading Overlay on Form Submit ── */
document.getElementById('mainForm').addEventListener('submit', function () {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('active');

  const stepIds = ['ls1', 'ls2', 'ls3', 'ls4', 'ls5'];
  stepIds.forEach((id, i) => {
    setTimeout(() => {
      document.getElementById(id).classList.add('active');
      if (i > 0) {
        document.getElementById(stepIds[i - 1]).classList.remove('active');
        document.getElementById(stepIds[i - 1]).classList.add('done');
      }
    }, i * 600);
  });
});

/* ── Section Entrance Animations ── */
document.querySelectorAll('.sec').forEach((sec, i) => {
  sec.style.opacity = '0';
  sec.style.transform = 'translateY(20px)';
  setTimeout(() => {
    sec.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    sec.style.opacity = '1';
    sec.style.transform = 'none';
  }, 200 + i * 120);
});
