import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create crisp SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#fb7185" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="#334155" stroke-width="4" stroke-opacity="0.4" />

  <!-- Outer Glow Halo -->
  <circle cx="256" cy="256" r="180" fill="#f43f5e" opacity="0.12" filter="url(#glow)" />

  <!-- Center Play / Video Frame Icon -->
  <rect x="96" y="128" width="320" height="230" rx="32" fill="#090d16" stroke="#475569" stroke-width="6" />
  
  <!-- Subtitle Bars -->
  <rect x="144" y="285" width="224" height="20" rx="8" fill="url(#emeraldGrad)" opacity="0.95" />
  <rect x="180" y="318" width="152" height="16" rx="6" fill="#f8fafc" opacity="0.85" />

  <!-- Glowing Play Arrow in center -->
  <polygon points="230,185 230,255 295,220" fill="url(#roseGrad)" filter="url(#glow)" />

  <!-- Sparkle stars -->
  <path d="M 390 110 Q 390 140 420 140 Q 390 140 390 170 Q 390 140 360 140 Q 390 140 390 110" fill="#fbbf24" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

// Helper to generate minimal valid PNG file in pure Node without heavy C++ deps
function createPngBuffer(width, height, isMaskable = false) {
  // Simple uncompressed/zlib raw PNG writer
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Scanlines: each scanline starts with filter byte (0 = none), followed by width * 4 bytes RGBA
  const rawScanlines = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width / 2;
  const contentR = isMaskable ? width * 0.38 : width * 0.44;

  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient from dark slate #0f172a to deep indigo #1e1b4b
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(15 * (1 - gradRatio) + 30 * gradRatio);
      let g = Math.round(23 * (1 - gradRatio) + 27 * gradRatio);
      let b = Math.round(42 * (1 - gradRatio) + 75 * gradRatio);
      let a = 255;

      // Inner icon representation
      // Screen frame box
      const halfW = isMaskable ? width * 0.32 : width * 0.36;
      const halfH = isMaskable ? height * 0.22 : height * 0.25;
      const inBox = Math.abs(dx) <= halfW && Math.abs(dy + height * 0.02) <= halfH;

      if (inBox) {
        // Inner screen #0b0f19
        r = 11;
        g = 15;
        b = 25;

        // Subtitle bar: green/emerald
        const subY1 = cy + halfH * 0.45;
        const subY2 = cy + halfH * 0.75;
        if (y >= subY1 && y <= subY1 + height * 0.035 && Math.abs(dx) <= halfW * 0.75) {
          r = 16;
          g = 185;
          b = 129; // emerald-500
        } else if (y >= subY2 && y <= subY2 + height * 0.028 && Math.abs(dx) <= halfW * 0.5) {
          r = 244;
          g = 63;
          b = 94; // rose-500
        }

        // Center play triangle
        const py = dy - height * 0.05;
        if (Math.abs(py) <= height * 0.09 && dx >= -width * 0.06 && dx <= width * 0.08) {
          const triangleWidthAtY = (height * 0.09 - Math.abs(py)) * 1.5;
          if (dx <= -width * 0.06 + triangleWidthAtY) {
            r = 244;
            g = 63;
            b = 94; // rose-500
          }
        }
      }

      // Rounded squircle corner clipping for non-maskable or subtle edge
      if (!isMaskable && dist > maxR * 0.98) {
        a = 0;
      }

      rawScanlines[offset++] = r;
      rawScanlines[offset++] = g;
      rawScanlines[offset++] = b;
      rawScanlines[offset++] = a;
    }
  }

  // IDAT chunk
  const compressed = zlib.deflateSync(rawScanlines);
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = crc32(crcInput);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Generate PNG files
console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPngBuffer(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPngBuffer(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPngBuffer(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPngBuffer(180, 180, false));
console.log('Icons generated successfully in /public!');
