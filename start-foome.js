#!/usr/bin/env node

/**
 * Smart FooMe Launcher
 * Starts the dev server and opens the correct port in browser
 */

const { spawn } = require('child_process');
const { exec } = require('child_process');

console.log('\n====================================');
console.log('  FooMe - Photo to Foo Avatar');
console.log('====================================\n');

// Start the Next.js dev server
console.log('[INFO] Starting FooMe development server...\n');

const devServer = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: 'pipe'
});

let serverStarted = false;
let actualPort = null;

// Listen for output to detect the port
devServer.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output); // Show the output
  
  // Look for the port in Next.js output
  // Example: "- Local:        http://localhost:3002"
  const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
  
  if (portMatch && !serverStarted) {
    actualPort = portMatch[1];
    serverStarted = true;
    
    console.log(`\n[INFO] FooMe is running on port ${actualPort}!`);
    console.log(`[INFO] Opening http://localhost:${actualPort} in your browser...\n`);
    
    // Open browser with the correct port
    setTimeout(() => {
      const url = `http://localhost:${actualPort}`;
      
      // Windows
      if (process.platform === 'win32') {
        exec(`start ${url}`);
      }
      // macOS
      else if (process.platform === 'darwin') {
        exec(`open ${url}`);
      }
      // Linux
      else {
        exec(`xdg-open ${url}`);
      }
    }, 1000); // Small delay to ensure server is fully ready
  }
});

devServer.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

devServer.on('close', (code) => {
  console.log(`\n[INFO] Dev server exited with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n[INFO] Stopping FooMe...');
  devServer.kill();
  process.exit(0);
});



