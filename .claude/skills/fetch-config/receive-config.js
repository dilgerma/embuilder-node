#!/usr/bin/env node

import { createServer } from 'http';
import { writeFileSync } from 'fs';

const PORT = 3001;

const server = createServer((req, res) => {
  // Enable CORS for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/config') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        writeFileSync('config.json', JSON.stringify(config, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Config saved successfully' }));
        console.log('\n✅ Config received and saved to config.json');
        console.log('🔒 Server shutting down...\n');
        server.close();
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
        console.error('❌ Error:', error.message);
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. POST JSON to /config');
  }
});

server.listen(PORT, () => {
  console.log('\n🚀 Server listening on http://localhost:' + PORT);
  console.log('📥 Waiting for config from event model app...');
  console.log('📍 POST endpoint: http://localhost:' + PORT + '/config\n');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('❌ Port ' + PORT + ' is already in use. Please stop the other server first.');
  } else {
    console.error('❌ Server error:', error.message);
  }
  process.exit(1);
});
