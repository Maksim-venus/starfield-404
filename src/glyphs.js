const FLATTEN = 0.34;
const ROLL = -0.16;

function project(radius, angle, incline) {
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  const flat = FLATTEN + incline * 0.5;
  const sx = x * Math.cos(ROLL) - y * flat * Math.sin(ROLL);
  const sy = x * Math.sin(ROLL) + y * flat * Math.cos(ROLL);
  return { sx, sy, depth: -y };
}

function spawnGlyphs(world) {
  const glyphs = [];
  const holeR = world.holeR;
  const inner = holeR * 1.55;
  const outer = holeR * (world.mobile ? 6.4 : 7.6);
  const arms = 3;
  const perArm = world.mobile ? 22 : 42;

  for (let arm = 0; arm < arms; arm++) {
    for (let i = 0; i < perArm; i++) {
      const t = i / (perArm - 1);
      const spiral = inner + (outer - inner) * Math.pow(t, 0.78);
      const a = t * Math.PI * 3.4 + arm * ((Math.PI * 2) / arms);
      glyphs.push(makeGlyph(spiral, a, t, holeR, "w", i % 5 === 0));
    }
  }

  const halo = world.mobile ? 18 : 28;
  for (let i = 0; i < halo; i++) {
    const a = (i / halo) * Math.PI * 2;
    glyphs.push(makeGlyph(holeR * 2.15, a, 0.35, holeR, i % 7 === 0 ? "www" : "w", i % 3 === 0));
  }

  const scatter = world.mobile ? 16 : 30;
  for (let i = 0; i < scatter; i++) {
    const t = Math.random();
    glyphs.push(
      makeGlyph(
        inner + (outer - inner) * (0.35 + t * 0.65),
        Math.random() * Math.PI * 2,
        t,
        holeR,
        i % 11 === 0 ? "ww" : "w",
        i % 4 === 0,
      ),
    );
    glyphs[glyphs.length - 1].incline = (Math.random() - 0.5) * 0.9;
  }

  return glyphs;
}

function makeGlyph(r, a, t, holeR, ch, tracked) {
  return {
    r,
    a,
    ch,
    home: r,
    incline: 0,
    w: (0.22 + Math.random() * 0.16) * Math.pow((holeR * 1.7) / r, 1.35),
    fall: 6 + Math.random() * 18 * (0.35 + t),
    size: 13 + (1 - t) * 16 + (ch.length > 1 ? 4 : 0),
    phase: Math.random() * Math.PI * 2,
    trail: tracked ? [] : null,
    vector: tracked,
  };
}

export function createGlyphs(world) {
  const glyphs = spawnGlyphs(world);

  const each = (fn) => {
    for (const g of glyphs) {
      const { sx, sy, depth } = project(g.r, g.a, g.incline);
      fn(g, sx, sy, depth);
    }
  };

  return {
    count() {
      return glyphs.length;
    },

    update(dt, pointer) {
      const { cx, cy, holeR, zoom } = world;
      const outer = holeR * 7.4;
      const tug = pointer.down ? 2.1 : 1;
      const z = zoom || 1;
      const wx = cx + (pointer.px - cx) / z;
      const wy = cy + (pointer.py - cy) / z;

      each((g, sx, sy) => {
        g.a += g.w * dt * (pointer.down ? 1.45 : 1);
        g.r -= g.fall * dt * 0.35 * tug;

        if (pointer.active) {
          const dx = wx - (cx + sx);
          const dy = wy - (cy + sy);
          const dist = Math.hypot(dx, dy);
          if (dist < 200 / z) {
            const k = 1 - dist / (200 / z);
            g.r -= k * 36 * dt * (pointer.down ? 1.8 : 1);
            g.a += k * 0.55 * dt;
          }
        }

        if (g.trail) {
          g.trail.push({ x: sx, y: sy });
          if (g.trail.length > 16) g.trail.shift();
        }

        if (g.r < holeR * 1.04) {
          g.r = outer * (0.72 + Math.random() * 0.34);
          g.a = Math.random() * Math.PI * 2;
          g.ch = Math.random() > 0.9 ? "www" : "w";
          if (g.trail) g.trail.length = 0;
        }
      });
    },

    drawTrails(ctx) {
      if (world.reduced) return;
      const { cx, cy, zoom } = world;
      const z = zoom || 1;
      ctx.save();
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      each((g) => {
        if (!g.trail || g.trail.length < 2) return;
        ctx.beginPath();
        g.trail.forEach((p, i) => {
          const x = cx + p.x * z;
          const y = cy + p.y * z;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = "rgba(143, 212, 255, 0.22)";
        ctx.stroke();
      });
      ctx.restore();
    },

    draw(ctx, time, _pointer, side) {
      const { cx, cy, holeR, reduced, zoom } = world;
      const z = zoom || 1;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      each((g, sx, sy, depth) => {
        const far = depth < 0;
        if (side === "far" && !far) return;
        if (side === "near" && far) return;

        const x = cx + sx * z;
        const y = cy + sy * z;
        const closeness = Math.max(0, 1 - (g.r - holeR) / (holeR * 5.5));
        const fade = Math.min(1, (g.r - holeR * 1.02) / (holeR * 0.55));
        const twinkle = reduced ? 1 : 0.86 + 0.14 * Math.sin(time * 1.5 + g.phase);
        const gold = 0.35 + closeness * 0.65;
        const r = Math.round(232 + 23 * gold);
        const gg = Math.round(214 - 70 * gold);
        const b = Math.round(196 - 120 * gold);
        const alpha = (far ? 0.5 : 0.9) * fade * twinkle;
        if (alpha < 0.03) return;

        if (g.vector && !far && !reduced) {
          const len = (10 + closeness * 14) * z;
          const vx = -Math.sin(g.a) * len;
          const vy = Math.cos(g.a) * FLATTEN * len;
          ctx.strokeStyle = `rgba(143, 212, 255, ${0.28 * fade})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + vx, y + vy);
          ctx.stroke();
        }

        const size = g.size * z * (0.7 + closeness * 0.55);
        const stretch = 1 + closeness * 1.15;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(g.a * 0.2);
        ctx.scale(stretch, 1 / Math.sqrt(stretch));
        ctx.font = `400 ${size}px Outfit, "Segoe UI", sans-serif`;
        ctx.fillStyle = `rgba(${r},${gg},${b},${alpha})`;
        ctx.fillText(g.ch, 0, 0);
        ctx.restore();
      });

      ctx.restore();
    },
  };
}
