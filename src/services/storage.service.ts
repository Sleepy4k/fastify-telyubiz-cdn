import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

export class StorageService {
    private uploadDir = path.join(process.cwd(), 'uploads/raw');

    async saveStream(fileStream: NodeJS.ReadableStream, originalName: string): Promise<string> {
        // Generate nama file unik biar tidak bentrok
        const ext = path.extname(originalName);
        const uniqueName = crypto.randomUUID() + ext;
        const filePath = path.join(this.uploadDir, uniqueName);

        // Pipe stream langsung ke file system (Hemat RAM)
        await pipeline(fileStream, fs.createWriteStream(filePath));
        
        return uniqueName;
    }
}