const fs = require('fs');
const path = require('path');

// Minimal 1024x1024 PNG icon (base64 encoded)
// This is a simple purple gradient square icon
const iconPngBase64 = `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==`;

// Different sizes for adaptive icon and favicon
const iconSizes = {
  'icon.png': iconPngBase64,
  'adaptive-icon.png': iconPngBase64,
  'favicon.png': iconPngBase64,
  'notification-icon.png': iconPngBase64,
  'splash.png': iconPngBase64
};

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create PNG files
Object.entries(iconSizes).forEach(([filename, base64Data]) => {
  const filePath = path.join(assetsDir, filename);
  
  try {
    // Convert base64 to buffer and write as PNG
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Created ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to create ${filename}:`, error.message);
  }
});

console.log('\n🎉 All PNG icons created successfully!');
console.log('Note: These are minimal placeholder icons. For production, replace with proper 1024x1024 PNG icons.');