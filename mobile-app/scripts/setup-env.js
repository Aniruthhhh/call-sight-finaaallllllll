const fs = require('fs');
const path = require('path');

// Read the parent .env file
const parentEnvPath = path.join(__dirname, '../../.env');
const mobileEnvPath = path.join(__dirname, '../.env');

if (fs.existsSync(parentEnvPath)) {
  const envContent = fs.readFileSync(parentEnvPath, 'utf8');
  
  // Convert NEXT_PUBLIC_ to EXPO_PUBLIC_ for mobile compatibility
  const mobileEnvContent = envContent
    .split('\n')
    .map(line => {
      if (line.startsWith('NEXT_PUBLIC_')) {
        return line.replace('NEXT_PUBLIC_', 'EXPO_PUBLIC_');
      }
      return line;
    })
    .join('\n');
  
  fs.writeFileSync(mobileEnvPath, mobileEnvContent);
  console.log('✅ Environment variables synced from parent project');
} else {
  console.warn('⚠️  Parent .env file not found. Please create one in the root directory.');
}
