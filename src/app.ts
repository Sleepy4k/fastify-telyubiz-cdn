import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import path from 'path';
import fs from 'fs';
import { cdnRoutes } from './routes/cdn.routes';

const app = Fastify({ logger: true });

// Register Multipart untuk upload
app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 } // Limit 50MB
});

// Pastikan folder upload ada
const uploadDirs = ['uploads/raw', 'uploads/cache'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Register Routes
app.register(cdnRoutes, { prefix: '/v1' });

const start = async () => {
    try {
        await app.listen({ port: 3000, host: '0.0.0.0' });
        console.log('🚀 CDN Server running on port 3000');
    } catch (err) {
        process.exit(1);
    }
};

start();