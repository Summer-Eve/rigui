// A shared desktop-home coordinate system; the mobile and scrollable pages keep
// their existing layouts. No save, currency or draw code is involved.
export const HOME_STAGE = Object.freeze({ width: 1440, height: 810 });

export function fitHomeStage(width, height) {
  if (![width, height].every(n => Number.isFinite(n) && n > 0)) return null;
  const scale = Math.min(width / HOME_STAGE.width, height / HOME_STAGE.height);
  return { scale, left: (width - HOME_STAGE.width * scale) / 2,
    top: (height - HOME_STAGE.height * scale) / 2 };
}

export function installHomeStage(app, win = window) {
  const root = app.ownerDocument.documentElement;
  const desktopPointer = win.matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  function sync() {
    frame = 0;
    const active = desktopPointer.matches && Boolean(app.querySelector('.demo-shell'));
    root.classList.toggle('desktop-home-fit', active);
    if (!active) return;
    // A narrow desktop window is not a portrait phone. Keep the desktop stage
    // unrotated without touching any coarse-pointer mobile orientation behavior.
    root.classList.remove('soft-landscape');
    const viewport = win.visualViewport;
    const fit = fitHomeStage(viewport?.width || win.innerWidth, viewport?.height || win.innerHeight);
    if (!fit) return; // Preserve the last valid layout while a window is hidden.
    app.style.setProperty('--home-scale', String(fit.scale));
    app.style.setProperty('--home-left', fit.left + 'px');
    app.style.setProperty('--home-top', fit.top + 'px');
  }
  const schedule = () => { if (!frame) frame = win.requestAnimationFrame(sync); };
  const observer = new win.MutationObserver(schedule);
  observer.observe(app, { childList: true });
  const orientation = new win.MutationObserver(() => {
    if (desktopPointer.matches && root.classList.contains('soft-landscape')) schedule();
  });
  orientation.observe(root, { attributes: true, attributeFilter: ['class'] });
  win.addEventListener('resize', schedule);
  win.visualViewport?.addEventListener('resize', schedule);
  app.ownerDocument.addEventListener('visibilitychange', schedule);
  desktopPointer.addEventListener?.('change', schedule);
  sync();
  return () => {
    observer.disconnect(); orientation.disconnect(); win.cancelAnimationFrame(frame);
    win.removeEventListener('resize', schedule);
    win.visualViewport?.removeEventListener('resize', schedule);
    app.ownerDocument.removeEventListener('visibilitychange', schedule);
    desktopPointer.removeEventListener?.('change', schedule);
    root.classList.remove('desktop-home-fit');
  };
}

if (typeof document !== 'undefined') {
  const app = document.getElementById('app');
  if (app) installHomeStage(app);
}
