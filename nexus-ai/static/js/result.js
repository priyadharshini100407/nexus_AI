/* ══════════════════════════════════════════
   NEXUS AI — result.js
   Cursor · Canvas · Confidence bar · Timeline · Confetti
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

document.querySelectorAll('a, button, .dcard, .harvest-card').forEach(el => {
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
    ctx.fillStyle = 'rgba(0,200,150,0.3)';
    ctx.fill();
  });

  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 100) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(0,200,150,${0.06 * (1 - d / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(draw);
}
draw();

/* ── Confidence Bar ── */
setTimeout(() => {
  const fill  = document.getElementById('confFill');
  const numEl = document.getElementById('confNum');
  fill.style.width = '94.7%';

  let n = 0;
  const target = 94.7;
  const iv = setInterval(() => {
    n += 1.2;
    if (n >= target) { n = target; clearInterval(iv); }
    numEl.textContent = n.toFixed(1) + '%';
  }, 16);
}, 700);

/* ── Chart.js Integration ── */
const resultDataRaw = document.getElementById('result-data');
if (resultDataRaw) {
  const resultData = JSON.parse(resultDataRaw.textContent);
  
  Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
  Chart.defaults.font.family = "'Syne', sans-serif";

  // Fertilizer & Pesticide Doughnut Charts
  setTimeout(() => {
    const fertCtx = document.getElementById('fertChart').getContext('2d');
    new Chart(fertCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(resultData.fertilizer),
        datasets: [{
          data: Object.values(resultData.fertilizer),
          backgroundColor: ['#00c896', '#009e78', '#f5c842', '#ffe066'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#fff', font: {size: 11} } },
          tooltip: { callbacks: { label: function(context) { return context.label + ': ' + context.parsed + '%'; } } }
        },
        cutout: '70%'
      }
    });

    const pestCtx = document.getElementById('pestChart').getContext('2d');
    new Chart(pestCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(resultData.pesticide),
        datasets: [{
          data: Object.values(resultData.pesticide),
          backgroundColor: ['#f5c842', '#ffaa00', '#00c896', '#ffffff'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#fff', font: {size: 11} } },
          tooltip: { callbacks: { label: function(context) { return context.label + ': ' + context.parsed + '%'; } } }
        },
        cutout: '70%'
      }
    });
  }, 700);

  // Harvest Timeline Chart
  setTimeout(() => {
    const harvestCtx = document.getElementById('harvestChart').getContext('2d');
    
    const days = resultData.harvest_days || 100;
    const labels = [];
    const dataPoints = [];
    const steps = 10;
    for(let i=0; i<=steps; i++) {
      let currentDay = Math.round((days/steps) * i);
      labels.push('Day ' + currentDay);
      let growth = (1 / (1 + Math.exp(-10 * ((currentDay/days) - 0.5)))) * 100;
      dataPoints.push(Math.round(growth));
    }

    let gradient = harvestCtx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(0, 200, 150, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 200, 150, 0.0)');

    new Chart(harvestCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Growth %',
          data: dataPoints,
          borderColor: '#00c896',
          backgroundColor: gradient,
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#f5c842',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function(context) { return context.parsed.y + '% Growth'; } } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' }, min: 0, max: 100 }
        }
      }
    });
  }, 850);
}

/* ── Confetti Burst ── */
const cc = document.getElementById('confetti');
const cx = cc.getContext('2d');
cc.width  = window.innerWidth;
cc.height = window.innerHeight;

const colors = ['#00c896', '#f5c842', '#ffffff', '#88ffcc', '#ffe066'];
const pieces = Array.from({ length: 80 }, () => ({
  x:   Math.random() * cc.width,
  y:   -20 - Math.random() * 200,
  vx:  (Math.random() - 0.5) * 4,
  vy:  2 + Math.random() * 3,
  r:   Math.random() * 5 + 2,
  c:   colors[Math.floor(Math.random() * colors.length)],
  rot: Math.random() * 360,
  rv:  (Math.random() - 0.5) * 8,
  life: 1,
}));

let confDone = false;

function drawConfetti() {
  if (confDone) return;
  cx.clearRect(0, 0, cc.width, cc.height);
  let allGone = true;

  pieces.forEach(p => {
    if (p.life <= 0) return;
    allGone = false;
    p.x   += p.vx;
    p.y   += p.vy;
    p.vy  += 0.05;
    p.rot += p.rv;
    p.life -= 0.003;

    cx.save();
    cx.translate(p.x, p.y);
    cx.rotate(p.rot * Math.PI / 180);
    cx.globalAlpha = p.life;
    cx.fillStyle = p.c;
    cx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
    cx.restore();
  });

  if (allGone) {
    confDone = true;
    cx.clearRect(0, 0, cc.width, cc.height);
  } else {
    requestAnimationFrame(drawConfetti);
  }
}

setTimeout(drawConfetti, 600);
