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
      glyphs.push(makeGlyph(spiral, a, t, holeR, "w"));
    }
  }

  const halo = world.mobile ? 18 : 28;
  for (let i = 0; i < halo; i++) {
    const a = (i / halo) * Math.PI * 2;
    glyphs.push(makeGlyph(holeR * 2.15, a, 0.35, holeR, i % 7 === 0 ? "www" : "w"));
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
      ),
    );
    glyphs[glyphs.length - 1].incline = (Math.random() - 0.5) * 0.9;
  }

  return glyphs;
}

function makeGlyph(r, a, t, holeR, ch) {
  return {
    r,
    a,
    ch,
    home: r,
    incline: 0,
    w: (0.22 + Math.random() * 0.16) * Math.pow((holeR * 1.7) / r, 1.35),
    fall: 6 + Math.random() * 18 * (0.35 + t),
    size: 11 + (1 - t) * 17 + (ch.length > 1 ? 4 : 0),
    phase: Math.random() * Math.PI * 2,
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
    update(dt, pointer) {
      const { cx, cy, holeR } = world;
      const outer = holeR * 7.4;
      const tug = pointer.down ? 2.1 : 1;

      each((g, sx, sy) => {
        g.a += g.w * dt * (pointer.down ? 1.45 : 1);
        g.r -= g.fall * dt * 0.35 * tug;

        if (pointer.active) {
          const dx = pointer.px - (cx + sx);
          const dy = pointer.py - (cy + sy);
          const dist = Math.hypot(dx, dy);
          if (dist < 200) {
            const k = 1 - dist / 200;
            g.r -= k * 36 * dt * (pointer.down ? 1.8 : 1);
            g.a += k * 0.55 * dt;
          }
        }

        if (g.r < holeR * 1.04) {
          g.r = outer * (0.72 + Math.random() * 0.34);
          g.a = Math.random() * Math.PI * 2;
          g.ch = Math.random() > 0.9 ? "www" : "w";
        }
      });
    },

    draw(ctx, time, _pointer, side) {
      const { cx, cy, holeR, reduced } = world;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      each((g, sx, sy, depth) => {
        const far = depth < 0;
        if (side === "far" && !far) return;
        if (side === "near" && far) return;

        const x = cx + sx;
        const y = cy + sy;
        const closeness = Math.max(0, 1 - (g.r - holeR) / (holeR * 5.5));
        const fade = Math.min(1, (g.r - holeR * 1.02) / (holeR * 0.55));
        const twinkle = reduced ? 1 : 0.86 + 0.14 * Math.sin(time * 1.5 + g.phase);
        const gold = 0.35 + closeness * 0.65;
        const r = Math.round(232 + 23 * gold);
        const gg = Math.round(214 - 70 * gold);
        const b = Math.round(196 - 120 * gold);
        const alpha = (far ? 0.38 : 0.78) * fade * twinkle;
        if (alpha < 0.03) return;

        const size = g.size * (0.7 + closeness * 0.55);
        const stretch = 1 + closeness * 1.35;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(g.a * 0.35 + depth * 0.0004);
        ctx.scale(stretch, 1 / Math.sqrt(stretch));
        ctx.font = `italic ${size}px "Cormorant Garamond", Georgia, "Times New Roman", serif`;
        if (!far && closeness > 0.45) {
          ctx.shadowColor = `rgba(255, 180, 90, ${0.35 * closeness})`;
          ctx.shadowBlur = 14 * closeness;
        }
        ctx.fillStyle = `rgba(${r},${gg},${b},${alpha})`;
        ctx.fillText(g.ch, 0, 0);
        ctx.restore();
      });

      ctx.restore();
    },
  };
}
