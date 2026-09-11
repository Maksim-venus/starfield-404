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

  const count = world.mobile ? 320 : 780;
  for (let i = 0; i < count; i++) {
    const depth = 0.2 + rand() * 0.8;
    stars.push({
      u: rand(),
      v: rand(),
      depth,
      size: (0.35 + rand() * 1.35) * (1.15 - depth * 0.4),
      phase: rand() * Math.PI * 2,
      twinkle: 0.35 + rand() * 1.8,
      rgb: starColor(rand),
      flare: rand() > 0.975,
    });
  }

  for (let i = 0; i < 5; i++) {
    nebulae.push({
      u: 0.18 + rand() * 0.64,
      v: 0.22 + rand() * 0.5,
      radius: 0.28 + rand() * 0.38,
      rgb:
        i % 2 === 0
          ? [48, 22, 92]
          : i === 1
            ? [18, 40, 88]
            : [72, 18, 54],
      alpha: 0.09 + rand() * 0.07,
      drift: 0.04 + rand() * 0.05,
      phase: rand() * Math.PI * 2,
    });
  }

  return {
    draw(ctx, time, pointer) {
      const { w, h, cx, cy, holeR } = world;
      const parallax = world.reduced ? 0 : 1;

      ctx.fillStyle = "#030208";
      ctx.fillRect(0, 0, w, h);

      const space = ctx.createRadialGradient(cx, cy, holeR * 0.4, cx, cy, Math.max(w, h) * 0.72);
      space.addColorStop(0, "#12081c");
      space.addColorStop(0.35, "#070614");
      space.addColorStop(1, "#020106");
      ctx.fillStyle = space;
      ctx.fillRect(0, 0, w, h);

      for (const cloud of nebulae) {
        const ox = pointer.x * 18 * parallax;
        const oy = pointer.y * 12 * parallax;
        const pulse = world.reduced ? 1 : 0.85 + 0.15 * Math.sin(time * cloud.drift + cloud.phase);
        const x = cloud.u * w + ox;
        const y = cloud.v * h + oy;
        const r = cloud.radius * Math.max(w, h);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const [cr, cg, cb] = cloud.rgb;
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${cloud.alpha * pulse})`);
        g.addColorStop(0.55, `rgba(${cr},${cg},${cb},${cloud.alpha * 0.28 * pulse})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }

      for (const star of stars) {
        const shift = (1.15 - star.depth) * 26 * parallax;
        const x = star.u * w + pointer.x * shift;
        const y = star.v * h + pointer.y * shift * 0.72;
        const twinkle = world.reduced
          ? 0.82
          : 0.55 + 0.45 * Math.sin(time * star.twinkle + star.phase);
        const alpha = (0.28 + 0.72 * (1 - star.depth)) * twinkle;
        const [r, g, b] = star.rgb;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;

        if (star.flare && star.size > 0.9) {
          const spike = 4.5 + star.size * 3;
          ctx.globalAlpha = alpha * 0.55;
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x - spike, y);
          ctx.lineTo(x + spike, y);
          ctx.moveTo(x, y - spike * 0.7);
          ctx.lineTo(x, y + spike * 0.7);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
