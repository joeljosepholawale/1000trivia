const fs = require('fs');
const path = require('path');

// Base64 encoded PNG data for different sized green squares
// These are minimal but valid PNG files that Expo can use

// 1x1 green pixel PNG (will be scaled by the system)
const greenPixelPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADBQEF/TcLzwAAAABJRU5ErkJggg==';

// Create PNG files from base64 data
const createPNGFromBase64 = (filename, base64Data) => {
  const buffer = Buffer.from(base64Data, 'base64');
  const filepath = path.join(__dirname, '../assets', filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Created: ${filename} (${buffer.length} bytes)`);
};

console.log('Creating minimal PNG files...\n');

// Create all required PNG files using the minimal green pixel
createPNGFromBase64('icon.png', greenPixelPNG);
createPNGFromBase64('adaptive-icon.png', greenPixelPNG);
createPNGFromBase64('splash.png', greenPixelPNG);
createPNGFromBase64('notification-icon.png', greenPixelPNG);
createPNGFromBase64('favicon.png', greenPixelPNG);

console.log('\n✅ All PNG files created successfully!');
console.log('\nThese are minimal 1x1 pixel PNG files that will:');
console.log('- Allow Expo to start without errors');
console.log('- Be automatically scaled by the system');
console.log('- Show as solid green squares');

console.log('\nTo create proper icons later:');
console.log('1. Use the SVG files in ./assets/ as templates');
console.log('2. Convert them to PNG using any image editor');
console.log('3. Replace these minimal PNG files');

console.log('\nNow you can run: expo start');