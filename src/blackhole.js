function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FLATTEN = 0.34;
const ROLL = -0.16;

function project(radius, angle) {
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  const sx = x * Math.cos(ROLL) - y * FLATTEN * Math.sin(ROLL);
  const sy = x * Math.sin(ROLL) + y * FLATTEN * Math.cos(ROLL);
  return { sx, sy, depth: -y, x, y };
}

function diskFill(heat, approach, alpha) {
  const r = 255;
  const g = Math.round(72 + 178 * heat * (0.5 + 0.5 * approach));
  const b = Math.round(32 + 70 * heat * approach + 110 * (1 - heat) * 0.75);
  const a = alpha * (0.22 + 0.78 * (0.38 + 0.62 * approach)) * (0.45 + 0.55 * heat);
  return `rgba(${r},${g},${b},${a})`;
}

function spawnDisk(count, inner, outer, seed) {
  const rand = mulberry32(seed);
  const particles = [];
  for (let i = 0; i < count; i++) {
    const u = Math.pow(rand(), 0.58);
    const r = inner + (outer - inner) * u;
    particles.push({
      r,
      a: rand() * Math.PI * 2,
      w: (0.38 + rand() * 0.22) * Math.pow(inner / r, 1.5),
      size: (0.4 + rand() * 1.7) * (1.2 - u * 0.75),
      heat: 1 - u,
      spark: rand() > 0.84,
    });
  }
  return particles;
}

export function createBlackHole(world) {
  const count = world.mobile ? 420 : 980;
  const particles = spawnDisk(count, 1.42, 4.9, 0x504040);

  const paint = (ctx, time, side) => {
    const { cx, cy, holeR } = world;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = "screen";

      for (const p of particles) {
      const { sx, sy, depth } = project(p.r * holeR, p.a);
      const far = depth < 0;
      if (side === "far" && !far) continue;
      if (side === "near" && far) continue;

      const approach = 0.5 - 0.5 * Math.cos(p.a);
      const pulse = reduced ? 1 : 0.82 + 0.18 * Math.sin(time * 2.4 + p.a);
      const alpha = (p.spark ? 0.95 : 0.55) * pulse;
      ctx.fillStyle = diskFill(p.heat, approach, alpha);
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * (0.7 + 0.55 * approach), 0, Math.PI * 2);
      ctx.fill();

      if (far && Math.hypot(sx, sy) < holeR * 1.7 && sy < holeR * 0.22) {
        const ang = Math.atan2(sy, sx);
        const ring = holeR * (1.06 + 0.1 * p.heat);
        const lx = Math.cos(ang) * ring;
        const ly = Math.sin(ang) * ring * 0.86;
        ctx.fillStyle = diskFill(Math.min(1, p.heat + 0.2), Math.max(approach, 0.55), 0.55);
        ctx.beginPath();
        ctx.arc(lx, ly, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  return {
    update(dt) {
      if (world.reduced) return;
      for (const p of particles) p.a += p.w * dt;
    },

    drawGlow(ctx) {
      const { cx, cy, holeR } = world;
      const reach = holeR * 7.2;
      const glow = ctx.createRadialGradient(cx, cy, holeR * 0.7, cx, cy, reach);
      glow.addColorStop(0, "rgba(255, 196, 110, 0.22)");
      glow.addColorStop(0.12, "rgba(232, 120, 48, 0.14)");
      glow.addColorStop(0.28, "rgba(140, 62, 170, 0.1)");
      glow.addColorStop(0.55, "rgba(40, 18, 70, 0.06)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, reach, 0, Math.PI * 2);
      ctx.fill();
    },

    drawFar(ctx, time) {
      paint(ctx, time, "far");
      drawLensedCap(ctx, world, time);
    },

    drawCore(ctx, time) {
      const { cx, cy, holeR, reduced } = world;
      const shimmer = reduced ? 0 : 0.06 * Math.sin(time * 0.7);

      const well = ctx.createRadialGradient(cx - holeR * 0.12, cy - holeR * 0.08, holeR * 0.15, cx, cy, holeR);
      well.addColorStop(0, "#000000");
      well.addColorStop(0.7, "#000000");
      well.addColorStop(0.88, "#0b070f");
      well.addColorStop(0.96, "#1a0d14");
      well.addColorStop(1, "#000000");
      ctx.fillStyle = well;
      ctx.beginPath();
      ctx.arc(cx, cy, holeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = `rgba(255, 228, 176, ${0.82 + shimmer})`;
      ctx.lineWidth = Math.max(1.1, holeR * 0.028);
      ctx.beginPath();
      ctx.arc(cx, cy, holeR * 1.012, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 168, 72, 0.35)";
      ctx.lineWidth = holeR * 0.09;
      ctx.beginPath();
      ctx.arc(cx, cy, holeR * 1.06, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 244, 214, 0.55)";
      ctx.lineWidth = Math.max(1, holeR * 0.02);
      ctx.beginPath();
      ctx.arc(cx, cy, holeR * 1.012, Math.PI * 0.72, Math.PI * 1.38);
      ctx.stroke();
      ctx.restore();
    },

    drawNear(ctx, time) {
      paint(ctx, time, "near");
    },
  };
}

function drawLensedCap(ctx, world, time) {
  const { cx, cy, holeR, reduced } = world;
  const pulse = reduced ? 1 : 0.9 + 0.1 * Math.sin(time * 0.9);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = "screen";
  ctx.rotate(ROLL);

  ctx.beginPath();
  ctx.ellipse(0, -holeR * 0.12, holeR * 1.2, holeR * 0.38, 0, Math.PI * 1.02, Math.PI * 1.98);
  ctx.strokeStyle = `rgba(255, 210, 140, ${0.42 * pulse})`;
  ctx.lineWidth = holeR * 0.16;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, -holeR * 0.02, holeR * 1.08, holeR * 0.3, 0, Math.PI * 1.08, Math.PI * 1.92);
  ctx.strokeStyle = `rgba(255, 244, 210, ${0.7 * pulse})`;
  ctx.lineWidth = holeR * 0.045;
  ctx.stroke();

  const hot = ctx.createRadialGradient(-holeR * 0.55, -holeR * 0.05, 0, -holeR * 0.2, 0, holeR * 1.4);
  hot.addColorStop(0, `rgba(255, 246, 220, ${0.42 * pulse})`);
  hot.addColorStop(0.4, `rgba(255, 160, 70, ${0.16 * pulse})`);
  hot.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = hot;
  ctx.beginPath();
  ctx.ellipse(0, 0, holeR * 1.35, holeR * 0.42, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
