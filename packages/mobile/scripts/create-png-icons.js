const fs = require('fs');
const path = require('path');

// Create simple PNG files using base64 encoded data
// These are minimal viable icons to get Expo running

// Simple 1024x1024 green icon with "1000" text (base64 encoded PNG)
const iconPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Function to create a simple colored PNG (1x1 pixel, will be scaled by system)
const createMinimalPNG = (filename, width = 1024, height = 1024) => {
  // This creates a minimal 1x1 transparent PNG that can be used as a placeholder
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  // PNG signature
    0x00, 0x00, 0x00, 0x0D,  // IHDR chunk size
    0x49, 0x48, 0x44, 0x52,  // IHDR
    0x00, 0x00, 0x00, 0x01,  // width = 1
    0x00, 0x00, 0x00, 0x01,  // height = 1
    0x08, 0x02,              // bit depth = 8, color type = 2 (RGB)
    0x00, 0x00, 0x00,        // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE,  // CRC
    0x00, 0x00, 0x00, 0x0C,  // IDAT chunk size
    0x49, 0x44, 0x41, 0x54,  // IDAT
    0x08, 0x99,              // compression header
    0x01, 0x01, 0x00,        // data
    0x00, 0xFF, 0x00,        // RGB values (green)
    0x00, 0x00, 0x02, 0x00, 0x01,
    0x02, 0x9A, 0x07, 0xA4,  // CRC and end
    0x00, 0x00, 0x00, 0x00,  // IEND chunk size
    0x49, 0x45, 0x4E, 0x44,  // IEND
    0xAE, 0x42, 0x60, 0x82   // CRC
  ]);
  
  fs.writeFileSync(path.join(__dirname, '../assets', filename), pngBuffer);
  console.log(`Created minimal PNG: ${filename}`);
};

// Create a better approach: use HTML Canvas to PNG conversion via data URL
const createCanvasPNG = (filename, width, height, content) => {
  // Since we can't use Canvas in Node without additional packages,
  // let's create a simple SVG and provide conversion instructions
  
  const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#2E7D32"/>
    <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width,height)/3}" fill="#1B5E20" stroke="#4CAF50" stroke-width="8"/>
    <text x="${width/2}" y="${height/2 - 30}" font-family="Arial, sans-serif" font-size="${width/12}" font-weight="bold" text-anchor="middle" fill="white">1000</text>
    <text x="${width/2}" y="${height/2 + 40}" font-family="Arial, sans-serif" font-size="${width/20}" font-weight="600" text-anchor="middle" fill="white" letter-spacing="2px">RAVIER</text>
  </svg>`;
  
  // Save as SVG first
  const svgFilename = filename.replace('.png', '.svg');
  fs.writeFileSync(path.join(__dirname, '../assets', svgFilename), svgContent);
  console.log(`Created SVG for conversion: ${svgFilename} (${width}x${height})`);
  
  return svgFilename;
};

console.log('Creating temporary icon files...\n');

// Create the required icon files
createCanvasPNG('icon.png', 1024, 1024);
createCanvasPNG('adaptive-icon.png', 1024, 1024);
createCanvasPNG('splash.png', 1284, 2778);
createCanvasPNG('notification-icon.png', 96, 96);
createCanvasPNG('favicon.png', 32, 32);

console.log('\n=== IMPORTANT ===');
console.log('SVG files have been created. You need to convert them to PNG:');
console.log('\n1. Quick online conversion:');
console.log('   - Go to https://svgtopng.com/');
console.log('   - Upload each SVG file from ./assets/');
console.log('   - Download as PNG with the same filename');
console.log('\n2. Or use any image editor:');
console.log('   - Open the SVG files');
console.log('   - Export/Save As PNG');
console.log('\n3. Alternative: Use GIMP (free):');
console.log('   - File > Open > Select SVG');
console.log('   - File > Export As > Choose PNG');

console.log('\nOnce you have PNG files, your Expo app should run without icon errors!');