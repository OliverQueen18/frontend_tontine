import { Injectable } from '@angular/core';

export interface ImageCompressOptions {
  /** Largeur/hauteur max (px). Défaut 1600. */
  maxDimension?: number;
  /** Qualité JPEG/WebP initiale (0–1). Défaut 0.82. */
  quality?: number;
  /** Taille cible max en octets. Défaut ~900 Ko (sous la limite nginx-proxy ~1 Mo). */
  maxBytes?: number;
  /** Type de sortie. Défaut image/jpeg (sauf PNG avec transparence → png). */
  outputType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Compresse les images côté navigateur (canvas) avant upload.
 * Les fichiers non-image (PDF, etc.) sont renvoyés tels quels.
 */
@Injectable({ providedIn: 'root' })
export class ImageCompressService {
  async compress(file: File, options: ImageCompressOptions = {}): Promise<File> {
    if (!file?.type?.startsWith('image/')) {
      return file;
    }
    // SVG : pas de compression canvas pertinente
    if (file.type === 'image/svg+xml') {
      return file;
    }

    const maxDimension = options.maxDimension ?? 1600;
    const maxBytes = options.maxBytes ?? 900_000;
    let quality = options.quality ?? 0.82;

    // Déjà assez petit et dimensions raisonnables → on peut garder tel quel
    if (file.size <= maxBytes) {
      try {
        const dims = await this.readDimensions(file);
        if (dims.width <= maxDimension && dims.height <= maxDimension) {
          return file;
        }
      } catch {
        /* continue compression */
      }
    }

    const bitmap = await this.loadImage(file);
    try {
      const { width, height } = this.fitWithin(bitmap.width, bitmap.height, maxDimension);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);

      const preferPng = file.type === 'image/png' && options.outputType !== 'image/jpeg';
      let outputType: string = options.outputType ?? (preferPng ? 'image/png' : 'image/jpeg');
      // PNG ne gère pas la qualité : basculer en JPEG pour atteindre la cible
      if (outputType === 'image/png' && file.size > maxBytes) {
        outputType = 'image/jpeg';
      }

      let blob = await this.canvasToBlob(canvas, outputType, quality);
      // Réduire progressivement la qualité jusqu'à la cible
      while (blob && blob.size > maxBytes && quality > 0.4 && outputType !== 'image/png') {
        quality -= 0.1;
        blob = await this.canvasToBlob(canvas, outputType, quality);
      }

      // Dernier recours : réduire encore les dimensions
      if (blob && blob.size > maxBytes) {
        let w = width;
        let h = height;
        let current: Blob = blob;
        while (current.size > maxBytes && w > 640) {
          w = Math.round(w * 0.75);
          h = Math.round(h * 0.75);
          canvas.width = w;
          canvas.height = h;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(bitmap, 0, 0, w, h);
          const next = await this.canvasToBlob(canvas, 'image/jpeg', 0.7);
          if (!next) break;
          current = next;
        }
        blob = current;
        outputType = 'image/jpeg';
      }

      if (!blob) return file;

      const ext = outputType === 'image/png' ? 'png' : outputType === 'image/webp' ? 'webp' : 'jpg';
      const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
      return new File([blob], `${baseName}.${ext}`, {
        type: outputType,
        lastModified: Date.now()
      });
    } finally {
      if (typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap) {
        bitmap.close();
      }
    }
  }

  private fitWithin(w: number, h: number, max: number): { width: number; height: number } {
    if (w <= max && h <= max) return { width: w, height: h };
    const ratio = Math.min(max / w, max / h);
    return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
  }

  private loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === 'function') {
      return createImageBitmap(file);
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Impossible de lire l\'image'));
      };
      img.src = url;
    });
  }

  private readDimensions(file: File): Promise<{ width: number; height: number }> {
    return this.loadImage(file).then(img => {
      const width = 'naturalWidth' in img ? img.naturalWidth : img.width;
      const height = 'naturalHeight' in img ? img.naturalHeight : img.height;
      if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
        img.close();
      }
      return { width, height };
    });
  }

  private canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), type, quality);
    });
  }
}
