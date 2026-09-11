/**
 * Smoothed pointer in both pixel space and normalized [-1, 1] space.
 * Touch and mouse share the same path so drag feels identical.
 */
export function createPointer(element) {
  const state = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    px: 0,
    py: 0,
    down: false,
    active: false,
  };

  const setFromClient = (clientX, clientY) => {
    const rect = element.getBoundingClientRect();
    state.px = clientX;
    state.py = clientY;
    state.tx = ((clientX - rect.left) / rect.width) * 2 - 1;
    state.ty = ((clientY - rect.top) / rect.height) * 2 - 1;
    state.active = true;
  };

  const onPointerMove = (event) => {
    setFromClient(event.clientX, event.clientY);
  };

  const onPointerDown = (event) => {
    state.down = true;
    element.setPointerCapture?.(event.pointerId);
    setFromClient(event.clientX, event.clientY);
  };

  const onPointerUp = () => {
    state.down = false;
  };

  const onLeave = () => {
    state.down = false;
    state.tx *= 0.35;
    state.ty *= 0.35;
  };

  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointerup", onPointerUp);
  element.addEventListener("pointercancel", onPointerUp);
  element.addEventListener("pointerleave", onLeave);

  return {
    state,
    update() {
      state.x += (state.tx - state.x) * 0.07;
      state.y += (state.ty - state.y) * 0.07;
    },
  };
}
