import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate master SVG string (512x512)
function getSvg({ maskable = false }: { maskable?: boolean } = {}) {
  // Padding for maskable safe zone is 15-20%
  const scale = maskable ? 0.72 : 0.85;
  const transX = 256 * (1 - scale);
  const transY = 256 * (1 - scale);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#232730" />
      <stop offset="50%" stop-color="#191c22" />
      <stop offset="100%" stop-color="#121418" />
    </linearGradient>

    <!-- Droplet Rainbow Gradient -->
    <linearGradient id="rainbowGrad" x1="50%" y1="2%" x2="50%" y2="98%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="14%" stop-color="#eab308" />
      <stop offset="28%" stop-color="#84cc16" />
      <stop offset="42%" stop-color="#10b981" />
      <stop offset="58%" stop-color="#06b6d4" />
      <stop offset="78%" stop-color="#2563eb" />
      <stop offset="92%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>

    <!-- Specular highlight gradient -->
    <radialGradient id="highlightGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65" />
      <stop offset="40%" stop-color="#a7f3d0" stop-opacity="0.35" />
      <stop offset="75%" stop-color="#38bdf8" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>

    <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.5" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#06b6d4" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Background Container -->
  ${
    maskable
      ? `<rect width="512" height="512" fill="url(#bgGrad)" />`
      : `<rect width="512" height="512" rx="112" fill="url(#bgGrad)" stroke="#333842" stroke-width="3" />`
  }

  <!-- Droplet Graphic centered with transform -->
  <g transform="translate(${transX}, ${transY}) scale(${scale})" filter="url(#shadowFilter)">
    <!-- Droplet Base -->
    <path
      d="M 256,64 
         C 256,64 120,224 120,332 
         A 136,136 0 0 0 392,332 
         C 392,224 256,64 256,64 Z"
      fill="url(#rainbowGrad)"
    />

    <!-- Internal subtle lighting & glassy reflection -->
    <ellipse
      cx="182"
      cy="276"
      rx="38"
      ry="68"
      transform="rotate(-18 182 276)"
      fill="url(#highlightGrad)"
    />

    <!-- Top apex micro highlight -->
    <ellipse
      cx="256"
      cy="106"
      rx="7"
      ry="14"
      fill="#ffffff"
      opacity="0.4"
    />
  </g>
</svg>`;
}

async function run() {
  const standardSvg = getSvg({ maskable: false });
  const maskableSvg = getSvg({ maskable: true });

  // Save standalone favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSvg);

  const targets = [
    { name: 'icon-16.png', size: 16, svg: standardSvg },
    { name: 'icon-32.png', size: 32, svg: standardSvg },
    { name: 'icon-152.png', size: 152, svg: standardSvg },
    { name: 'icon-180.png', size: 180, svg: standardSvg },
    { name: 'apple-touch-icon.png', size: 180, svg: standardSvg },
    { name: 'icon-192.png', size: 192, svg: standardSvg },
    { name: 'icon-512.png', size: 512, svg: standardSvg },
    { name: 'icon-maskable-192.png', size: 192, svg: maskableSvg },
    { name: 'icon-maskable-512.png', size: 512, svg: maskableSvg },
  ];

  for (const t of targets) {
    const dest = path.join(publicDir, t.name);
    await sharp(Buffer.from(t.svg))
      .resize(t.size, t.size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(dest);
    console.log(`Generated ${t.name} (${t.size}x${t.size})`);
  }
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
