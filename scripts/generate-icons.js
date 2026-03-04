// Generate PNG icons and OG image using sharp
// Run: npx --yes sharp-cli or node with sharp
// Alternative: This script generates SVG files that can be used directly

const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const iconsDir = path.join(publicDir, "icons");

// Ensure directories exist
fs.mkdirSync(iconsDir, { recursive: true });

function iconSVG(size) {
  const r = Math.round(size * 0.21);
  const fontSize = Math.round(size * 0.7);
  const yOffset = Math.round(size * 0.74);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ECDC4"/>
      <stop offset="100%" stop-color="#44B09E"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <text x="${size/2}" y="${yOffset}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="800" fill="#000">D</text>
</svg>`;
}

function ogImageSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07070a"/>
      <stop offset="50%" stop-color="#0d0d14"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
    <linearGradient id="icon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ECDC4"/>
      <stop offset="100%" stop-color="#44B09E"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="48%" r="30%">
      <stop offset="0%" stop-color="rgba(78,205,196,0.12)"/>
      <stop offset="100%" stop-color="rgba(78,205,196,0)"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <!-- Icon -->
  <rect x="100" y="200" width="80" height="80" rx="17" fill="url(#icon-bg)"/>
  <text x="140" y="250" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="56" font-weight="800" fill="#000">D</text>
  <!-- Title -->
  <text x="204" y="252" font-family="Arial,Helvetica,sans-serif" font-size="64" font-weight="700" fill="#e8e8ec">DayStack</text>
  <!-- Beta badge -->
  <rect x="620" y="222" width="80" height="32" rx="8" fill="rgba(78,205,196,0.2)"/>
  <text x="660" y="244" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="700" fill="#4ECDC4">BETA</text>
  <!-- Tagline -->
  <text x="100" y="340" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="#888">Stack your day, own your time.</text>
  <!-- Description -->
  <text x="100" y="395" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#555">タイマーで1日の仕事を記録し、時間配分を可視化するワークログアプリ</text>
  <!-- Color bar -->
  <rect x="100" y="560" width="160" height="12" rx="6" fill="#FF6B6B"/>
  <rect x="264" y="560" width="160" height="12" rx="6" fill="#4ECDC4"/>
  <rect x="428" y="560" width="160" height="12" rx="6" fill="#FFE66D"/>
  <rect x="592" y="560" width="160" height="12" rx="6" fill="#A8E6CF"/>
  <rect x="756" y="560" width="160" height="12" rx="6" fill="#DDA0DD"/>
  <rect x="920" y="560" width="160" height="12" rx="6" fill="#87CEEB"/>
</svg>`;
}

// Write SVG icon (used as favicon and general icon)
fs.writeFileSync(path.join(iconsDir, "icon.svg"), iconSVG(512));
console.log("Generated icon.svg");

// Write OG image as SVG (will convert to PNG)
fs.writeFileSync(path.join(publicDir, "og-image.svg"), ogImageSVG());
console.log("Generated og-image.svg");

// Now try to convert to PNG using sharp
async function convertWithSharp() {
  try {
    const sharp = require("sharp");

    // Generate PNGs from SVG
    for (const size of [192, 512]) {
      const svgBuf = Buffer.from(iconSVG(size));
      await sharp(svgBuf).resize(size, size).png().toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      console.log(`Generated icon-${size}x${size}.png`);
    }

    // Apple touch icon
    const svg180 = Buffer.from(iconSVG(180));
    await sharp(svg180).resize(180, 180).png().toFile(path.join(iconsDir, "apple-touch-icon.png"));
    console.log("Generated apple-touch-icon.png");

    // OG image
    const ogSvg = Buffer.from(ogImageSVG());
    await sharp(ogSvg).resize(1200, 630).png().toFile(path.join(publicDir, "og-image.png"));
    console.log("Generated og-image.png");

    // Favicon
    const svg32 = Buffer.from(iconSVG(32));
    await sharp(svg32).resize(32, 32).png().toFile(path.join(publicDir, "favicon.ico"));
    console.log("Generated favicon.ico");

    return true;
  } catch (e) {
    console.log("sharp not available, using SVG files only");
    return false;
  }
}

convertWithSharp().then((ok) => {
  if (!ok) {
    console.log("Install sharp to generate PNGs: npm install --save-dev sharp");
    console.log("SVG files have been generated and can be used directly.");
  }
  console.log("Done!");
});
