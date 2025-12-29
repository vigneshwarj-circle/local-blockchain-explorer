#!/usr/bin/env node

/**
 * Script to start the Vite dev server with command-line arguments
 * Usage: npm run start -- --rpc http://localhost:8551
 */

import { spawn } from 'child_process';

// Parse command-line arguments
const args = process.argv.slice(2);
const env = { ...process.env };

// Parse --rpc argument
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--rpc' && i + 1 < args.length) {
    env.VITE_ERIGON_URL = args[i + 1];
    console.log(`Setting VITE_ERIGON_URL to: ${args[i + 1]}`);
    i++; // Skip the next argument
  } else if (args[i] === '--beacon-api' && i + 1 < args.length) {
    env.VITE_BEACON_API_URL = args[i + 1];
    console.log(`Setting VITE_BEACON_API_URL to: ${args[i + 1]}`);
    i++; // Skip the next argument
  } else if (args[i] === '--assets-url' && i + 1 < args.length) {
    env.VITE_ASSETS_URL = args[i + 1];
    console.log(`Setting VITE_ASSETS_URL to: ${args[i + 1]}`);
    i++; // Skip the next argument
  }
}

// Start Vite with the environment variables
console.log('Starting Vite dev server...\n');
const vite = spawn('vite', [], {
  env,
  stdio: 'inherit',
  shell: true
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});

vite.on('exit', (code) => {
  process.exit(code || 0);
});

