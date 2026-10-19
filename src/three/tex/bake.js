// Bakes a per-texel recipe into raw PBR texture data (no three.js, so it runs
// in a worker):
//   color   RGBA8 sRGB         ← out.color [r,g,b] 0..1, out.alpha 0..1
//   normal  RGBA8 tangent space, derived from out.height 0..1
//   rough   RGBA8, roughness in G (three.js convention) ← out.rough 0..1,
//           height in R so the same texture doubles as a displacementMap

export function bakeArrays({ width = 512, height = width, normal = 1, wrapU = true, wrapV = true, fn }) {
  const n = width * height;
  const color = new Uint8Array(n * 4);
  const rough = new Uint8Array(n * 4);
  const heights = new Float32Array(n);
  const out = { color: [1, 1, 1], height: 0.5, rough: 0.6, alpha: 1 };

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      out.alpha = 1;
      fn(u, v, out);
      const i = y * width + x;
      color[i * 4] = to8(out.color[0]);
      color[i * 4 + 1] = to8(out.color[1]);
      color[i * 4 + 2] = to8(out.color[2]);
      color[i * 4 + 3] = to8(out.alpha);
      rough[i * 4] = to8(out.height);
      rough[i * 4 + 1] = to8(out.rough);
      rough[i * 4 + 2] = 255;
      rough[i * 4 + 3] = 255;
      heights[i] = out.height;
    }
  }

  // Height → normal. Strength is independent of the texture resolution.
  const normals = new Uint8Array(n * 4);
  const k = normal * (width / 64);
  const at = (x, y) => {
    x = wrapU ? (x + width) % width : Math.min(width - 1, Math.max(0, x));
    y = wrapV ? (y + height) % height : Math.min(height - 1, Math.max(0, y));
    return heights[y * width + x];
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.5 * k;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.5 * k;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * width + x) * 4;
      normals[i] = to8((-dx / len) * 0.5 + 0.5);
      normals[i + 1] = to8((-dy / len) * 0.5 + 0.5);
      normals[i + 2] = to8((1 / len) * 0.5 + 0.5);
      normals[i + 3] = 255;
    }
  }

  return { width, height, wrapU, wrapV, color, normals, rough };
}

const to8 = x => (x <= 0 ? 0 : x >= 1 ? 255 : Math.round(x * 255));
