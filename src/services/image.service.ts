import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export class ImageService {
    private rawDir = path.join(process.cwd(), 'uploads/raw');
    private cacheDir = path.join(process.cwd(), 'uploads/cache');

    async processImage(filename: string, width: number, quality: number): Promise<fs.ReadStream> {
        // 1. Tentukan nama file cache berdasarkan parameter
        // Contoh: gambar-asli.jpg -> gambar-asli_w500_q80.webp
        const parsedQuality = quality < 1 ? 1 : quality > 100 ? 100 : quality;
        const cacheFilename = `${path.parse(filename).name}_w${width}_q${parsedQuality}.webp`;
        const cachePath = path.join(this.cacheDir, cacheFilename);

        // 2. Cek apakah versi cache sudah ada? (Cache Hit)
        if (fs.existsSync(cachePath)) {
            // Langsung return stream dari disk (Super Cepat)
            return fs.createReadStream(cachePath);
        }

        // 3. Jika belum ada, proses gambar (Cache Miss)
        const rawPath = path.join(this.rawDir, filename);
        
        // Teknik Sharp Streaming: Source -> Transform -> File System & Response
        // Kita gunakan .toFile() agar tersimpan, lalu stream ulang
        
        await sharp(rawPath)
          .resize({ width: width, withoutEnlargement: true }) // Resize aman
          .webp({ quality: parsedQuality }) // Convert ke WebP (modern & kecil)
          .toFile(cachePath);

        // 4. Return stream file yang baru dibuat
        return fs.createReadStream(cachePath);
    }
}