const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const menu = document.getElementById("menu");
const gameOver = document.getElementById("gameOver");
const hud = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("bestScore");
const finalScoreEl = document.getElementById("finalScore");
const finalBestEl = document.getElementById("finalBest");

const playBtn = document.getElementById("playBtn");
const againBtn = document.getElementById("againBtn");
const menuBtn = document.getElementById("menuBtn");

const state = {
  mode: "menu",
  score: 0,
  best: Number(localStorage.getItem("skyHopperBest") || 0),
  lastTime: 0,
  spawnTimer: 0,
  groundOffset: 0,
  flash: 0,
  shake: 0
};

bestEl.textContent = state.best;

const bird = {
  x: 130,
  y: H / 2,
  r: 18,
  vy: 0,
  rotation: 0
};

const pipes = [];
const particles = [];
const clouds = [];

for (let i = 0; i < 7; i++) {
  clouds.push({
    x: Math.random() * W,
    y: 70 + Math.random() * 220,
    w: 55 + Math.random() * 85,
    speed: 8 + Math.random() * 12
  });
}

function resetGame() {
  state.mode = "playing";
  state.score = 0;
  state.spawnTimer = 0;
  state.groundOffset = 0;
  state.flash = 0;
  state.shake = 0;
  bird.x = 130;
  bird.y = H / 2;
  bird.vy = 0;
  bird.rotation = 0;
  pipes.length = 0;
  particles.length = 0;
  scoreEl.textContent = "0";
  menu.classList.add("hidden");
  gameOver.classList.add("hidden");
  hud.classList.remove("hidden");
  flap();
}

function endGame() {
  if (state.mode !== "playing") return;
  state.mode = "gameover";
  state.shake = 12;
  state.flash = 0.18;

  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem("skyHopperBest", state.best);
  }

  finalScoreEl.textContent = state.score;
  finalBestEl.textContent = state.best;
  bestEl.textContent = state.best;
  gameOver.classList.remove("hidden");
  hud.classList.add("hidden");
}

function flap() {
  if (state.mode !== "playing") return;
  bird.vy = -430;
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: bird.x - 14,
      y: bird.y + 5,
      vx: -70 - Math.random() * 80,
      vy: (Math.random() - .5) * 80,
      life: .35 + Math.random() * .2,
      maxLife: .55,
      size: 2 + Math.random() * 3
    });
  }
}

function spawnPipe() {
  const gap = Math.max(145, 190 - state.score * 1.2);
  const minTop = 80;
  const maxTop = H - 120 - gap;
  const top = minTop + Math.random() * (maxTop - minTop);

  pipes.push({
    x: W + 40,
    width: 74,
    top,
    bottom: top + gap,
    passed: false
  });
}

function update(dt) {
  for (const cloud of clouds) {
    cloud.x -= cloud.speed * dt;
    if (cloud.x + cloud.w < -10) {
      cloud.x = W + 20;
      cloud.y = 70 + Math.random() * 220;
    }
  }

  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 120 * dt;
    p.life -= dt;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  state.flash = Math.max(0, state.flash - dt);
  state.shake = Math.max(0, state.shake - 30 * dt);

  if (state.mode !== "playing") return;

  bird.vy += 1150 * dt;
  bird.y += bird.vy * dt;
  bird.rotation = Math.max(-0.5, Math.min(1.2, bird.vy / 650));

  state.spawnTimer += dt;
  if (state.spawnTimer >= 1.45) {
    state.spawnTimer = 0;
    spawnPipe();
  }

 const speed = Math.min(225 + Math.floor(state.score / 5) * 35, 400);
  for (const pipe of pipes) {
    pipe.x -= speed * dt;

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      state.score++;
      scoreEl.textContent = state.score;
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: bird.x,
          y: bird.y,
          vx: (Math.random() - .5) * 130,
          vy: (Math.random() - .5) * 130,
          life: .3 + Math.random() * .3,
          maxLife: .6,
          size: 2 + Math.random() * 3
        });
      }
    }

    const hitX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + pipe.width;
    const hitY = bird.y - bird.r < pipe.top || bird.y + bird.r > pipe.bottom;
    if (hitX && hitY) endGame();
  }

  while (pipes.length && pipes[0].x + pipes[0].width < -30) pipes.shift();

  if (bird.y - bird.r <= 0 || bird.y + bird.r >= H - 70) {
    endGame();
  }

  state.groundOffset = (state.groundOffset + speed * dt) % 48;
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#75d1ff");
  gradient.addColorStop(.58, "#b8ebff");
  gradient.addColorStop(1, "#e9f9ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,.22)";
  ctx.beginPath();
  ctx.arc(390, 95, 55, 0, Math.PI * 2);
  ctx.fill();

  for (const c of clouds) {
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w * .45, 19, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - c.w * .25, c.y + 2, c.w * .28, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + c.w * .22, c.y + 1, c.w * .32, 17, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#9bdf87";
  ctx.beginPath();
  ctx.moveTo(0, H - 110);
  ctx.quadraticCurveTo(120, H - 165, 240, H - 105);
  ctx.quadraticCurveTo(350, H - 55, W, H - 125);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();

  ctx.fillStyle = "#77c96b";
  ctx.beginPath();
  ctx.moveTo(0, H - 82);
  ctx.quadraticCurveTo(140, H - 120, 280, H - 70);
  ctx.quadraticCurveTo(400, H - 30, W, H - 90);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
}

function drawPipe(x, y, h, upsideDown = false) {
  const w = 74;
  const capH = 24;
  const capW = 84;
  const capX = x - (capW - w) / 2;

  ctx.fillStyle = "#3eaf61";
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#58cf78";
  ctx.fillRect(x + 9, y, 12, h);

  ctx.fillStyle = "#2b8c4d";
  ctx.fillRect(x + w - 11, y, 11, h);

  const capY = upsideDown ? y + h - capH : y;
  ctx.fillStyle = "#319b55";
  ctx.fillRect(capX, capY, capW, capH);

  ctx.fillStyle = "#65dc83";
  ctx.fillRect(capX + 9, capY + 4, 12, capH - 7);

  ctx.strokeStyle = "rgba(0,0,0,.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeRect(capX, capY, capW, capH);
}

function drawPipes() {
  for (const p of pipes) {
    drawPipe(p.x, 0, p.top, true);
    drawPipe(p.x, p.bottom, H - 70 - p.bottom, false);
  }
}

function drawGround() {
  ctx.fillStyle = "#e8c76c";
  ctx.fillRect(0, H - 70, W, 70);

  ctx.fillStyle = "#d8b75a";
  for (let x = -48 + state.groundOffset; x < W + 48; x += 48) {
    ctx.fillRect(x, H - 48, 24, 6);
    ctx.fillRect(x + 27, H - 28, 21, 6);
  }

  ctx.fillStyle = "#77c96b";
  ctx.fillRect(0, H - 70, W, 10);
  ctx.fillStyle = "#5caf5b";
  ctx.fillRect(0, H - 70, W, 4);
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  ctx.fillStyle = "#ffd34e";
  ctx.beginPath();
  ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f0aa35";
  ctx.beginPath();
  ctx.ellipse(-5, 7, 11, 7, -.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(8, -7, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#18212f";
  ctx.beginPath();
  ctx.arc(10, -7, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff8d3d";
  ctx.beginPath();
  ctx.moveTo(16, -1);
  ctx.lineTo(31, 4);
  ctx.lineTo(16, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.save();

  if (state.shake > 0) {
    ctx.translate(
      (Math.random() - .5) * state.shake,
      (Math.random() - .5) * state.shake
    );
  }

  drawBackground();
  drawPipes();
  drawGround();
  drawParticles();
  drawBird();

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flash})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

function loop(time) {
  const dt = Math.min((time - state.lastTime) / 1000 || 0, .033);
  state.lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function input(e) {
  if (e) e.preventDefault();
  if (state.mode === "playing") flap();
}

playBtn.addEventListener("click", resetGame);
againBtn.addEventListener("click", resetGame);
menuBtn.addEventListener("click", () => {
  state.mode = "menu";
  gameOver.classList.add("hidden");
  hud.classList.add("hidden");
  menu.classList.remove("hidden");
  bird.y = H / 2;
  bird.vy = 0;
  pipes.length = 0;
});

canvas.addEventListener("pointerdown", input);
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    input(e);
  }
  if (e.code === "Enter" && state.mode !== "playing") {
    resetGame();
  }
});

render();
requestAnimationFrame(loop);
