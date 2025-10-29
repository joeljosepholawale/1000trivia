const fs = require('fs');
const path = require('path');

// This script helps generate the required icon files
// Since we don't have imagemagick or other tools, we'll provide instructions

console.log('=== 1000 Ravier Icon Generation ===\n');

console.log('The SVG icon has been created at: ./assets/icon.svg\n');

console.log('To generate the required PNG files, you have several options:\n');

console.log('OPTION 1: Use online converter (Recommended)');
console.log('1. Go to https://svgtopng.com/ or https://cloudconvert.com/svg-to-png');
console.log('2. Upload ./assets/icon.svg');
console.log('3. Set dimensions and download:');
console.log('   - icon.png: 1024x1024px');
console.log('   - adaptive-icon.png: 1024x1024px');
console.log('   - splash.png: 1284x2778px (iPhone 14 Pro Max)');
console.log('   - notification-icon.png: 96x96px');
console.log('   - favicon.png: 32x32px\n');

console.log('OPTION 2: Use Expo Icon Generator');
console.log('1. Run: npx @expo/image-utils generate-icons ./assets/icon.svg');
console.log('2. This will generate all required sizes automatically\n');

console.log('OPTION 3: Use Node.js with sharp (if you have it)');
console.log('1. npm install sharp');
console.log('2. Run this script with sharp conversion enabled\n');

console.log('OPTION 4: Manual creation with any image editor');
console.log('1. Open ./assets/icon.svg in any vector editor');
console.log('2. Export/save as PNG with the required dimensions\n');

// Create placeholder PNGs with data URIs (simple colored squares)
const createPlaceholderIcon = (size, filename) => {
  const svgContent = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#2E7D32"/>
      <text x="${size/2}" y="${size/2 - 20}" font-family="Arial" font-size="${size/12}" fill="white" text-anchor="middle" font-weight="bold">1000</text>
      <text x="${size/2}" y="${size/2 + 20}" font-family="Arial" font-size="${size/20}" fill="white" text-anchor="middle">RAVIER</text>
    </svg>
  `;
  
  fs.writeFileSync(path.join(__dirname, '../assets', `${filename}.svg`), svgContent.trim());
  console.log(`Created placeholder: ${filename}.svg (${size}x${size})`);
};

// Create placeholder SVGs for different sizes
createPlaceholderIcon(1024, 'icon-placeholder');
createPlaceholderIcon(1024, 'adaptive-icon-placeholder');
createPlaceholderIcon(96, 'notification-icon-placeholder');
createPlaceholderIcon(32, 'favicon-placeholder');

// Create splash screen SVG
const splashSvg = `
<svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="#2E7D32"/>
  <circle cx="642" cy="1389" r="200" fill="#1B5E20" stroke="#388E3C" stroke-width="4"/>
  <text x="642" y="1350" font-family="Arial" font-size="80" fill="white" text-anchor="middle" font-weight="bold">1000</text>
  <text x="642" y="1420" font-family="Arial" font-size="40" fill="white" text-anchor="middle" letter-spacing="4px">RAVIER</text>
</svg>
`;

fs.writeFileSync(path.join(__dirname, '../assets/splash-placeholder.svg'), splashSvg.trim());
console.log('Created placeholder: splash-placeholder.svg (1284x2778)');

console.log('\n=== Next Steps ===');
console.log('1. Convert the SVG files to PNG using one of the options above');
console.log('2. Replace the placeholder files with your converted PNGs');
console.log('3. Update app.json to reference the new PNG files');
console.log('4. Test with: expo start');

console.log('\nFiles created:');
console.log('- ./assets/icon.svg (main icon)');
console.log('- ./assets/icon-placeholder.svg');
console.log('- ./assets/adaptive-icon-placeholder.svg');
console.log('- ./assets/notification-icon-placeholder.svg');
console.log('- ./assets/favicon-placeholder.svg');
console.log('- ./assets/splash-placeholder.svg');