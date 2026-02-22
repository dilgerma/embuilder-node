
import { createServer } from 'http';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'url';

const ROOT = process.cwd();
const CONFIG_PATH = join(ROOT, 'config.json');

const server = createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // ---------------------------------------
    // Health check
    // ---------------------------------------
    if (req.method === 'GET' && req.url === '/api/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'pong' }));
        return;
    }

    // ---------------------------------------
    // Generate endpoint
    // ---------------------------------------
    // inside your request handler
    const { pathname, query } = parse(req.url || '', true);

    if (req.method === 'POST' && pathname === '/api/generate') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                const config = JSON.parse(body);

                // Overwrite config.json
                writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                    JSON.stringify({
                        success: true,
                        path: CONFIG_PATH
                    })
                );

                console.log(`✅ config.json written to ${CONFIG_PATH}`);
                console.log('🛑 Shutting down server...\n');

                // Shutdown AFTER response
                server.close(() => {
                    process.exit(0);
                });

            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(
                    JSON.stringify({
                        success: false,
                        error: error.message
                    })
                );

                console.error('❌ Invalid JSON:', error.message);
            }
        });

        return;
    } else {
        // ---------------------------------------
        // 404
        // ---------------------------------------
        res.writeHead(404);
        res.end('Not found');
    }


});

server.listen(3001, () => {
    console.log('🚀 EMBuilder server running on http://localhost:3001');
    console.log('💓 GET  /api/ping');
    console.log('📥 POST /generate');
});