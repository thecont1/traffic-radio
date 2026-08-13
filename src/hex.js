import { CONFIG } from './config';

// Build the polygon "points" string for a single pointy-top hexagon.
function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 90); // -90 => vertex straight up
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

// -----------------------------------------------------------------------------
// Generate a dense, regular honeycomb of pointy-top hexagons that fills a circle
// of the given pixel `size`. Hexagons whose centre falls inside the circle are
// kept; anything spilling over the edge is trimmed by the circular clip-path in
// the renderer, so no hexagon ever visibly extends outside the circle.
// -----------------------------------------------------------------------------
export function generateHexGrid(size, density = CONFIG.LED_DENSITY, gap = CONFIG.LED_GAP) {
  const center = size / 2;
  const CR = size / 2; // circle radius

  const R = size / (density * Math.sqrt(3)); // hex outer radius
  const width = Math.sqrt(3) * R; // horizontal spacing between columns
  const vStep = 1.5 * R; // vertical spacing between rows
  const drawR = R * (1 - gap); // slightly smaller for visible gaps

  // Precompute wave direction vectors from angle (degrees).
  // 0° = left→right, 90° = top→bottom, 45° = diagonal, etc.
  // Projection of (cx, cy) onto the direction vector, normalised to 0..1
  // across the full extent of the grid.
  const wRad = (CONFIG.WAVE_ANGLE * Math.PI) / 180;
  const wDx = Math.cos(wRad);
  const wDy = Math.sin(wRad);
  const wNorm = size * (Math.abs(wDx) + Math.abs(wDy)); // full projection extent

  const sRad = (CONFIG.SHIMMER_ANGLE * Math.PI) / 180;
  const sDx = Math.cos(sRad);
  const sDy = Math.sin(sRad);
  const sNorm = size * (Math.abs(sDx) + Math.abs(sDy));

  const rows = Math.ceil(size / vStep) + 2;
  const cols = Math.ceil(size / width) + 2;

  const hexes = [];
  let idx = 0;
  for (let r = -1; r < rows; r++) {
    const cy = r * vStep;
    const rowOffset = r % 2 !== 0 ? width / 2 : 0;
    for (let c = -1; c < cols; c++) {
      const cx = c * width + rowOffset;
      const dx = cx - center;
      const dy = cy - center;
      // Keep hexes near/inside the circle; the clip-path cleans the boundary.
      if (Math.sqrt(dx * dx + dy * dy) > CR + R * 0.5) continue;

      const opacity =
        CONFIG.MIN_OPACITY + Math.random() * (CONFIG.MAX_OPACITY - CONFIG.MIN_OPACITY);

      // Wave phase for the idle shimmer: position-driven sweep along the
      // configured SHIMMER_ANGLE, with a little per-LED jitter for a twinkle.
      const sProj = (cx * sDx + cy * sDy) / sNorm;
      const wavePhase = (sProj + (Math.random() - 0.5) * 0.16 + 1) % 1;

      // Spatial switchAt for colour transitions: a clean sweep along the
      // configured WAVE_ANGLE so the new colour fills the circle as a wave
      // front. A small jitter keeps the front from looking perfectly mechanical.
      const wProj = (cx * wDx + cy * wDy) / wNorm;
      const waveDelay = Math.min(
        Math.max(wProj + (Math.random() - 0.5) * CONFIG.WAVE_JITTER, 0),
        1
      );

      // Colour-blind cue geometry: checker parity + membership in a large X.
      const parity = (((r + c) % 2) + 2) % 2;
      const onX = Math.min(Math.abs(dx - dy), Math.abs(dx + dy)) / Math.SQRT2 < R * 1.15;

      hexes.push({
        id: idx++,
        points: hexPoints(cx, cy, drawR),
        opacity: Number(opacity.toFixed(3)),
        wavePhase: Number(wavePhase.toFixed(3)),
        waveDelay: Number(waveDelay.toFixed(3)),
        parity,
        onX,
      });
    }
  }

  return { hexes, center, CR, R };
}
