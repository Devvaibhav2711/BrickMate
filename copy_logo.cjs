const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\vaibhav nimbalkar\\.gemini\\antigravity\\brain\\80d028cb-2ee1-4321-9427-455ea6444b28\\uploaded_image_1766911776943.png";
const dest = path.join(__dirname, 'public', 'logo-new.png');

try {
  fs.copyFileSync(src, dest);
  console.log('Logo copied successfully to ' + dest);
} catch (err) {
  console.error('Error copying logo:', err);
  process.exit(1);
}
