import "./style.css";
import { createPointer } from "./pointer.js";
import { createStarfield } from "./starfield.js";
import { createBlackHole } from "./blackhole.js";
import { createGlyphs } from "./glyphs.js";

const canvas = document.querySelector("#void");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = createPointer(canvas);
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

const world = {
  w: 1,
  h: 1,
  dpr: 1,
  cx: 0,
  cy: 0,
  holeR: 80,
  mobile: false,
  reduced,
};

let stars = null;
let hole = null;
let glyphs = null;
let time = 0;
let last = performance.now();
let running = true;

function fit() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  world.w = window.innerWidth;
  world.h = window.innerHeight;
  world.dpr = dpr;
  world.cx = world.w * 0.5;
  world.cy = world.h * (world.h < 720 ? 0.4 : 0.445);
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

function render(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!reduced) time += dt;

  pointer.update();
  ctx.setTransform(world.dpr, 0, 0, world.dpr, 0, 0);

  stars.draw(ctx, time, pointer.state);
  hole.drawGlow(ctx);
  if (!reduced) hole.update(dt);
  hole.drawFar(ctx, time);
  if (!reduced) glyphs.update(dt, pointer.state);
  glyphs.draw(ctx, time, pointer.state, "far");
  hole.drawCore(ctx, time);
  hole.drawNear(ctx, time);
  glyphs.draw(ctx, time, pointer.state, "near");

  if (!reduced && !document.hidden) {
    requestAnimationFrame(render);
  }
}

function onResize() {
  fit();
  rebuild();
  last = performance.now();
  if (reduced) render(last);
}

fit();
rebuild();

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
