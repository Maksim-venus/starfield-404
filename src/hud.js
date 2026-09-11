function formatClock(t) {
  const total = Math.max(0, t);
  const s = Math.floor(total);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const frac = Math.floor((total % 1) * 10);
  const pad = (n) => String(n).padStart(2, "0");
  return `T+${pad(h)}:${pad(m)}:${pad(sec)}.${frac}`;
}

export function createHud({ reduced }) {
  const state = document.getElementById("sim-state");
  const warp = document.getElementById("sim-warp");
  const zoom = document.getElementById("sim-zoom");
  const clock = document.getElementById("sim-clock");
  const fall = document.getElementById("stat-fall");
  const acc = document.getElementById("stat-acc");
  const coord = document.getElementById("stat-t");

  if (reduced) {
    document.body.classList.add("is-paused");
    state.textContent = "SIM · PAUSED";
  }

  return {
    update({ time, zoom: z, count, warping }) {
      const warpVal = reduced ? 0 : warping ? 8 : 1;
      warp.textContent = `×${warpVal.toFixed(1)}`;
      zoom.textContent = `${z.toFixed(2)}×`;
      clock.textContent = formatClock(time);
      fall.textContent = `${String(count).padStart(3, "0")} w`;
      const accBase = 2.64e-6 + Math.sin(time * 0.27) * 1.4e-7;
      const accNow = accBase * (warping ? 3.2 : 1);
      acc.textContent = `${accNow.toExponential(2)} M☉/yr`;
      coord.textContent = `${(time * 1.15e3).toExponential(2)} s`;
    },
  };
}
