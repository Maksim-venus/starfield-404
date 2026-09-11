import "./style.css";
import { createPointer } from "./pointer.js";
import { createStarfield } from "./starfield.js";
import { createBlackHole } from "./blackhole.js";
import { createGlyphs } from "./glyphs.js";
import { createHud } from "./hud.js";

const canvas = document.querySelector("#void");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = createPointer(canvas);
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
const hud = createHud({ reduced });

const world = {
  w: 1,
  h: 1,
  dpr: 1,
  cx: 0,
  cy: 0,
  holeR: 80,
  mobile: false,
  reduced,
  zoom: 1,
};

let stars = null;
let hole = null;
let glyphs = null;
let time = 0;
let last = performance.now();
let running = true;
let hudTick = 0;

function fit() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  world.w = window.innerWidth;
  world.h = window.innerHeight;
  world.dpr = dpr;
  world.cx = world.w * 0.5;
  world.cy = world.h * (world.h < 720 ? 0.42 : 0.48);
  world.holeR = Math.min(world.w, world.h) * (world.w < 640 ? 0.148 : 0.128);
  world.mobile = world.w < 720 || world.h < 640;
  canvas.width = Math.floor(world.w * dpr);
  canvas.height = Math.floor(world.h * dpr);
  canvas.style.width = `${world.w}px`;
  canvas.style.height = `${world.h}px`;
}

function rebuild() {
  stars = createStarfield(world);
  hole = createBlackHole(world);
  glyphs = createGlyphs(world);
}

function drawSelection(ctx) {
  const { cx, cy, holeR, zoom } = world;
  const R = holeR * zoom;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.16);
  ctx.strokeStyle = "rgba(143, 212, 255, 0.4)";
  ctx.setLineDash([5, 7]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 1.62, R * 1.62 * 0.34, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(143, 212, 255, 0.85)";
  ctx.beginPath();
  ctx.arc(R * 1.62, 0, 2.2, 0, Math.PI * 2);
  ctx.arc(-R * 1.62, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function render(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!reduced) time += dt * (pointer.state.down ? 1.15 : 1);

  pointer.update();
  ctx.setTransform(world.dpr, 0, 0, world.dpr, 0, 0);

  stars.draw(ctx, time, pointer.state);
  hole.drawGlow(ctx);
  if (!reduced) hole.update(dt);
  hole.drawFar(ctx, time);
  if (!reduced) glyphs.update(dt, pointer.state);
  glyphs.drawTrails(ctx);
  glyphs.draw(ctx, time, pointer.state, "far");
  hole.drawCore(ctx, time);
  hole.drawNear(ctx, time);
  glyphs.draw(ctx, time, pointer.state, "near");
  drawSelection(ctx);

  if (++hudTick % 4 === 0) {
    hud.update({
      time,
      zoom: world.zoom,
      count: glyphs.count(),
      warping: pointer.state.down,
    });
  }

  if (!reduced && !document.hidden) {
    requestAnimationFrame(render);
  }
}

function onResize() {
  fit();
  rebuild();
  last = performance.now();
  hud.update({
    time,
    zoom: world.zoom,
    count: glyphs.count(),
    warping: false,
  });
  if (reduced) render(last);
}

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    if (reduced) return;
    const next = world.zoom * (event.deltaY > 0 ? 0.94 : 1.06);
    world.zoom = Math.min(2.4, Math.max(0.45, next));
  },
  { passive: false },
);

fit();
rebuild();
hud.update({
  time: 0,
  zoom: 1,
  count: glyphs.count(),
  warping: false,
});

window.addEventListener("resize", onResize);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !reduced) {
    last = performance.now();
    requestAnimationFrame(render);
  }
});

const start = () => requestAnimationFrame(render);

if (document.fonts?.ready) {
  document.fonts.ready.then(start);
} else {
  start();
}
