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

function starColor(rand) {
  const roll = rand();
  if (roll < 0.12) return [210, 226, 255];
  if (roll < 0.2) return [255, 226, 190];
  if (roll < 0.26) return [255, 196, 170];
  return [236, 238, 255];
}

export function createStarfield(world) {
  const rand = mulberry32(0x777777);
  const stars = [];
  const nebulae = [];

  const count = world.mobile ? 480 : 1100;
  for (let i = 0; i < count; i++) {
    const depth = 0.15 + rand() * 0.85;
    stars.push({
      nx: (rand() - 0.5) * 3.4,
      ny: (rand() - 0.5) * 3.4,
      depth,
      size: (0.35 + rand() * 1.35) * (1.15 - depth * 0.4),
      phase: rand() * Math.PI * 2,
      twinkle: 0.35 + rand() * 1.8,
      rgb: starColor(rand),
      flare: rand() > 0.975,
    });
  }

  for (let i = 0; i < 6; i++) {
    nebulae.push({
      nx: (rand() - 0.5) * 1.4,
      ny: (rand() - 0.5) * 1.1,
      radius: 0.55 + rand() * 0.55,
      rgb:
        i % 2 === 0
          ? [48, 22, 92]
          : i === 1
            ? [18, 40, 88]
            : [72, 18, 54],
      alpha: 0.08 + rand() * 0.07,
      drift: 0.04 + rand() * 0.05,
      phase: rand() * Math.PI * 2,
      depth: 0.35 + rand() * 0.5,
    });
  }

  return {
    draw(ctx, time, pointer) {
      const { w, h, cx, cy, zoom } = world;
      const parallax = world.reduced ? 0 : 1;
      const span = Math.hypot(w, h);
      const z = zoom || 1;

      ctx.fillStyle = "#030208";
      ctx.fillRect(0, 0, w, h);

      const space = ctx.createRadialGradient(cx, cy, 8, cx, cy, span);
      space.addColorStop(0, "#12081c");
      space.addColorStop(0.32, "#070614");
      space.addColorStop(1, "#020106");
      ctx.fillStyle = space;
      ctx.fillRect(0, 0, w, h);

      for (const cloud of nebulae) {
        const cam = 1 + (z - 1) * (0.25 + 0.4 * (1 - cloud.depth));
        const ox = pointer.x * 18 * parallax;
        const oy = pointer.y * 12 * parallax;
        const pulse = world.reduced ? 1 : 0.85 + 0.15 * Math.sin(time * cloud.drift + cloud.phase);
        const x = cx + cloud.nx * w * cam + ox;
        const y = cy + cloud.ny * h * cam + oy;
        const r = cloud.radius * span;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const [cr, cg, cb] = cloud.rgb;
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${cloud.alpha * pulse})`);
        g.addColorStop(0.55, `rgba(${cr},${cg},${cb},${cloud.alpha * 0.28 * pulse})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const star of stars) {
        const cam = 1 + (z - 1) * (0.28 + 0.72 * (1 - star.depth));
        const shift = (1.15 - star.depth) * 26 * parallax;
        const x = cx + star.nx * span * cam + pointer.x * shift;
        const y = cy + star.ny * span * cam + pointer.y * shift * 0.72;
        if (x < -8 || y < -8 || x > w + 8 || y > h + 8) continue;

        const twinkle = world.reduced
          ? 0.82
          : 0.55 + 0.45 * Math.sin(time * star.twinkle + star.phase);
        const alpha = (0.28 + 0.72 * (1 - star.depth)) * twinkle;
        const [r, g, b] = star.rgb;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;

        if (star.flare && star.size > 0.9) {
          const spike = (4.5 + star.size * 3) * Math.min(1.4, 0.7 + z * 0.3);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.55})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x - spike, y);
          ctx.lineTo(x + spike, y);
          ctx.moveTo(x, y - spike * 0.7);
          ctx.lineTo(x, y + spike * 0.7);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, star.size * (0.75 + z * 0.25), 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
