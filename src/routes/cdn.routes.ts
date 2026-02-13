import type { FastifyInstance } from 'fastify';
import { CdnController } from '../controllers/cdn.controller';

export async function cdnRoutes(fastify: FastifyInstance) {
    const controller = new CdnController();

    // Endpoint Upload (Stream langsung ke Disk)
    fastify.post('/upload', controller.uploadAsset);

    // Endpoint Retrieve (Stream + On-the-fly Optimization)
    // Contoh: /assets/gambar.jpg?w=500&q=80 (Width 500, Quality 80)
    fastify.get('/assets/:filename', controller.getAsset);
}