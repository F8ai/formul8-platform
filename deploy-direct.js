#!/usr/bin/env node

// Direct deployment script that bypasses all Replit detection issues
console.log('🚀 Direct deployment starting...');

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

try {
  // Build frontend only - simplest approach
  console.log('📦 Building frontend...');
  execSync('npx vite build client --mode production', { stdio: 'inherit' });
  
  // Create simple start script
  writeFileSync('deploy-start.js', `
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ Server running on port \${PORT}\`);
});
`);

  console.log('✅ Direct deployment ready');
  console.log('🎯 Use: node deploy-start.js');
} catch (error) {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
}