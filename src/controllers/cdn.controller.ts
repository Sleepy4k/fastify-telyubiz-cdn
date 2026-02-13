import type { FastifyRequest, FastifyReply } from 'fastify';
import { StorageService } from '../services/storage.service';
import { ImageService } from '../services/image.service';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';

export class CdnController {
    private storageService = new StorageService();
    private imageService = new ImageService();

    // 1. Handle Upload (Streaming)
    uploadAsset = async (req: FastifyRequest, reply: FastifyReply) => {
        const data = await req.file();
        if (!data) return reply.code(400).send({ error: 'No file uploaded' });

        // Generate nama file unik (UUID/Hash)
        const savedFilename = await this.storageService.saveStream(data.file, data.filename);

        return reply.send({
            success: true,
            url: `/v1/assets/${savedFilename}`,
            filename: savedFilename
        });
    };

    // 2. Handle Get Asset (On-the-fly Optimization)
    getAsset = async (req: FastifyRequest, reply: FastifyReply) => {
        const { filename } = req.params as { filename: string };
        const { w, q } = req.query as { w?: string; q?: string }; // Width, Quality

        const width = w ? parseInt(w) : undefined;
        const quality = q ? parseInt(q) : 80;

        try {
            // Cek apakah file asli ada
            const rawPath = path.join(process.cwd(), 'uploads/raw', filename);
            if (!fs.existsSync(rawPath)) return reply.code(404).send('File not found');

            // Optimasi Caching Browser (PENTING untuk performa)
            reply.header('Cache-Control', 'public, max-age=31536000, immutable');
            
            // Jika user minta ukuran asli, stream langsung
            if (!width) {
                const stream = fs.createReadStream(rawPath);
                reply.header('Content-Type', 'image/jpeg'); // Sebaiknya detect mime-type dinamis
                return reply.send(stream);
            }

            // Jika user minta resize/optimasi
            const optimizedStream = await this.imageService.processImage(filename, width, quality);
            
            reply.header('Content-Type', 'image/webp'); // Kita convert ke WebP otomatis
            return reply.send(optimizedStream);

        } catch (error) {
            console.error(error);
            return reply.code(500).send('Internal Server Error');
        }
    };
}