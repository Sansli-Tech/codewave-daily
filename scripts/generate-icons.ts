import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Standard Icon SVG (viewBox 0 0 100 100)
const standardIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <!-- Dark navy rounded square base -->
  <rect width="100" height="100" rx="22" fill="#0B1220"/>
  
  <!-- Subtle inner gradient sheen -->
  <radialGradient id="navySheen" cx="30%" cy="25%" r="85%">
    <stop offset="0%" stop-color="#141E34"/>
    <stop offset="100%" stop-color="#0B1220"/>
  </radialGradient>
  <rect width="100" height="100" rx="22" fill="url(#navySheen)"/>
  
  <!-- Left Code Bracket "<" -->
  <path d="M 32 33 L 18 50 L 32 67" 
        fill="none" 
        stroke="#38BDF8" 
        stroke-width="7.5" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
        
  <!-- Center Purple Wave -->
  <path d="M 39 52 C 43 45, 47 45, 50 50 C 53 55, 57 55, 61 48" 
        fill="none" 
        stroke="#A855F7" 
        stroke-width="7" 
        stroke-linecap="round"/>
        
  <!-- Right Code Bracket ">" -->
  <path d="M 68 33 L 82 50 L 68 67" 
        fill="none" 
        stroke="#38BDF8" 
        stroke-width="7.5" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
</svg>`;

// Maskable Icon SVG (with ~22% safe-zone margin on #0B1220 background)
const maskableIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <!-- Full-bleed background for Android adaptive icon cropping -->
  <rect width="100" height="100" fill="#0B1220"/>
  
  <!-- Scaled down to safe zone: 65% scale, centered at 50,50 -->
  <g transform="translate(17.5, 17.5) scale(0.65)">
    <!-- Rounded card representation inside safe area -->
    <rect width="100" height="100" rx="22" fill="#141E34"/>
    
    <!-- Left Bracket -->
    <path d="M 32 33 L 18 50 L 32 67" 
          fill="none" 
          stroke="#38BDF8" 
          stroke-width="8" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
          
    <!-- Center Wave -->
    <path d="M 39 52 C 43 45, 47 45, 50 50 C 53 55, 57 55, 61 48" 
          fill="none" 
          stroke="#A855F7" 
          stroke-width="7.5" 
          stroke-linecap="round"/>
          
    <!-- Right Bracket -->
    <path d="M 68 33 L 82 50 L 68 67" 
          fill="none" 
          stroke="#38BDF8" 
          stroke-width="8" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
  </g>
</svg>`;

async function generate() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write SVG icon
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardIconSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardIconSvg.trim());

  // 2. 192x192 PNG
  await sharp(Buffer.from(standardIconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 3. 512x512 PNG
  await sharp(Buffer.from(standardIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 4. Maskable 512x512 PNG (with extra padding)
  await sharp(Buffer.from(maskableIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 5. Apple Touch Icon (180x180)
  await sharp(Buffer.from(standardIconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 6. Favicon 32x32 / 64x64 PNG
  await sharp(Buffer.from(standardIconSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon-64.png'));
  console.log('Generated favicon-64.png');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
