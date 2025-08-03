#!/usr/bin/env node

import { spawn } from 'child_process';

// Auto-confirm database migrations by piping 'y' responses
const dbPush = spawn('npm', ['run', 'db:push'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Send confirmation responses for any prompts
dbPush.stdin.write('1\n'); // Select "create table" option
dbPush.stdin.write('y\n'); // Confirm the changes
dbPush.stdin.end();

dbPush.on('close', (code) => {
  console.log(`Database push completed with exit code ${code}`);
  process.exit(code);
});