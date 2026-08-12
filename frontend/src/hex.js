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

      // Wave phase for the idle shimmer: mostly position-driven (left -> right)
      // with a little per-LED jitter for a gentle twinkle.
      const wavePhase = (cx / size + (Math.random() - 0.5) * 0.16 + 1) % 1;

      // Colour-blind cue geometry: checker parity + membership in a large X.
      const parity = (((r + c) % 2) + 2) % 2;
      const onX = Math.min(Math.abs(dx - dy), Math.abs(dx + dy)) / Math.SQRT2 < R * 1.15;

      hexes.push({
        id: idx++,
        points: hexPoints(cx, cy, drawR),
        opacity: Number(opacity.toFixed(3)),
        wavePhase: Number(wavePhase.toFixed(3)),
        parity,
        onX,
      });
    }
  }

  return { hexes, center, CR, R };
}
