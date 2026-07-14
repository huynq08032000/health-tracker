import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(scriptDir, '..', 'public');
mkdirSync(outDir, { recursive: true });

// --- minimal PNG encoder (RGBA, 8-bit) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePng(size, pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter none
    pixels[y].forEach(([r, g, b, a], x) => {
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    });
  }
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// --- drawing helpers ---
const EMERALD = [16, 185, 129];
const WHITE = [255, 255, 255];

function inRoundRect(x, y, s, pad, corner) {
  if (x < pad || x > s - pad || y < pad || y > s - pad) return false;
  const left = pad, right = s - pad, top = pad, bottom = s - pad;
  const checks = [
    [left + corner, top + corner],
    [right - corner, top + corner],
    [left + corner, bottom - corner],
    [right - corner, bottom - corner],
  ];
  const within = (cx, cy) => (x - cx) ** 2 + (y - cy) ** 2 <= corner * corner;
  if (x < left + corner && y < top + corner && !within(left + corner, top + corner)) return false;
  if (x > right - corner && y < top + corner && !within(right - corner, top + corner)) return false;
  if (x < left + corner && y > bottom - corner && !within(left + corner, bottom - corner)) return false;
  if (x > right - corner && y > bottom - corner && !within(right - corner, bottom - corner)) return false;
  return true;
}

function inDroplet(x, y, s, scale = 1) {
  const cx = s / 2;
  const top = s * 0.2;
  const R = s * 0.205 * scale;
  const cy = s * 0.56;
  const dx = x - cx;
  const dy = y - cy;
  if (dx * dx + dy * dy <= R * R) return true;
  const x1 = cx, y1 = top, x2 = cx - R, y2 = cy, x3 = cx + R, y3 = cy;
  const d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / d;
  const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / d;
  const c = 1 - a - b;
  if (a >= 0 && b >= 0 && c >= 0 && y <= cy) return true;
  return false;
}

function render(size, { maskable = false } = {}) {
  const pixels = [];
  const scale = maskable ? 0.8 : 1;
  const pad = maskable ? 0 : size * 0.12;
  const corner = maskable ? 0 : size * 0.22;
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      if (inRoundRect(x, y, size, pad, corner)) {
        row.push([...EMERALD, 255]);
      } else {
        row.push([0, 0, 0, 0]);
      }
    }
    pixels.push(row);
  }
  // droplet on top
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inDroplet(x, y, size, scale)) pixels[y][x] = [...WHITE, 255];
    }
  }
  return encodePng(size, pixels);
}

const targets = [
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-512.png', size: 512 },
  { file: 'maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180 },
];
for (const t of targets) {
  writeFileSync(resolve(outDir, t.file), render(t.size, { maskable: t.maskable }));
  console.log(`[gen-icons] wrote ${t.file} (${t.size}x${t.size})`);
}
